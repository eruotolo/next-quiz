import { expect, test } from '@playwright/test';

test.describe('SuperAdmin Config Panel (/config)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/config');
    });

    test('renders the Panel SuperAdmin heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Panel SuperAdmin/i })).toBeVisible();
    });

    test('page loads without errors', async ({ page }) => {
        await expect(page.locator('body')).not.toContainText('Something went wrong');
        await expect(page.locator('body')).not.toContainText('Unauthorized');
    });

    test('shows institution count stat', async ({ page }) => {
        const main = page.locator('main');
        await expect(main.getByText(/instituciones/i).first()).toBeVisible({ timeout: 10_000 });
    });

    test('shows sidebar with SuperAdmin navigation', async ({ page }) => {
        await expect(page.getByRole('link', { name: 'Instituciones' }).first()).toBeVisible();
        await expect(page.getByRole('link', { name: 'Administradores' }).first()).toBeVisible();
        await expect(page.getByRole('link', { name: 'Auditoría' }).first()).toBeVisible();
    });

    test('navigates to institutions', async ({ page }) => {
        await page.getByRole('link', { name: 'Instituciones' }).first().click();
        await expect(page).toHaveURL('/config/institutions');
        await expect(page.getByRole('heading', { name: /Instituciones/i })).toBeVisible();
    });

    test('navigates to admins management', async ({ page }) => {
        await page.getByRole('link', { name: 'Administradores' }).first().click();
        await expect(page).toHaveURL('/config/admins');
        await expect(page.getByRole('heading', { name: /Gestión de Accesos/i })).toBeVisible();
    });

    test('navigates to audit log', async ({ page }) => {
        await page.getByRole('link', { name: 'Auditoría' }).first().click();
        await expect(page).toHaveURL('/config/auditoria');
    });

    test('navigates to system settings', async ({ page }) => {
        await page.getByRole('link', { name: 'Sistema' }).first().click();
        await expect(page).toHaveURL('/config/settings');
    });
});

test.describe('SuperAdmin Institutions (/config/institutions)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/config/institutions');
    });

    test('renders institutions heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Instituciones/i })).toBeVisible();
    });

    test('shows seed institutions in the table', async ({ page }) => {
        await expect(page.getByText('Universidad de Los Lagos')).toBeVisible();
        await expect(page.getByText('Instituto Profesional Pacífico')).toBeVisible();
    });

    test('has a create institution button', async ({ page }) => {
        await expect(
            page.getByRole('button', { name: /Crear|Nueva|Agregar/i }).first(),
        ).toBeVisible();
    });
});

test.describe('SuperAdmin Admins (/config/admins)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/config/admins');
    });

    test('renders gestión de accesos heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Gestión de Accesos/i })).toBeVisible();
    });

    test('shows seed admin users', async ({ page }) => {
        await expect(page.getByText(/carlos\.lopez@ulagos\.cl/i)).toBeVisible();
    });
});

test.describe('SuperAdmin Auth Guards', () => {
    test('all config routes respond without server errors', async ({ page }) => {
        const routes = [
            '/config',
            '/config/institutions',
            '/config/admins',
            '/config/auditoria',
            '/config/settings',
            '/config/billing',
            '/config/subscriptions',
            '/config/plan-limits',
        ];

        for (const route of routes) {
            await page.goto(route);
            await expect(page.locator('body')).not.toContainText('Something went wrong');
            await expect(page).not.toHaveURL(/\/login/);
        }
    });
});
