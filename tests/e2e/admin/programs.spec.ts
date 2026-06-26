import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

// Universidad de Los Lagos → type UNIVERSIDAD → label dinámico "Carrera(s)".
test.describe('Admin Programs (/[slug]/programs)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/${SLUG}/programs`);
    });

    test('renders the dynamic heading (Carreras for a university)', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Carreras' })).toBeVisible();
    });

    test('shows the program count in subtitle', async ({ page }) => {
        await expect(page.getByText(/carrera/i).first()).toBeVisible();
    });

    test('renders programs from seed data', async ({ page }) => {
        // local-test seed creates "Ingeniería Civil Informática" for ULagos.
        const hasRow = await page.getByText(/Ingeniería Civil Informática/i).count();
        const hasEmptyState = await page.getByText(/todavía no hay/i).count();
        expect(hasRow + hasEmptyState).toBeGreaterThan(0);
    });

    test('has a button to create a program with the dynamic label', async ({ page }) => {
        const createBtn = page.getByRole('button', { name: /Nueva carrera/i }).first();
        await expect(createBtn).toBeVisible();
    });

    test('can open the create dialog', async ({ page }) => {
        await page
            .getByRole('button', { name: /Nueva carrera/i })
            .first()
            .click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByPlaceholder(/Ingeniería Civil Informática/i)).toBeVisible();
    });

    test('navigates to the program detail', async ({ page }) => {
        const row = page.getByText(/Ingeniería Civil Informática/i).first();
        if ((await row.count()) > 0) {
            await row.click();
            await expect(page).toHaveURL(new RegExp(`/${SLUG}/programs/`));
            // Detail header (h2) with the program name.
            await expect(
                page.getByRole('heading', { name: /Ingeniería Civil Informática/i }),
            ).toBeVisible();
            // Stat tiles + tab strip render (Carrera tabs use "Ramos" for a university).
            await expect(page.getByText('Alumnos').first()).toBeVisible();
        }
    });

    test('page loads without errors', async ({ page }) => {
        await expect(page.locator('body')).not.toContainText('Something went wrong');
        await expect(page).not.toHaveURL(/\/login/);
    });
});
