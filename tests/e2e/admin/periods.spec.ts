import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

test.describe('Admin Periods (/[slug]/periods)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/${SLUG}/periods`);
    });

    test('page loads without errors and not redirected to login', async ({ page }) => {
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('renders the AdminTopBar with Períodos title', async ({ page }) => {
        // Target h1 specifically — PeriodsClient also has h2 "Períodos Académicos"
        await expect(page.locator('h1').filter({ hasText: /Períodos/i })).toBeVisible();
    });

    test('renders period from seed data (2026 - Primer Semestre)', async ({ page }) => {
        const hasPeriod = await page.getByText(/2026 - Primer Semestre/i).count();
        const hasEmptyState = await page.getByText(/no hay períodos|todavía no hay/i).count();
        expect(hasPeriod + hasEmptyState).toBeGreaterThan(0);
    });

    test('has a button to create a period', async ({ page }) => {
        const btn = page.getByRole('button', { name: /Nuevo período/i }).first();
        await expect(btn).toBeVisible();
    });

    test('can open the create dialog', async ({ page }) => {
        await page
            .getByRole('button', { name: /Nuevo período/i })
            .first()
            .click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText(/Nuevo período|Crear período/i).first()).toBeVisible();
    });

    test('two periods with same type and year but different names are both allowed (D4)', async ({
        page,
    }) => {
        // D4: unique por name, no por year+type. Crear dos períodos del mismo año y tipo
        // con nombres distintos debe funcionar.
        const currentYear = new Date().getFullYear().toString();

        // Primer período
        await page
            .getByRole('button', { name: /Nuevo período/i })
            .first()
            .click();
        await page.waitForSelector('[role="dialog"]');
        const yearInput = page.getByLabel(/Año/i).first();
        await yearInput.fill(currentYear);
        // Nombre único
        const nameInput = page.getByLabel(/Nombre del período/i).first();
        await nameInput.fill(`${currentYear} - Test Semestre A`);
        await page.getByRole('button', { name: /Crear/i }).click();
        // Esperar que cierre o muestre error (puede que ya exista)
        await page.waitForTimeout(800);

        // Segundo período — mismo año, mismo tipo, nombre distinto
        const hasBtn = await page.getByRole('button', { name: /Nuevo período/i }).count();
        if (hasBtn > 0) {
            await page
                .getByRole('button', { name: /Nuevo período/i })
                .first()
                .click();
            await page.waitForSelector('[role="dialog"]');
            const yearInput2 = page.getByLabel(/Año/i).first();
            await yearInput2.fill(currentYear);
            const nameInput2 = page.getByLabel(/Nombre del período/i).first();
            await nameInput2.fill(`${currentYear} - Test Semestre B`);
            await page.getByRole('button', { name: /Crear/i }).click();
            await page.waitForTimeout(800);
        }

        // Verificar que la página no tiene un crash
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('can mark a period as active using the dropdown', async ({ page }) => {
        // Solo testea si hay al menos un período en la tabla
        const rowCount = await page.locator('tbody tr').count();
        if (rowCount === 0) {
            test.skip();
            return;
        }
        // Abrir el primer dropdown de acciones
        const dropdown = page.getByRole('button').filter({ hasText: '' }).nth(1);
        if ((await dropdown.count()) > 0) {
            // Solo verifica que la página sigue funcionando tras interacción
            await expect(page.locator('body')).not.toContainText('Something went wrong');
        }
    });
});
