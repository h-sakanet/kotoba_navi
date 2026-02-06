import { expect, test, type Page } from '@playwright/test';
import { seedWords, type SeedWord } from './helpers/dbSeed';
import { WORD_LIST_VISUAL_CASES } from './fixtures/wordListVisualCases';

const toTestModeWords = (words: SeedWord[]): SeedWord[] =>
    words.slice(0, 1).map((word) => ({
        ...word,
        // 1件だけ投入してランダム性を排除する
        isLearnedCategory: false,
        isLearnedMeaning: true
    }));

const capture = async (page: Page, name: string) => {
    await expect(page).toHaveScreenshot(name, { fullPage: true });
};

test.describe('Test mode e2e', () => {
    for (const visualCase of WORD_LIST_VISUAL_CASES) {
        test(`${visualCase.scopeId} ${visualCase.name} 未習得1件で出題・完了`, async ({ page }) => {
            await seedWords(page, toTestModeWords(visualCase.words));
            await page.goto(`/test/${visualCase.scopeId}?type=category`);

            await expect(page.getByRole('button', { name: '正解を表示' })).toBeVisible();
            await capture(page, `${visualCase.scopeId}-test-question.png`);

            await page.getByRole('button', { name: '正解を表示' }).click();
            await expect(page.getByRole('button', { name: '覚えた！' })).toBeVisible();
            await capture(page, `${visualCase.scopeId}-test-answer.png`);

            await page.getByRole('button', { name: '覚えた！' }).click();
            await expect(page.getByText('お疲れ様でした！')).toBeVisible();
            await capture(page, `${visualCase.scopeId}-test-complete.png`);

            // 習得フラグ更新後、再入場すると課題なしになることを確認
            await page.goto(`/test/${visualCase.scopeId}?type=category`);
            await expect(page.getByText('課題はありません')).toBeVisible();
        });
    }
});
