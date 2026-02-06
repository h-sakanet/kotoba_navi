import { expect, test } from '@playwright/test';
import { seedWords } from './helpers/dbSeed';
import { WORD_LIST_VISUAL_CASES } from './fixtures/wordListVisualCases';

const editableFieldSelector = [
    'td:nth-child(2) textarea',
    'td:nth-child(2) input',
    'td:nth-child(3) textarea',
    'td:nth-child(3) input'
].join(', ');

const toToken = (scopeId: string) => `E2E_EDIT_${scopeId.replace(/[^A-Za-z0-9]/g, '_')}`;

test.describe('WordList edit persistence', () => {
    for (const visualCase of WORD_LIST_VISUAL_CASES) {
        test(`${visualCase.scopeId} ${visualCase.name} 編集保存が反映される`, async ({ page }) => {
            await seedWords(page, visualCase.words);
            await page.goto(`/view/${visualCase.scopeId}`);

            const firstRow = page.locator('tbody tr').first();
            await expect(firstRow).toBeVisible();

            const editButton = firstRow.locator('td:nth-child(5) button');
            await expect(editButton).toBeEnabled();
            await editButton.click();

            const editableField = firstRow.locator(editableFieldSelector).first();
            await expect(editableField).toBeVisible();

            const oldValue = await editableField.inputValue();
            const token = toToken(visualCase.scopeId);
            const newValue = oldValue.trim().length > 0 ? `${oldValue} ${token}` : token;
            await editableField.fill(newValue);

            const saveButton = firstRow.locator('td:nth-child(5) button');
            await saveButton.click();

            const reopenEditButton = firstRow.locator('td:nth-child(5) button');
            await expect(reopenEditButton).toBeEnabled();
            await reopenEditButton.click();
            const editedFieldInEditMode = firstRow.locator(editableFieldSelector).first();
            await expect(editedFieldInEditMode).toBeVisible();
            await expect(editedFieldInEditMode).toHaveValue(new RegExp(token));

            const saveAgainButton = firstRow.locator('td:nth-child(5) button');
            await saveAgainButton.click();

            await page.reload();
            const reloadedFirstRow = page.locator('tbody tr').first();
            const reloadedEditButton = reloadedFirstRow.locator('td:nth-child(5) button');
            await expect(reloadedEditButton).toBeEnabled();
            await reloadedEditButton.click();
            const reloadedField = reloadedFirstRow.locator(editableFieldSelector).first();
            await expect(reloadedField).toBeVisible();
            await expect(reloadedField).toHaveValue(new RegExp(token));
        });
    }
});
