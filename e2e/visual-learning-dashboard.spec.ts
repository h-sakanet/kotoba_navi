import { expect, test, type Page } from '@playwright/test';
import { seedState } from './helpers/dbSeed';
import { LEARNING_DASHBOARD_VISUAL_CASES } from './fixtures/learningDashboardCases';

const capture = async (page: Page, name: string) => {
    await expect(page).toHaveScreenshot(name, { fullPage: true });
};

test.describe('Learning dashboard visual regression', () => {
    for (const visualCase of LEARNING_DASHBOARD_VISUAL_CASES) {
        test(`${visualCase.scopeId} ${visualCase.name}`, async ({ page }) => {
            await seedState(page, {
                words: visualCase.words,
                schedules: visualCase.schedules,
                learningDailyStats: visualCase.learningDailyStats
            });

            await page.goto(`/learning/${visualCase.scopeId}`);
            await expect(page.getByText('学習グラフ（全体）')).toBeVisible();
            await capture(page, `${visualCase.scopeId}-${visualCase.name}.png`);
        });
    }
});
