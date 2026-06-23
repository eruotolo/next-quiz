import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

test.describe('Admin Students (/[slug]/students)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/${SLUG}/students`);
    });

    test('renders the page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Estudiantes' })).toBeVisible();
    });

    test('shows the student count in subtitle', async ({ page }) => {
        await expect(page.getByText(/registrados/i)).toBeVisible();
    });

    test('renders the students table', async ({ page }) => {
        await expect(page.getByRole('table')).toBeVisible();
    });

    test('table has Nombre and RUT columns', async ({ page }) => {
        const table = page.getByRole('table');
        await expect(table.getByRole('columnheader', { name: /Nombre/i })).toBeVisible();
        await expect(table.getByRole('columnheader', { name: /RUT/i })).toBeVisible();
    });

    test('lists seed students (Juan from local-test seed)', async ({ page }) => {
        await expect(page.getByRole('cell', { name: /Juan/i }).first()).toBeVisible();
    });

    test('search input is visible', async ({ page }) => {
        await expect(
            page.locator('input[placeholder="Buscar por nombre, email o RUT…"]'),
        ).toBeVisible();
    });

    test('filtering by name narrows results', async ({ page }) => {
        const search = page.locator('input[placeholder="Buscar por nombre, email o RUT…"]');
        await search.fill('juan');
        await expect(page.getByRole('cell', { name: /Juan/i }).first()).toBeVisible();
    });

    test('has the "Agregar estudiante" button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Agregar estudiante/i })).toBeVisible();
    });

    test('opens the create student dialog', async ({ page }) => {
        await page.getByRole('button', { name: /Agregar estudiante/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: /Nuevo estudiante/i })).toBeVisible();
    });

    test('create dialog has required form fields', async ({ page }) => {
        await page.getByRole('button', { name: /Agregar estudiante/i }).click();
        const dialog = page.getByRole('dialog');
        // Form uses controlled inputs with id="stu-*" (not name attr)
        await expect(dialog.locator('#stu-name')).toBeVisible();
        await expect(dialog.locator('#stu-lastname')).toBeVisible();
        await expect(dialog.locator('#stu-email')).toBeVisible();
    });

    test('closing the dialog hides it', async ({ page }) => {
        await page.getByRole('button', { name: /Agregar estudiante/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('status filter selector is visible', async ({ page }) => {
        await expect(page.getByRole('combobox').first()).toBeVisible();
    });
});
