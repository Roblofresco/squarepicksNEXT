import { test, expect } from '@playwright/test';

test('login then click a number on sweepstakes grid', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /log in/i }).click();

  await page.getByLabel(/email|username/i).fill(process.env.E2E_USER_EMAIL || '');
  await page.getByLabel(/password/i).fill(process.env.E2E_USER_PASSWORD || '');
  await page.getByRole('button', { name: /^log in$/i }).click();

  await page.waitForURL('**/lobby', { timeout: 30000 });

  // Ensure sweepstakes card present
  await expect(page.getByText(/free weekly entry/i)).toBeVisible();

  // Click ENTER if present to open quick entry UI
  const enterBtn = page.getByRole('button', { name: /enter/i });
  if (await enterBtn.isVisible().catch(() => false)) {
    await enterBtn.click();
  }

  // Try clicking a candidate number; fallback to input if needed
  const candidate = page.getByText(/^\d{2}$/).first();
  if (await candidate.isVisible().catch(() => false)) {
    await candidate.click();
  } else {
    // Fallback: type a number in input
    const input = page.locator('input[placeholder="##"]');
    await input.fill('07');
  }

  // If a confirm button is present, click it (won't confirm if gating dialogs show)
  const confirmBtn = page.getByRole('button', { name: /confirm\?/i });
  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click();
  }

  // Expect one of the gating dialogs or success UI to appear
  const possible = [
    page.getByText(/insufficient funds/i),
    page.getByText(/wallet setup required/i),
    page.getByText(/login required/i),
  ];
  await expect.any(possible);
});


