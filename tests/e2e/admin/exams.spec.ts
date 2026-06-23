import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

test.describe('Admin Exams (/[slug]/exams)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/${SLUG}/exams`);
    });

    test('loads the exams page without errors', async ({ page }) => {
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('has a "Nuevo examen" button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Nuevo examen/i })).toBeVisible();
    });

    test('opens the create exam dialog', async ({ page }) => {
        await page.getByRole('button', { name: /Nuevo examen/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('create exam dialog has a title field', async ({ page }) => {
        await page.getByRole('button', { name: /Nuevo examen/i }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        // Title input exists in the form
        await expect(dialog.locator('input').first()).toBeVisible();
    });

    test('create exam dialog has a submit button', async ({ page }) => {
        await page.getByRole('button', { name: /Nuevo examen/i }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByRole('button', { name: /Crear examen/i })).toBeVisible();
    });

    test('closing the dialog hides it', async ({ page }) => {
        await page.getByRole('button', { name: /Nuevo examen/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('full create exam flow: creates and cancels an exam', async ({ page }) => {
        await page.getByRole('button', { name: /Nuevo examen/i }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // Fill in title
        await dialog.locator('input').first().fill('Examen E2E Test');

        // Cancel instead of submitting to avoid polluting DB
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
    });
});
