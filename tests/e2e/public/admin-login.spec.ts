import { expect, test } from '@playwright/test';

test.describe('Admin Login Page (/login)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('renders the login page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    });

    test('shows "Acceso docente" label', async ({ page }) => {
        // Use exact + locator to avoid matching the <title> tag
        await expect(
            page.locator('span').getByText('Acceso docente', { exact: true }),
        ).toBeVisible();
    });

    test('renders email and password inputs', async ({ page }) => {
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('renders the submit button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Entrar al panel/i })).toBeVisible();
    });

    test('shows Aulika branding', async ({ page }) => {
        await expect(page.getByText('Aulika').first()).toBeVisible();
    });

    test('shows link to student login', async ({ page }) => {
        await expect(page.getByRole('link', { name: /Accedé aquí/i })).toBeVisible();
    });

    test('student link points to /examen/login', async ({ page }) => {
        const link = page.getByRole('link', { name: /Accedé aquí/i });
        await expect(link).toHaveAttribute('href', '/examen/login');
    });

    test('shows Google sign-in button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Continuar con Google/i })).toBeVisible();
    });

    test('shows password toggle button', async ({ page }) => {
        const toggleBtn = page.locator('button[tabindex="-1"]');
        await expect(toggleBtn).toBeVisible();
    });

    test('password field toggles to text on click', async ({ page }) => {
        const passwordInput = page.locator('input[type="password"]');
        const toggleBtn = page.locator('button[tabindex="-1"]');

        await expect(passwordInput).toBeVisible();
        await toggleBtn.click();
        await expect(page.locator('input[type="text"]')).toBeVisible();
    });

    test('shows error on wrong credentials', async ({ page }) => {
        await page.locator('input[type="email"]').fill('wrong@example.com');
        await page.locator('input[type="password"]').fill('wrongpassword');
        await page.getByRole('button', { name: /Entrar al panel/i }).click();
        await expect(page.getByText('Email o contraseña incorrectos.')).toBeVisible({
            timeout: 10_000,
        });
    });

    test('submit button shows spinner while loading', async ({ page }) => {
        await page.locator('input[type="email"]').fill('admin@test.com');
        await page.locator('input[type="password"]').fill('wrongpassword123');

        // Click and immediately assert spinner appears (button content changes)
        const submitBtn = page.locator('button[type="submit"]');
        await submitBtn.click();
        // While the request is in-flight, the button shows a spinner (Loader2 SVG)
        // and is disabled — we check for the disabled state via aria
        await expect(submitBtn).toBeDisabled({ timeout: 3_000 });
    });
});
