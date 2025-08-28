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