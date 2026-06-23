import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

test.describe('Admin Professors (/[slug]/professors)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/${SLUG}/professors`);
    });

    test('renders the page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Cuerpo Docente/i })).toBeVisible();
    });

    test('shows the professors count in subtitle', async ({ page }) => {
        await expect(page.getByText(/profesionales registrados/i)).toBeVisible();
    });

    test('page loads without errors', async ({ page }) => {
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('renders the professors table or empty state', async ({ page }) => {
        const hasTable = await page.getByRole('table').count();
        const hasEmptyState = await page.getByText(/no hay docentes|sin docentes/i).count();
        expect(hasTable + hasEmptyState).toBeGreaterThan(0);
    });

    test('lists professors from seed data', async ({ page }) => {
        // local-test seed creates 2 admins for Universidad de Los Lagos: María García and Carlos López
        await expect(page.getByText(/María|García|Carlos|López/i).first()).toBeVisible();
    });

    test('has a button to add a professor', async ({ page }) => {
        const btn = page.getByRole('button', { name: /Agregar|Crear|Nuevo/i }).first();
        await expect(btn).toBeVisible();
    });
});
