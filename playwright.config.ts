import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        // Auth setup: authenticates admin and superadmin, saves cookies
        {
            name: 'setup',
            testMatch: /global-setup\.ts/,
        },

        // Public pages: login forms, no session required
        {
            name: 'public',
            use: { ...devices['Desktop Chrome'] },
            testMatch: '**/public/*.spec.ts',
        },

        // Admin panel: authenticated as institution admin (carlos.lopez@ulagos.cl)
        {
            name: 'admin',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'tests/e2e/.auth/admin.json',
            },
            testMatch: '**/admin/*.spec.ts',
            dependencies: ['setup'],
        },

        // SuperAdmin panel: authenticated as superadmin (ADMIN_EMAIL env var)
        {
            name: 'superadmin',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'tests/e2e/.auth/superadmin.json',
            },
            testMatch: '**/superadmin/*.spec.ts',
            dependencies: ['setup'],
        },

        // Student flow: login handled inside each test
        {
            name: 'student',
            use: { ...devices['Desktop Chrome'] },
            testMatch: '**/student/*.spec.ts',
        },
    ],
    webServer: {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
