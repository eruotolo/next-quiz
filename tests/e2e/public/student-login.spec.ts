import { expect, test } from '@playwright/test';

test.describe('Student Login Page (/examen/login)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/examen/login');
    });

    test('renders the page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Hola, identificate.' })).toBeVisible();
    });

    test('shows "Acceso estudiante" label', async ({ page }) => {
        // Use span locator to avoid strict mode violation with <title> tag
        await expect(
            page.locator('span').getByText('Acceso estudiante', { exact: true }),
        ).toBeVisible();
    });

    test('renders the credential input', async ({ page }) => {
        await expect(page.locator('input[name="credential"]')).toBeVisible();
    });

    test('shows correct placeholder in credential input', async ({ page }) => {
        await expect(page.locator('input[name="credential"]')).toHaveAttribute(
            'placeholder',
            '12.345.678-9 o alumno@correo.cl',
        );
    });

    test('renders the submit button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Entrar al examen/i })).toBeVisible();
    });

    test('shows Aulika branding', async ({ page }) => {
        await expect(page.getByText('Aulika').first()).toBeVisible();
    });

    test('shows link to admin panel', async ({ page }) => {
        await expect(page.getByRole('link', { name: /Panel administrativo/i })).toBeVisible();
    });

    test('admin link points to /login', async ({ page }) => {
        const link = page.getByRole('link', { name: /Panel administrativo/i });
        await expect(link).toHaveAttribute('href', '/login');
    });

    test('shows error on non-existent RUT', async ({ page }) => {
        await page.locator('input[name="credential"]').fill('00.000.000-0');
        await page.getByRole('button', { name: /Entrar al examen/i }).click();
        await expect(page.locator('.bg-danger-wash').first()).toBeVisible({ timeout: 10_000 });
    });

    test('submit button is disabled while pending', async ({ page }) => {
        await page.locator('input[name="credential"]').fill('12.345.678-5');
        // Capture the submit button by type to survive spinner replacing button text
        const submitBtn = page.locator('form button[type="submit"]');
        await submitBtn.click();
        await expect(submitBtn).toBeDisabled({ timeout: 3_000 });
    });

    test('page renders a main container', async ({ page }) => {
        await expect(page.locator('main')).toBeVisible();
    });
});
