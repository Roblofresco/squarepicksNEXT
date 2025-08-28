import { test, expect } from '@playwright/test';

const BASE = process.env.PW_BASE_URL || 'https://localhost:3000';

test.describe('Reset Password Flow', () => {
  test('request reset -> check email page -> confirm page shell loads', async ({ page }) => {
    const email = 'test@example.com';

    await page.goto(`${BASE}/reset-password`);
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Send reset link' }).click();

    await page.waitForURL((url) => url.pathname === '/reset-password/check-email');
    await expect(page.locator('h1')).toHaveText(/Check your email/i);
    await expect(page.getByText(email)).toBeVisible();

    await page.goto(`${BASE}/reset-password/confirm?oobCode=dummy`);
    await expect(page.locator('body')).toContainText(/Verifying|Set a new password|Invalid|expired/i);
  });

  test('invalid code shows inline error', async ({ page }) => {
    await page.goto(`${BASE}/reset-password/confirm?oobCode=invalid`);
    await expect(page.locator('[role="alert"]')).toContainText(/Invalid or expired/i);
  });
}); 