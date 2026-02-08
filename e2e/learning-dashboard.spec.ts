import { expect, test, type Locator, type Page } from '@playwright/test';
import { seedState, type SeedWord } from './helpers/dbSeed';

const toDateKey = (date = new Date()): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getPanelToggle = (page: Page, side: 'left' | 'right') => {
    const index = side === 'left' ? 2 : 3;
    return page.locator(`thead th:nth-child(${index}) input[type="checkbox"]`);
};

const setPanelToggle = async (page: Page, side: 'left' | 'right', on: boolean) => {
    const index = side === 'left' ? 2 : 3;
    const toggle = getPanelToggle(page, side);
    const exists = await toggle.count();
    if (!exists) return false;
    const checked = await toggle.isChecked();
    const label = page.locator(`thead th:nth-child(${index}) label`).first();
    if (on !== checked) {
        await label.click();
    }
    return true;
};

const getRowValues = async (table: Locator, rowIndex: number): Promise<number[]> => {
    const values = await table.locator('tbody tr').nth(rowIndex).locator('td div').allInnerTexts();
    return values
        .map(text => Number(text.trim()))
        .filter(value => !Number.isNaN(value));
};

const getScopeRevealSum = async (page: Page, scopeId: string): Promise<number> => {
    return page.evaluate(async ({ dbName, scopeId: targetScopeId }) => {
        const openRequest = indexedDB.open(dbName);
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            openRequest.onsuccess = () => resolve(openRequest.result);
            openRequest.onerror = () => reject(openRequest.error);
        });

        const sum = await new Promise<number>((resolve, reject) => {
            const tx = db.transaction(['learningDailyStats'], 'readonly');
            const store = tx.objectStore('learningDailyStats');
            const req = store.getAll();
            req.onsuccess = () => {
                const rows = (req.result || []) as Array<{ scopeId: string; revealCount?: number }>;
                resolve(rows
                    .filter(row => row.scopeId === targetScopeId)
                    .reduce((acc, row) => acc + (row.revealCount || 0), 0));
            };
            req.onerror = () => reject(req.error);
            tx.onerror = () => reject(tx.error);
        });

        db.close();
        return sum;
    }, { dbName: 'KotobaNaviDB', scopeId });
};

const PROVERB_WORDS: SeedWord[] = [
    {
        page: 12,
        numberInPage: 1,
        category: 'ことわざ',
        question: '行動するとよい機会に出会うこともある',
        answer: '犬も歩けば棒に当たる',
        rawWord: '犬も歩けば棒に当たる',
        yomigana: 'いぬもあるけばぼうにあたる',
        rawMeaning: '行動するとよい機会に出会うこともある',
        isLearnedCategory: true,
        isLearnedMeaning: false
    }
];

test.describe('Learning dashboard e2e', () => {
    test('見て覚えるのシート透過がダッシュボードに反映される', async ({ page }) => {
        const today = toDateKey();
        await seedState(page, {
            words: PROVERB_WORDS,
            schedules: [{ scopeId: '42A-02', date: today }]
        });

        await page.goto('/view/42A-02');
        await setPanelToggle(page, 'left', true);
        await expect(getPanelToggle(page, 'left')).toBeChecked();

        const revealButton = page.locator('tbody tr:first-child td:nth-child(2) button[aria-label="タップで表示"]');
        await expect(revealButton).toBeVisible();
        await revealButton.click();
        await expect.poll(async () => getScopeRevealSum(page, '42A-02')).toBeGreaterThan(0);

        await page.goto('/learning/42A-02');
        await expect(page.getByText('学習グラフ（全体）')).toBeVisible();

        const overallTable = page.locator('section').filter({ has: page.getByText('学習グラフ（全体）') }).locator('table').first();
        const revealValues = await getRowValues(overallTable, 0); // シート学習
        expect(revealValues.some(value => value > 0)).toBeTruthy();
    });

    test('最終テストでやり直しするとテスト忘却が記録される', async ({ page }) => {
        const today = toDateKey();
        await seedState(page, {
            words: PROVERB_WORDS,
            schedules: [{ scopeId: '42A-02', date: today }]
        });

        await page.goto('/test/42A-02?type=category&final=true');
        await expect(page.getByRole('button', { name: '正解を表示' })).toBeVisible();
        await page.getByRole('button', { name: '正解を表示' }).click();
        await page.getByRole('button', { name: 'やり直し' }).click();
        await expect(page.getByText('お疲れ様でした！')).toBeVisible();

        await page.goto('/learning/42A-02');
        await expect(page.getByText('学習グラフ（全体）')).toBeVisible();

        const overallTable = page.locator('section').filter({ has: page.getByText('学習グラフ（全体）') }).locator('table').first();
        const forgotValues = await getRowValues(overallTable, 3); // テスト忘却
        expect(forgotValues.some(value => value > 0)).toBeTruthy();
    });
});
