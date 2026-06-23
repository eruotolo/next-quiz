import { type Page, expect, test } from '@playwright/test';

// Student credentials from local-test seed (Universidad de Los Lagos)
const STUDENT_RUT = '55.555.555-5'; // juan.perez@test.cl (seed RUT: 555555555)

async function loginAsStudent(page: Page): Promise<void> {
    await page.goto('/examen/login');
    await page.locator('input[name="credential"]').fill(STUDENT_RUT);
    await page.getByRole('button', { name: /Entrar al examen/i }).click();
    await page.waitForURL('**/examen/seleccion', { timeout: 15_000 });
}

test.describe('Student Login Flow', () => {
    test('student can log in by RUT and reaches selection page', async ({ page }) => {
        await page.goto('/examen/login');
        await page.locator('input[name="credential"]').fill(STUDENT_RUT);
        await page.getByRole('button', { name: /Entrar al examen/i }).click();
        await expect(page).toHaveURL(/\/examen\/seleccion/, { timeout: 15_000 });
    });

    test('student can log in by email', async ({ page }) => {
        await page.goto('/examen/login');
        await page.locator('input[name="credential"]').fill('juan.perez@test.cl');
        await page.getByRole('button', { name: /Entrar al examen/i }).click();
        await expect(page).toHaveURL(/\/examen\/seleccion/, { timeout: 15_000 });
    });
});

test.describe('Student Exam Selection (/examen/seleccion)', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsStudent(page);
    });

    test('renders a personalized greeting with student name', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Hola, Juan/i })).toBeVisible();
    });

    test('shows at least one exam section or empty state', async ({ page }) => {
        const sections =
            (await page.getByText('Disponible ahora').count()) +
            (await page.getByText('Próximos').count()) +
            (await page.getByText('Ya rendidos').count()) +
            (await page.getByText(/no tenés exámenes|sin exámenes/i).count());
        expect(sections).toBeGreaterThan(0);
    });

    test('student name appears in the page', async ({ page }) => {
        await expect(page.getByText('Juan').first()).toBeVisible();
    });

    test('page loads without server errors', async ({ page }) => {
        await expect(page.locator('body')).not.toContainText('Something went wrong');
    });

    test('unauthenticated access to /examen/seleccion redirects to student login', async ({
        browser,
    }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        await page.goto('/examen/seleccion');
        await expect(page).toHaveURL(/\/examen\/login/);
        await ctx.close();
    });
});

test.describe('Student Full Exam Flow (requires active exam in DB)', () => {
    let hasAvailableExams = false;

    test.beforeEach(async ({ page }) => {
        await loginAsStudent(page);
        const availableSection = page.locator('section:has-text("Disponible ahora")');
        hasAvailableExams = (await availableSection.getByRole('button', { name: /Comenzar/i }).count()) > 0;
        test.skip(!hasAvailableExams, 'No active exams available.');
    });

    test('if an exam is available, student can navigate to intro page', async ({ page }) => {
        const availableSection = page.locator('section:has-text("Disponible ahora")');
        await availableSection.getByRole('button', { name: /Comenzar/i }).first().click();
        await expect(page).toHaveURL(/\/examen\/.+\/intro/, { timeout: 10_000 });
    });

    test('intro page has accept-terms checkbox and disabled start button', async ({ page }) => {
        const availableSection = page.locator('section:has-text("Disponible ahora")');
        await availableSection.getByRole('button', { name: /Comenzar/i }).first().click();
        await page.waitForURL(/\/examen\/.+\/intro/, { timeout: 10_000 });

        await expect(page.locator('h1').first()).toBeVisible();
        await expect(page.locator('#accept-terms')).toBeVisible();

        const beginBtn = page.getByRole('button', { name: /Comenzar examen/i });
        await expect(beginBtn).toBeDisabled();

        await page.locator('#accept-terms').check();
        await expect(beginBtn).toBeEnabled();
    });

    test('exam carousel renders first question and options fieldset', async ({ page }) => {
        const availableSection = page.locator('section:has-text("Disponible ahora")');
        await availableSection.getByRole('button', { name: /Comenzar/i }).first().click();
        await page.waitForURL(/\/examen\/.+\/intro/, { timeout: 10_000 });
        await page.locator('#accept-terms').check();
        await page.getByRole('button', { name: /Comenzar examen/i }).click();
        await page.waitForURL(/\/examen\/[^/]+$/, { timeout: 15_000 });

        await expect(page.locator('h2').first()).toBeVisible();
        await expect(page.locator('fieldset[aria-label="Opciones de respuesta"]')).toBeVisible();
    });

    test('student can select an option and navigate to next question', async ({ page }) => {
        const availableSection = page.locator('section:has-text("Disponible ahora")');
        await availableSection.getByRole('button', { name: /Comenzar/i }).first().click();
        await page.waitForURL(/\/examen\/.+\/intro/, { timeout: 10_000 });
        await page.locator('#accept-terms').check();
        await page.getByRole('button', { name: /Comenzar examen/i }).click();
        await page.waitForURL(/\/examen\/[^/]+$/, { timeout: 15_000 });

        const firstOption = page.locator('fieldset[aria-label="Opciones de respuesta"] button').first();
        await firstOption.click();

        const nextBtn = page.getByRole('button', { name: /Siguiente/i });
        const submitBtn = page.getByRole('button', { name: /Enviar examen/i });

        if ((await nextBtn.count()) > 0) {
            await nextBtn.click();
            await expect(page.locator('h2').first()).toBeVisible();
        } else if ((await submitBtn.count()) > 0) {
            await expect(submitBtn).toBeVisible();
        }
    });
});
