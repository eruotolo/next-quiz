import { expect, test } from '@playwright/test';

const STUDENT_RUT = '55.555.555-5';

test.describe('Student LMS Flow (/aula)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/examen/login');
        await page.locator('input[name="credential"], input#credential').fill(STUDENT_RUT);
        await page.locator('button[type="submit"]').click();
        await page.waitForURL('**/examen/seleccion', { timeout: 20_000 });
    });

    test('aula page loads with student session', async ({ page }) => {
        await page.goto('/aula');
        await expect(page).not.toHaveURL(/\/examen\/login/);
        await expect(page.locator('h1').filter({ hasText: /Mis cursos/i })).toBeVisible();
    });

    test('renders enrolled and available courses sections', async ({ page }) => {
        await page.goto('/aula');
        // La página siempre muestra al menos una de las dos secciones o el empty state
        const enrolledHeader = page.getByText(/En curso/i);
        const availableHeader = page.getByText(/Disponibles/i);
        const emptyState = page.getByText(/aún no hay cursos/i);
        const matchCount =
            (await enrolledHeader.count()) +
            (await availableHeader.count()) +
            (await emptyState.count());
        expect(matchCount).toBeGreaterThan(0);
    });

    test('student can navigate to a course detail page', async ({ page }) => {
        await page.goto('/aula');
        const firstCourseLink = page.locator('a[href^="/aula/cursos/"]').first();
        const count = await firstCourseLink.count();
        test.skip(count === 0, 'No hay cursos disponibles para el estudiante en el seed.');

        await firstCourseLink.click();
        await expect(page).toHaveURL(/\/aula\/cursos\/[a-f0-9-]+/);
    });

    test('locked course shows inscription button or progress bar', async ({ page }) => {
        await page.goto('/aula');
        const firstCourseLink = page.locator('a[href^="/aula/cursos/"]').first();
        const count = await firstCourseLink.count();
        test.skip(count === 0, 'No hay cursos disponibles para el estudiante en el seed.');

        await firstCourseLink.click();
        await expect(page).toHaveURL(/\/aula\/cursos\/[a-f0-9-]+/);
        // Debe haber al menos el botón de inscripción o la barra de progreso
        const enrollBtn = page.getByRole('button', { name: /Inscribirme/i });
        const progressText = page.getByText(/% completado/i);
        const matchCount = (await enrollBtn.count()) + (await progressText.count());
        expect(matchCount).toBeGreaterThan(0);
    });
});
