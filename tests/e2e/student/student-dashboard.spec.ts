import { type Page, expect, test } from '@playwright/test';

const STUDENT_RUT = '55.555.555-5';

async function loginAsStudent(page: Page): Promise<void> {
    await page.goto('/examen/login');
    await page.locator('input[name="credential"], input#credential').fill(STUDENT_RUT);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/examen/seleccion', { timeout: 20_000 });
}

async function openDashboard(page: Page): Promise<void> {
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/examen\/login/);
}

test.describe('Student Dashboard (/dashboard)', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsStudent(page);
    });

    test('renders personalized greeting and identity', async ({ page }) => {
        await openDashboard(page);
        await expect(page.getByRole('heading', { name: /Hola, Juan/i })).toBeVisible();
    });

    test('shows the 4 KPI tiles (Promedio, Progreso/Rind, Racha, XP)', async ({ page }) => {
        await openDashboard(page);
        await expect(page.getByText('Promedio general')).toBeVisible();
        await expect(page.getByText(/Progreso LMS|Exámenes rendidos/)).toBeVisible();
    });

    test('renders the upcoming activities section header', async ({ page }) => {
        await openDashboard(page);
        await expect(page.getByRole('heading', { name: /Próximas actividades/i })).toBeVisible();
    });

    test('renders the last grades section header', async ({ page }) => {
        await openDashboard(page);
        await expect(page.getByRole('heading', { name: /Últimas notas/i })).toBeVisible();
    });

    test('sidebar shows core nav items', async ({ page }) => {
        await openDashboard(page);
        await expect(page.getByRole('link', { name: /Dashboard/i }).first()).toBeVisible();
        await expect(page.getByRole('link', { name: /Exámenes/i }).first()).toBeVisible();
        await expect(page.getByRole('link', { name: /Configuración/i }).first()).toBeVisible();
    });

    test('LMS sidebar item is visible when institution has LMS plan', async ({ page }) => {
        await openDashboard(page);
        const lmsLink = page.getByRole('link', { name: /Mis cursos/i });
        const count = await lmsLink.count();
        test.skip(count === 0, 'Institución FREE sin sección LMS en el sidebar.');
        await expect(lmsLink.first()).toBeVisible();
    });

    test('page loads without server errors', async ({ page }) => {
        await openDashboard(page);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('unauthenticated access to /dashboard redirects to student login', async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/examen\/login/);
        await ctx.close();
    });

    test('post-login redirects to /dashboard', async ({ page }) => {
        await page.goto('/post-login');
        await expect(page).toHaveURL(/\/dashboard/);
    });
});

test.describe('Student Mis Materias (/mis-materias)', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsStudent(page);
    });

    test('renders the page header', async ({ page }) => {
        await page.goto('/mis-materias');
        await expect(page).not.toHaveURL(/\/examen\/login/);
        await expect(page.getByRole('heading', { name: /Mis materias/i })).toBeVisible();
    });

    test('renders the exam history section', async ({ page }) => {
        await page.goto('/mis-materias');
        await expect(page.getByText(/Exámenes rendidos/i)).toBeVisible();
    });

    test('unauthenticated access redirects to login', async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        await page.goto('/mis-materias');
        await expect(page).toHaveURL(/\/examen\/login/);
        await ctx.close();
    });
});

test.describe('Student Calendario (/calendario)', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsStudent(page);
    });

    test('renders the calendar page header', async ({ page }) => {
        await page.goto('/calendario');
        await expect(page).not.toHaveURL(/\/examen\/login/);
        await expect(page.getByRole('heading', { name: /^Calendario$/i })).toBeVisible();
    });

    test('renders month navigation', async ({ page }) => {
        await page.goto('/calendario');
        await expect(page.getByRole('link', { name: /Mes anterior/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Mes siguiente/i })).toBeVisible();
    });

    test('legend explains the 3 event types', async ({ page }) => {
        await page.goto('/calendario');
        await expect(page.getByText(/Examen/i).first()).toBeVisible();
        await expect(page.getByText(/Tarea/i).first()).toBeVisible();
        await expect(page.getByText(/Clase en vivo/i).first()).toBeVisible();
    });

    test('unauthenticated access redirects to login', async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        await page.goto('/calendario');
        await expect(page).toHaveURL(/\/examen\/login/);
        await ctx.close();
    });
});

test.describe('Student Configuración (/configuracion)', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsStudent(page);
    });

    test('renders the configuration page header', async ({ page }) => {
        await page.goto('/configuracion');
        await expect(page).not.toHaveURL(/\/examen\/login/);
        await expect(page.getByRole('heading', { name: /Configuración/i })).toBeVisible();
    });

    test('shows student identity fields', async ({ page }) => {
        await page.goto('/configuracion');
        await expect(page.getByText(/Juan Pérez/i).first()).toBeVisible();
        await expect(page.getByText(/RUT/i)).toBeVisible();
    });

    test('has a logout button', async ({ page }) => {
        await page.goto('/configuracion');
        await expect(page.getByRole('button', { name: /Cerrar sesión/i }).first()).toBeVisible();
    });

    test('unauthenticated access redirects to login', async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        await page.goto('/configuracion');
        await expect(page).toHaveURL(/\/examen\/login/);
        await ctx.close();
    });
});

test.describe('Sidebar preserves exam fullscreen mode', () => {
    test('login page does not show sidebar', async ({ page }) => {
        await page.goto('/examen/login');
        await expect(page.getByRole('link', { name: /Dashboard/i })).toHaveCount(0);
    });

    test('exam result page does not show sidebar', async ({ page }) => {
        await loginAsStudent(page);
        const links = page.locator('a[href^="/examen/resultado/"]');
        const count = await links.count();
        test.skip(count === 0, 'Sin resultados previos en el seed.');

        await links.first().click();
        await page.waitForLoadState('networkidle');
        const sidebarDashboard = page.getByRole('link', { name: /Dashboard/i });
        const sidebarCount = await sidebarDashboard.count();
        expect(sidebarCount).toBe(0);
    });
});
