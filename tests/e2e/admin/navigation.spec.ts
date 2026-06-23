import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';
const OTHER_SLUG = 'instituto-profesional-pacifico';

test.describe('Admin Auth & Navigation Guards', () => {
    test('admin cannot access a different institution slug', async ({ page }) => {
        await page.goto(`/${OTHER_SLUG}`);
        // Should redirect away (to own slug or login)
        await expect(page).not.toHaveURL(new RegExp(OTHER_SLUG));
    });

    test('admin cannot access /config', async ({ page }) => {
        await page.goto('/config');
        // Should redirect to /login or own slug
        await expect(page).not.toHaveURL('/config');
    });

    test('all main admin routes respond without server errors', async ({ page }) => {
        const routes = [
            `/${SLUG}`,
            `/${SLUG}/students`,
            `/${SLUG}/groups`,
            `/${SLUG}/exams`,
            `/${SLUG}/results`,
            `/${SLUG}/professors`,
            `/${SLUG}/settings`,
            `/${SLUG}/liveresults`,
            `/${SLUG}/ayuda`,
        ];

        for (const route of routes) {
            await page.goto(route);
            await expect(page.locator('body')).not.toContainText('Something went wrong');
            await expect(page).not.toHaveURL(/\/login/);
        }
    });
});
