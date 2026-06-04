import { expect, test } from '@playwright/test';

test.describe('Admin Login Page (/login)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('renders the login page title', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Acceso administrativo' })).toBeVisible();
    });

    test('renders email and password inputs', async ({ page }) => {
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('renders the submit button', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Ingresar al panel' })).toBeVisible();
    });

    test('shows Aulika branding', async ({ page }) => {
        await expect(page.getByText('Aulika').first()).toBeVisible();
    });

    test('shows link to student login', async ({ page }) => {
        await expect(page.getByRole('link', { name: 'Accedé aquí' })).toBeVisible();
    });

    test('student link points to /examen/login', async ({ page }) => {
        const link = page.getByRole('link', { name: 'Accedé aquí' });
        await expect(link).toHaveAttribute('href', '/examen/login');
    });

    test('shows password toggle button', async ({ page }) => {
        // Eye icon button to show/hide password
        const toggleBtn = page.locator('button[tabindex="-1"]');
        await expect(toggleBtn).toBeVisible();
    });

    test('password field toggles visibility', async ({ page }) => {
        const passwordInput = page.locator('input[type="password"]');
        const toggleBtn = page.locator('button[tabindex="-1"]');

        await expect(passwordInput).toBeVisible();
        await toggleBtn.click();
        // After toggle, password input becomes type="text" — no longer type="password"
        await expect(passwordInput).not.toBeVisible();
    });

    test('shows error on wrong credentials', async ({ page }) => {
        await page.locator('input[type="email"]').fill('wrong@example.com');
        await page.locator('input[type="password"]').fill('wrongpassword');
        await page.getByRole('button', { name: 'Ingresar al panel' }).click();
        await expect(page.getByText('Email o contraseña incorrectos.')).toBeVisible({
            timeout: 10000,
        });
    });

    test('submit button is disabled while loading', async ({ page }) => {
        await page.locator('input[type="email"]').fill('admin@test.com');
        await page.locator('input[type="password"]').fill('password123');

        const button = page.getByRole('button', { name: /Ingresar al panel/i });
        await button.click();

        // Button disables immediately while request is in flight
        await expect(button).toBeDisabled();
    });
});
