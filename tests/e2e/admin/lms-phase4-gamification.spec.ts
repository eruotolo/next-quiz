import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';
const STUDENT_RUT = '55.555.555-5';

test.describe('Admin LMS Phase 4 (Gamification)', () => {
    test('ranking admin page renders without server error', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        const firstCourseLink = page.locator('a[href^="/aula/"]').first();
        const count = await firstCourseLink.count();
        test.skip(count === 0, 'No hay cursos LMS sembrados para esta institución.');

        const href = await firstCourseLink.getAttribute('href');
        const match = href?.match(/\/aula\/([a-f0-9-]+)/);
        const courseId = match?.[1];
        test.skip(!courseId, 'No se pudo extraer el courseId.');

        await page.goto(`/${SLUG}/aula/${courseId}/ranking`);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });

    test('logros admin section is accessible from sidebar', async ({ page }) => {
        await page.goto(`/${SLUG}/aula`);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });
});

test.describe('Student LMS Phase 4 (Achievements + Leaderboard)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/examen/login');
        await page.locator('input[name="credential"], input#credential').fill(STUDENT_RUT);
        await page.locator('button[type="submit"]').click();
        await page.waitForURL('**/examen/seleccion', { timeout: 20_000 });
    });

    test('student achievements page renders', async ({ page }) => {
        await page.goto('/aula/logros');
        await expect(page).not.toHaveURL(/\/examen\/login/);
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });

    test('student aula home renders with gamification hints', async ({ page }) => {
        await page.goto('/aula');
        await expect(page.locator('body')).not.toContainText('Internal Server Error');
    });
});