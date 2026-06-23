import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

test.describe('Admin Dashboard (/[slug])', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/${SLUG}`);
    });

    test('loads the dashboard without errors', async ({ page }) => {
        await expect(page).toHaveURL(new RegExp(SLUG));
        await expect(page.locator('body')).not.toContainText('Error');
    });

    test('shows a personalized greeting with the admin name', async ({ page }) => {
        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible();
        await expect(heading).toContainText('Carlos');
    });

    test('shows institution stat cards', async ({ page }) => {
        await expect(page.locator('p.uppercase').filter({ hasText: /estudiantes activos/i })).toBeVisible();
        await expect(page.locator('p.uppercase').filter({ hasText: /exámenes abiertos/i })).toBeVisible();
    });

    test('sidebar navigation is rendered', async ({ page }) => {
        await expect(page.getByRole('link', { name: 'Exámenes' }).first()).toBeVisible();
        await expect(page.getByRole('link', { name: 'Estudiantes' }).first()).toBeVisible();
        await expect(page.getByRole('link', { name: 'Grupos' }).first()).toBeVisible();
    });

    test('navigates to students via sidebar', async ({ page }) => {
        await page.getByRole('link', { name: 'Estudiantes' }).first().click();
        await expect(page).toHaveURL(new RegExp(`${SLUG}/students`));
    });

    test('navigates to groups via sidebar', async ({ page }) => {
        await page.getByRole('link', { name: 'Grupos' }).first().click();
        await expect(page).toHaveURL(new RegExp(`${SLUG}/groups`));
    });

    test('navigates to exams via sidebar', async ({ page }) => {
        await page.getByRole('link', { name: 'Exámenes' }).first().click();
        await expect(page).toHaveURL(new RegExp(`${SLUG}/exams`));
    });

    test('navigates to results via sidebar', async ({ page }) => {
        await page.getByRole('link', { name: 'Resultados' }).first().click();
        await expect(page).toHaveURL(new RegExp(`${SLUG}/results`));
    });

    test('navigates to professors via sidebar', async ({ page }) => {
        await page.getByRole('link', { name: 'Profesores' }).first().click();
        await expect(page).toHaveURL(new RegExp(`${SLUG}/professors`));
    });

    test('navigates to settings via sidebar', async ({ page }) => {
        await page.getByRole('link', { name: 'Ajustes' }).first().click();
        await expect(page).toHaveURL(new RegExp(`${SLUG}/settings`));
    });
});
