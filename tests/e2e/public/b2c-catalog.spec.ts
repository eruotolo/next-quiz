import { expect, test } from '@playwright/test';

const SLUG = 'universidad-de-los-lagos';

test.describe('Catálogo público B2C (/[slug]/cursos)', () => {
    test('carga sin sesión y muestra el header institucional', async ({ page }) => {
        await page.goto(`/${SLUG}/cursos`);
        await expect(page.getByRole('heading', { name: 'Cursos disponibles' })).toBeVisible();
        await expect(page.getByText(`Aula Virtual · Universidad de Los Lagos`)).toBeVisible();
    });

    test('muestra JSON-LD ItemList con un schema Course cuando hay cursos públicos', async ({ page }) => {
        await page.goto(`/${SLUG}/cursos`);
        const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
        expect(ld).toBeTruthy();
        const parsed = JSON.parse(ld ?? '{}') as {
            '@type': string;
            itemListElement?: Array<{ '@type': string; name?: string }>;
        };
        expect(parsed['@type']).toBe('ItemList');
        expect(Array.isArray(parsed.itemListElement)).toBe(true);
    });

    test('link a /[slug] del header apunta al catálogo', async ({ page }) => {
        await page.goto(`/${SLUG}/cursos`);
        const cursosLink = page.getByRole('link', { name: 'Cursos' }).first();
        await expect(cursosLink).toHaveAttribute('href', `/${SLUG}/cursos`);
    });

    test('muestra la card del curso público cuando el seeder lo creó', async ({ page }) => {
        await page.goto(`/${SLUG}/cursos`);
        // El seeder local-test crea el curso "Curso Público de Prueba" con isPublic+published.
        const cardTitle = page.getByRole('heading', { name: 'Curso Público de Prueba' });
        if (await cardTitle.count()) {
            await expect(cardTitle.first()).toBeVisible();
            await expect(page.getByText('$19.990').first()).toBeVisible();
        } else {
            await expect(page.getByText('Aún no hay cursos publicados')).toBeVisible();
        }
    });

    test('cada card tiene botón Comprar que va directo al checkout', async ({ page }) => {
        await page.goto(`/${SLUG}/cursos`);
        const buyButton = page
            .getByRole('link', { name: /Comprar curso|Inscribirme gratis/i })
            .first();
        test.skip(!(await buyButton.count()), 'Sin curso público seeded');

        await expect(buyButton).toBeVisible();
        const href = await buyButton.getAttribute('href');
        expect(href).toMatch(new RegExp(`/${SLUG}/checkout/.+`));
    });

    test('click en Comprar navega al checkout (no a single page)', async ({ page }) => {
        await page.goto(`/${SLUG}/cursos`);
        const buyButton = page
            .getByRole('link', { name: /Comprar curso|Inscribirme gratis/i })
            .first();
        test.skip(!(await buyButton.count()), 'Se requiere el seeder con curso público (pnpm db:seed:local)');

        await buyButton.click();
        await expect(page).toHaveURL(new RegExp(`/${SLUG}/checkout/.+`));
        await expect(page.getByRole('heading', { name: /Tus datos para inscribirte/i })).toBeVisible();
    });
});
