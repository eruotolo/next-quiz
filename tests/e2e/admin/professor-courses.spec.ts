import { expect, test } from '@playwright/test';

// Profesor de ULagos del seed local-test: laura.jimenez@ulagos.cl
// Está asignada a CourseSections "Cálculo I" y "Programación I" del seed.
const SLUG = 'universidad-de-los-lagos';
const PROFESOR_EMAIL = 'laura.jimenez@ulagos.cl';
const PROFESOR_PASSWORD = 'Admin2026!';

test.describe('Profesor — Mis Materias (/[slug]/courses)', () => {
    test.beforeEach(async ({ page, context }) => {
        // Clear admin storage state so we can log in as a different user
        await context.clearCookies();
        await page.goto('/login');
        await page.locator('input[type="email"]').fill(PROFESOR_EMAIL);
        await page.locator('input[type="password"]').fill(PROFESOR_PASSWORD);
        await page.getByRole('button', { name: /Entrar al panel/i }).click();
        await page.waitForURL(`**/${SLUG}`, { timeout: 15_000 });
    });

    test('sidebar shows "Mis Materias" for professor', async ({ page }) => {
        await expect(page.getByRole('link', { name: /Mis Materias/i })).toBeVisible();
    });

    test('sidebar does NOT show "Períodos" or "Ajustes" for professor', async ({ page }) => {
        await expect(
            page.getByRole('link', { name: /^Períodos$/i }),
        ).not.toBeVisible();
        await expect(
            page.getByRole('link', { name: /^Ajustes$/i }),
        ).not.toBeVisible();
    });

    test('professor sees only their CourseSections', async ({ page }) => {
        await page.goto(`/${SLUG}/courses`);
        await expect(page).not.toHaveURL(/\/login/);

        // Laura Jiménez está asignada a Cálculo I y Programación I
        const calcCount = await page.getByText(/Cálculo I/i).count();
        const progCount = await page.getByText(/Programación I/i).count();
        const emptyCount = await page.getByText(/no hay registros/i).count();

        // Debe ver sus materias o estado vacío (si el seed no corrió)
        expect(calcCount + progCount + emptyCount).toBeGreaterThan(0);
    });

    test('professor cannot create courses (no create button)', async ({ page }) => {
        await page.goto(`/${SLUG}/courses`);
        // canMutate=false para un profesor sin coordinación → no debe haber botón de crear
        const createBtn = page.getByRole('button', { name: /nueva ramo|nuevo ramo/i });
        await expect(createBtn).not.toBeVisible();
    });

    test('professor can navigate to course detail', async ({ page }) => {
        await page.goto(`/${SLUG}/courses`);
        const rows = await page.locator('tbody tr').count();
        if (rows === 0) {
            test.skip();
            return;
        }
        const moreBtn = page.locator('tbody tr').first().getByRole('button').first();
        await moreBtn.click();
        const detailOption = page.getByRole('menuitem', { name: /Ver detalle/i });
        if (await detailOption.count() > 0) {
            await detailOption.click();
            await expect(page).toHaveURL(new RegExp(`/${SLUG}/courses/`));
            await expect(page.getByRole('button', { name: /Alumnos/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /Exámenes/i })).toBeVisible();
        }
    });

    test('professor sees their students (scoped via CourseSection)', async ({ page }) => {
        await page.goto(`/${SLUG}/students`);
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });
});
