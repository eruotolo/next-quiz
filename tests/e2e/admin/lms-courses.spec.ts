import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

test.describe('Admin LMS (/[slug]/aula)', () => {
    test('aula page loads without errors', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('admin topbar shows Aula Virtual title', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        await expect(page.getByRole('heading', { name: /Aula Virtual/i })).toBeVisible();
    });

    test('renders LMS list or empty state', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        const emptyState = page.getByText(/No hay cursos en el Aula/i);
        const courseHeader = page.getByRole('heading', { name: /Cursos del Aula Virtual/i });
        const isEmpty = await emptyState.count();
        if (isEmpty > 0) {
            await expect(emptyState).toBeVisible();
        } else {
            await expect(courseHeader).toBeVisible();
        }
    });

    test('can open the create course dialog', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        const newBtn = page.getByRole('button', { name: /Nuevo curso/i }).first();
        await newBtn.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByLabel(/Título/i)).toBeVisible();
    });

    test('can create a new LMS course', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        const courseName = `E2E LMS ${Date.now()}`;

        await page.getByRole('button', { name: /Nuevo curso/i }).first().click();
        await page.waitForSelector('[role="dialog"]');
        await page.getByLabel(/Título/i).fill(courseName);
        await page.getByRole('button', { name: 'Crear curso' }).click();
        await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

        await expect(page.getByText(courseName).first()).toBeVisible();
    });

    test('can open course editor and add a module', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);

        // Abrimos el primer curso disponible (o creamos uno si no hay).
        const emptyState = page.getByText(/No hay cursos en el Aula/i);
        if ((await emptyState.count()) > 0) {
            const courseName = `E2E Module Test ${Date.now()}`;
            await page.getByRole('button', { name: /Nuevo curso/i }).first().click();
            await page.waitForSelector('[role="dialog"]');
            await page.getByLabel(/Título/i).fill(courseName);
            await page.getByRole('button', { name: 'Crear curso' }).click();
            await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
        }

        // Click en el menú "Editar contenido" del primer curso
        const editButton = page.getByRole('link', { name: /Editar contenido/i }).first();
        await editButton.click();
        await expect(page).toHaveURL(new RegExp(`/${SLUG}/aula/[a-f0-9-]+`));

        // Crear un módulo
        const moduleName = `Módulo E2E ${Date.now()}`;
        await page.getByRole('button', { name: /Nuevo módulo/i }).click();
        await page.getByPlaceholder(/Unidad 1/i).fill(moduleName);
        await page.getByRole('button', { name: /^Crear$/i }).click();

        await expect(page.getByText(moduleName)).toBeVisible();
    });
});
