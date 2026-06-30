import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';
const STUDENT_RUT = '55.555.555-5';

test.describe('Admin LMS Phase 6 (Live Sessions)', () => {
    test('clases admin listing page renders', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        const firstCourseLink = page.locator('a[href^="/aula/"]').first();
        const count = await firstCourseLink.count();
        test.skip(count === 0, 'No hay cursos LMS sembrados.');

        const href = await firstCourseLink.getAttribute('href');
        const match = href?.match(/\/aula\/([a-f0-9-]+)/);
        const courseId = match?.[1];
        test.skip(!courseId, 'No se pudo extraer el courseId.');

        await page.goto(`/${SLUG}/aula/${courseId}/clases`);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });

    test('nueva clase form renders', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        const firstCourseLink = page.locator('a[href^="/aula/"]').first();
        const count = await firstCourseLink.count();
        test.skip(count === 0, 'No hay cursos LMS sembrados.');

        const href = await firstCourseLink.getAttribute('href');
        const match = href?.match(/\/aula\/([a-f0-9-]+)/);
        const courseId = match?.[1];
        test.skip(!courseId, 'No se pudo extraer el courseId.');

        await page.goto(`/${SLUG}/aula/${courseId}/clases/nueva`);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });
});

test.describe('Student LMS Phase 6 (Live Sessions)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/examen/login');
        await page.locator('input[name="credential"], input#credential').fill(STUDENT_RUT);
        await page.locator('button[type="submit"]').click();
        await page.waitForURL('**/examen/seleccion', { timeout: 20_000 });
    });

    test('student live sessions list renders', async ({ page }) => {
        await page.goto('/aula/clases');
        await expect(page).not.toHaveURL(/\/examen\/login/);
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });
});
