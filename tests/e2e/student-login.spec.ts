import { expect, test } from '@playwright/test'

test.describe('Student Login Page (/examen/login)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/examen/login')
    })

    test('renders the page heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Ingresar al examen' })).toBeVisible()
    })

    test('renders the credential input', async ({ page }) => {
        await expect(page.locator('#credential')).toBeVisible()
    })

    test('shows correct placeholder in credential input', async ({ page }) => {
        await expect(page.locator('#credential')).toHaveAttribute(
            'placeholder',
            '12.345.678-9 o alumno@correo.cl',
        )
    })

    test('renders the submit button', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Comenzar examen' })).toBeVisible()
    })

    test('shows EduNext Quiz branding', async ({ page }) => {
        await expect(page.getByText('EduNext Quiz').first()).toBeVisible()
    })

    test('shows link to admin login', async ({ page }) => {
        await expect(page.getByRole('link', { name: 'Accedé aquí' })).toBeVisible()
    })

    test('shows error on invalid RUT', async ({ page }) => {
        await page.locator('#credential').fill('00.000.000-0')
        await page.getByRole('button', { name: 'Comenzar examen' }).click()
        // Server Action returns an error for invalid or non-existent RUT
        await expect(page.locator('[class*="destructive"]').first()).toBeVisible({
            timeout: 10000,
        })
    })

    test('submit button is disabled while pending', async ({ page }) => {
        await page.locator('#credential').fill('12.345.678-5')
        const button = page.getByRole('button', { name: 'Comenzar examen' })
        await button.click()
        await expect(button).toBeDisabled()
    })

    test('GraduationCap icon is visible', async ({ page }) => {
        // The icon is an SVG inside the card header area
        const icon = page.locator('svg').first()
        await expect(icon).toBeVisible()
    })

    test('page renders the main login card', async ({ page }) => {
        // The login card is a white rounded container
        await expect(page.locator('main')).toBeVisible()
    })
})
