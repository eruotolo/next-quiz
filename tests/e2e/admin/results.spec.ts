import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

test.describe('Admin Results (/[slug]/results)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/${SLUG}/results`);
    });

    test('renders the page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Historial de Resultados/i })).toBeVisible();
    });

    test('shows the results count in subtitle', async ({ page }) => {
        await expect(page.getByText(/evaluaciones completadas/i)).toBeVisible();
    });

    test('page loads without errors', async ({ page }) => {
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('renders filters or empty state', async ({ page }) => {
        // Either there are results with a table, or an empty state message
        const hasTable = await page.getByRole('table').count();
        const hasEmptyState = await page.getByText(/no hay resultados|sin resultados/i).count();
        expect(hasTable + hasEmptyState).toBeGreaterThan(0);
    });
});

test.describe('Admin Live Results (/[slug]/liveresults)', () => {
    test('renders the live results page', async ({ page }) => {
        await page.goto(`/${SLUG}/liveresults`);
        await expect(page.locator('body')).not.toContainText('Something went wrong');
        await expect(page.locator('body')).not.toContainText('Error');
    });
});
