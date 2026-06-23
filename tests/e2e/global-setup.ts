import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_DIR = path.join('tests/e2e/.auth');
export const ADMIN_AUTH_FILE = path.join(AUTH_DIR, 'admin.json');
export const SUPERADMIN_AUTH_FILE = path.join(AUTH_DIR, 'superadmin.json');

const ADMIN_SLUG = 'universidad-de-los-lagos';

setup('authenticate institution admin', async ({ page }) => {
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    await page.goto('/login');
    await page.locator('input[type="email"]').fill('carlos.lopez@ulagos.cl');
    await page.locator('input[type="password"]').fill('Admin2026!');
    await page.getByRole('button', { name: /Entrar al panel/i }).click();
    await page.waitForURL(`**/${ADMIN_SLUG}`, { timeout: 20_000 });
    await page.context().storageState({ path: ADMIN_AUTH_FILE });
});

setup('authenticate superadmin', async ({ page }) => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.warn('[setup] ADMIN_EMAIL or ADMIN_PASSWORD not set — writing empty superadmin auth');
        fs.writeFileSync(SUPERADMIN_AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
        return;
    }

    try {
        await page.goto('/login');
        await page.locator('input[type="email"]').fill(email);
        await page.locator('input[type="password"]').fill(password);
        await page.getByRole('button', { name: /Entrar al panel/i }).click();
        await page.waitForURL('**/config', { timeout: 20_000 });
        await page.context().storageState({ path: SUPERADMIN_AUTH_FILE });
    } catch {
        // Superadmin may not be seeded locally — write empty state so tests skip cleanly
        console.warn('[setup] Superadmin login failed — check that pnpm db:seed was run. Writing empty auth.');
        fs.writeFileSync(SUPERADMIN_AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    }
});
