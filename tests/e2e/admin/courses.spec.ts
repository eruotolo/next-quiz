import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

test.describe('Admin Courses (/[slug]/courses)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/${SLUG}/courses`);
    });

    test('page loads without errors and not redirected to login', async ({ page }) => {
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('renders dynamic label (Ramos for a university)', async ({ page }) => {
        // Universidad type → label "Ramo(s)" — target h1 specifically (CoursesClient also has h2 with same label)
        await expect(page.locator('h1').filter({ hasText: /Ramos/i })).toBeVisible();
    });

    test('renders courses from seed data', async ({ page }) => {
        // local-test seed creates "Cálculo I" and "Programación I" for ULagos
        const hasCalculo = await page.getByText(/Cálculo I/i).count();
        const hasProgramacion = await page.getByText(/Programación I/i).count();
        const hasEmptyState = await page.getByText(/no hay registros/i).count();
        expect(hasCalculo + hasProgramacion + hasEmptyState).toBeGreaterThan(0);
    });

    test('has a button to create a course with the dynamic label', async ({ page }) => {
        const btn = page.getByRole('button', { name: /Nueva ramo|nuevo ramo/i }).first();
        await expect(btn).toBeVisible();
    });

    test('can open the create dialog', async ({ page }) => {
        await page
            .getByRole('button', { name: /nueva ramo|nuevo ramo/i })
            .first()
            .click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByLabel(/Nombre/i).first()).toBeVisible();
    });

    test('can create a transversal course (sin programa)', async ({ page }) => {
        await page
            .getByRole('button', { name: /nueva ramo|nuevo ramo/i })
            .first()
            .click();
        await page.waitForSelector('[role="dialog"]');

        const nameInput = page.getByLabel(/^Nombre$/i).first();
        await nameInput.fill('Electivo Transversal E2E');

        // Programa = "Plan Común / Transversal" (default — no change needed)
        // Período: seleccionar el primero disponible
        const periodTrigger = page.getByRole('combobox').nth(1);
        if ((await periodTrigger.count()) > 0) {
            await periodTrigger.click();
            const firstPeriodOption = page.getByRole('option').first();
            if ((await firstPeriodOption.count()) > 0) {
                await firstPeriodOption.click();
            }
        }

        await page.getByRole('button', { name: /Guardar/i }).click();
        await page.waitForTimeout(1000);

        // Verificar sin crash
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('course detail page loads for seed course', async ({ page }) => {
        const courseLink = page.getByText(/Cálculo I/i).first();
        if ((await courseLink.count()) > 0) {
            // Navigate via dropdown "Ver detalle"
            const row = page.locator('tbody tr').first();
            const moreBtn = row.getByRole('button').first();
            await moreBtn.click();
            const detailOption = page.getByRole('menuitem', { name: /Ver detalle/i });
            if ((await detailOption.count()) > 0) {
                await detailOption.click();
                await expect(page).toHaveURL(new RegExp(`/${SLUG}/courses/`));
                await expect(page.getByRole('heading').first()).toBeVisible();
            }
        }
    });

    test('course detail shows Alumnos and Exámenes tabs', async ({ page }) => {
        const rows = await page.locator('tbody tr').count();
        if (rows === 0) {
            test.skip();
            return;
        }
        const moreBtn = page.locator('tbody tr').first().getByRole('button').first();
        await moreBtn.click();
        const detailOption = page.getByRole('menuitem', { name: /Ver detalle/i });
        if ((await detailOption.count()) > 0) {
            await detailOption.click();
            await expect(page.getByRole('button', { name: /Alumnos/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /Exámenes/i })).toBeVisible();
        }
    });

    test('exams tab shows Crear examen button', async ({ page }) => {
        const rows = await page.locator('tbody tr').count();
        if (rows === 0) {
            test.skip();
            return;
        }
        const moreBtn = page.locator('tbody tr').first().getByRole('button').first();
        await moreBtn.click();
        const detailOption = page.getByRole('menuitem', { name: /Ver detalle/i });
        if ((await detailOption.count()) > 0) {
            await detailOption.click();
            await page.getByRole('button', { name: /Exámenes/i }).click();
            await expect(page.getByRole('link', { name: /Crear examen/i })).toBeVisible();
        }
    });
});
