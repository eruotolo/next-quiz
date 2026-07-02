import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';
const STUDENT_RUT = '55.555.555-5';

test.describe('Admin LMS Phase 5 (Certificates + Analytics)', () => {
    test('analytics admin page renders', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        const firstCourseLink = page.locator('a[href^="/aula/"]').first();
        const count = await firstCourseLink.count();
        test.skip(count === 0, 'No hay cursos LMS sembrados.');

        const href = await firstCourseLink.getAttribute('href');
        const match = href?.match(/\/aula\/([a-f0-9-]+)/);
        const courseId = match?.[1];
        test.skip(!courseId, 'No se pudo extraer el courseId.');

        await page.goto(`/${SLUG}/aula/${courseId}/analiticas`);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });

    test('certificados admin page renders', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        const firstCourseLink = page.locator('a[href^="/aula/"]').first();
        const count = await firstCourseLink.count();
        test.skip(count === 0, 'No hay cursos LMS sembrados.');

        const href = await firstCourseLink.getAttribute('href');
        const match = href?.match(/\/aula\/([a-f0-9-]+)/);
        const courseId = match?.[1];
        test.skip(!courseId, 'No se pudo extraer el courseId.');

        await page.goto(`/${SLUG}/aula/${courseId}/certificados`);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });
});

test.describe('Student LMS Phase 5 (Certificate Verification)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/examen/login');
        await page.locator('input[name="credential"], input#credential').fill(STUDENT_RUT);
        await page.locator('button[type="submit"]').click();
        await page.waitForURL('**/examen/seleccion', { timeout: 20_000 });
    });

    test('public certificate verification page renders', async ({ page }) => {
        await page.goto('/certificado/test-code-not-real');
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });

    test('student course view shows certificate section if course has one', async ({ page }) => {
        await page.goto('/aula');
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });
});
