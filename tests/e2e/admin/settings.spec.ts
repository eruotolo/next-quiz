import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

test.describe('Admin Settings (/[slug]/settings)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/${SLUG}/settings`);
        // Wait for the settings client component to hydrate and render the form
        await page.waitForSelector('input[name="name"]', { timeout: 10_000 });
    });

    test('renders the page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Ajustes del Instituto/i })).toBeVisible();
    });

    test('page loads without errors', async ({ page }) => {
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('shows institution name field', async ({ page }) => {
        const nameInput = page.locator('input[name="name"]');
        await expect(nameInput).toBeVisible();
        await expect(nameInput).toHaveValue('Universidad de Los Lagos');
    });

    test('shows slug field (read-only)', async ({ page }) => {
        await expect(page.getByText(/universidad-de-los-lagos/).first()).toBeVisible({ timeout: 10_000 });
    });

    test('has a save button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Guardar|Actualizar/i })).toBeVisible();
    });
});
