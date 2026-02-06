import { expect, test, type Page } from '@playwright/test';
import { seedWords } from './helpers/dbSeed';
import { WORD_LIST_VISUAL_CASES } from './fixtures/wordListVisualCases';

type PanelSide = 'left' | 'right';

const panelIndex: Record<PanelSide, number> = {
    left: 2,
    right: 3
};

const getPanelToggle = (side: PanelSide, page: Page) =>
    page.locator(`thead th:nth-child(${panelIndex[side]}) input[type="checkbox"]`);

const setPanelToggle = async (side: PanelSide, page: Page, on: boolean): Promise<boolean> => {
    const toggle = getPanelToggle(side, page);
    const exists = await toggle.count();
    if (!exists) return false;

    const checked = await toggle.isChecked();
    const label = page.locator(`thead th:nth-child(${panelIndex[side]}) label`).first();
    if (on && !checked) {
        await label.click();
        await expect(toggle).toBeChecked();
    }
    if (!on && checked) {
        await label.click();
        await expect(toggle).not.toBeChecked();
    }
    return true;
};

const capture = async (page: Page, name: string) => {
    await expect(page).toHaveScreenshot(name, { fullPage: true });
};

const revealFirstSheet = async (side: PanelSide, page: Page) => {
    const firstMaskButton = page.locator(
        `tbody tr td:nth-child(${panelIndex[side]}) button[aria-label="タップで表示"]`
    ).first();
    if (await firstMaskButton.count()) {
        await firstMaskButton.click();
        return true;
    }
    return false;
};

test.describe('WordList visual regression', () => {
    for (const visualCase of WORD_LIST_VISUAL_CASES) {
        test(`${visualCase.scopeId} ${visualCase.name}`, async ({ page }) => {
            await seedWords(page, visualCase.words);
            await page.goto(`/view/${visualCase.scopeId}`);
            const rows = page.locator('tbody tr');
            await expect(rows).toHaveCount(visualCase.words.length);

            await capture(page, `${visualCase.scopeId}-default.png`);

            // 1) 習得済み非表示
            const hideMasteredLabel = page.getByText('習得済みを非表示');
            await hideMasteredLabel.click();
            await capture(page, `${visualCase.scopeId}-hide-mastered.png`);
            await hideMasteredLabel.click();
            await expect(rows).toHaveCount(visualCase.words.length);

            const hasLeftToggle = await setPanelToggle('left', page, false);
            const hasRightToggle = await setPanelToggle('right', page, false);

            const firstRowEditButton = page.locator('tbody tr:first-child td:nth-child(5) button');

            // 2) 左マスク系
            if (hasLeftToggle) {
                await setPanelToggle('left', page, true);
                await expect(firstRowEditButton).toBeDisabled();
                await capture(page, `${visualCase.scopeId}-left-mask-on.png`);

                if (await revealFirstSheet('left', page)) {
                    await capture(page, `${visualCase.scopeId}-left-mask-revealed.png`);
                }
            }

            // 3) 右マスク系
            if (hasRightToggle) {
                await setPanelToggle('right', page, true);
                await expect(firstRowEditButton).toBeDisabled();
                await capture(page, `${visualCase.scopeId}-right-mask-on.png`);

                if (hasLeftToggle) {
                    const leftToggle = getPanelToggle('left', page);
                    await expect(leftToggle).not.toBeChecked();
                }

                if (await revealFirstSheet('right', page)) {
                    await capture(page, `${visualCase.scopeId}-right-mask-revealed.png`);
                }
            }

            // 4) 編集モード遷移
            await setPanelToggle('left', page, false);
            await setPanelToggle('right', page, false);
            await expect(firstRowEditButton).toBeEnabled();
            await firstRowEditButton.click();
            await capture(page, `${visualCase.scopeId}-edit-mode.png`);
        });
    }
});
