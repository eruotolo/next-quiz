import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

// Fase 6 — Jefe de Carrera (ProgramCoordinator). Flujo admin: asignar y quitar
// un coordinador en el detalle de un programa.
test.describe('Admin Coordinators (program detail · Jefe de Carrera)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/${SLUG}/programs`);
        await page
            .getByText(/Ingeniería Civil Informática/i)
            .first()
            .click();
        await expect(page).toHaveURL(new RegExp(`/${SLUG}/programs/`));
        await page.getByRole('button', { name: 'Coordinadores' }).click();
    });

    test('assigns and removes a Jefe de Carrera', async ({ page }) => {
        await expect(page.getByText(/Asignar Jefe de Carrera/i)).toBeVisible();

        // Abrir el select y elegir el primer profesor disponible.
        await page.getByRole('combobox').click();
        const firstOption = page.getByRole('option').first();
        const professorName = (await firstOption.textContent())?.trim() ?? '';
        await firstOption.click();

        await page.getByRole('button', { name: 'Asignar' }).click();

        // El profesor aparece en la tabla de coordinadores.
        if (professorName) {
            await expect(page.getByRole('cell', { name: professorName })).toBeVisible();
        }

        // Quitarlo de nuevo.
        await page.getByRole('button', { name: 'Quitar coordinador' }).first().click();
        await expect(page.getByText(/Sin Jefes de Carrera asignados/i)).toBeVisible();
    });

    test('coordinators tab renders without errors', async ({ page }) => {
        await expect(page.locator('body')).not.toContainText('Something went wrong');
        await expect(page).not.toHaveURL(/\/login/);
    });
});
