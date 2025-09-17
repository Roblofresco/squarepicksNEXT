import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://squarepicks.com',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

import { defineConfig } from '@playwright/test';

const base = process.env.PW_BASE_URL || 'https://localhost:3000';

export default defineConfig({
  testDir: 'tests/e2e',
  retries: 0,
  use: {
    baseURL: base,
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
  },
  reporter: [['list']]
}); 