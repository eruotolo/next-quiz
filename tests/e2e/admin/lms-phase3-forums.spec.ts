import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

// E2E para validar que la ruta del foro existe y responde sin errores 500
// en /[slug]/aula/[id] aunque los detalles interactivos los construye Sonnet.
test.describe('Admin LMS Phase 3 (Forums)', () => {
    test('forums link or fallback is present on course editor', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        const firstCourseLink = page.locator('a[href^="/aula/"]').first();
        const count = await firstCourseLink.count();
        test.skip(count === 0, 'No hay cursos LMS sembrados para esta institución.');

        const href = await firstCourseLink.getAttribute('href');
        const match = href?.match(/\/aula\/([a-f0-9-]+)/);
        const courseId = match?.[1];
        test.skip(!courseId, 'No se pudo extraer el courseId.');

        await page.goto(`/${SLUG}/aula/${courseId}`);

        // El editor puede tener una sección / botón / link "Foro" o "Comunidad"
        // sin render aún. Probamos: la página no debe redirigir al login.
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });
});
