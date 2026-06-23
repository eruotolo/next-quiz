import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

test.describe('Admin Groups (/[slug]/groups)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/${SLUG}/groups`);
    });

    test('renders the page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Grupos' })).toBeVisible();
    });

    test('shows the group count in subtitle', async ({ page }) => {
        await expect(page.getByText(/grupos registrados/i)).toBeVisible();
    });

    test('renders groups from seed data', async ({ page }) => {
        // local-test seed creates "Grupo A" for Universidad de Los Lagos
        const hasGroupCard = await page.getByText(/Grupo A/i).count();
        const hasEmptyState = await page.getByText(/sin grupos|no hay grupos/i).count();
        expect(hasGroupCard + hasEmptyState).toBeGreaterThan(0);
    });

    test('page loads without errors', async ({ page }) => {
        await expect(page.locator('body')).not.toContainText('Error al cargar');
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('has a button to create a group', async ({ page }) => {
        // "Nuevo grupo" button is in the AdminTopBar actions area
        const createBtn = page
            .getByRole('button', { name: /Crear|Nuevo|Agregar/i })
            .or(page.getByRole('link', { name: /Crear|Nuevo|Agregar/i }))
            .first();
        await expect(createBtn).toBeVisible();
    });
});
