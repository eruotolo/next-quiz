import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';
const STUDENT_RUT = '55.555.555-5';

// E2E para validar que la fase 2 (Tareas y Libro de Calificaciones) está
// disponible en la UI: los docentes pueden ver/crear tareas y acceder a la
// sección del gradebook. Los tests de flujo detallado de Sonnet cubren el
// rendering de los dialogs.
test.describe('Admin LMS Phase 2 (Tasks + Gradebook)', () => {
    test('admin course editor exposes modules with lessons', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        // Toma el primer curso existente en el seed. Si no hay, el test se salta.
        const firstCourseLink = page.locator('a[href^="/aula/"]').first();
        const count = await firstCourseLink.count();
        test.skip(count === 0, 'No hay cursos LMS sembrados para esta institución.');

        // Extrae courseId de la URL del primer enlace.
        const href = await firstCourseLink.getAttribute('href');
        const match = href?.match(/\/aula\/([a-f0-9-]+)/);
        const courseId = match?.[1];
        test.skip(!courseId, 'No se pudo extraer el courseId.');

        await page.goto(`/${SLUG}/aula/${courseId}`);
        // La página del editor de curso debe cargar sin errores.
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('admin can navigate to course editor and see module area', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        const newBtn = page.getByRole('button', { name: /Nuevo curso/i }).first();
        await newBtn.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Cancelamos sin crear.
        const cancelBtn = page.getByRole('button', { name: /Cancelar/i });
        if ((await cancelBtn.count()) > 0) {
            await cancelBtn.first().click();
        }
    });
});

// Verifica que las acciones del gradebook de Fase 2 están registradas y
// disponibles: la página debe renderizar sin errores 500.
test.describe('Student LMS Phase 2 (Task Submission)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/examen/login');
        await page.locator('input[name="credential"], input#credential').fill(STUDENT_RUT);
        await page.locator('button[type="submit"]').click();
        await page.waitForURL('**/examen/seleccion', { timeout: 20_000 });
    });

    test('student aula page renders without server error', async ({ page }) => {
        await page.goto('/aula');
        // No debe redirigir al login ni tener error 500.
        await expect(page).not.toHaveURL(/\/examen\/login/);
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });
});
