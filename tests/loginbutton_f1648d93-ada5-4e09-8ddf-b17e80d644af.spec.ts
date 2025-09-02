
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('LoginButton_2025-08-31', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('https://localhost:3000');

    // Take screenshot
    await page.screenshot({ path: 'homepage.png' });

    // Click element
    await page.click('button:has-text("Log In")');

    // Navigate to URL
    await page.goto('https://localhost:3000');

    // Click element
    await page.click('button:has-text("Log In")');

    // Navigate to URL
    await page.goto('https://localhost:3000/login');

    // Navigate to URL
    await page.goto('https://localhost:3000');

    // Click element
    await page.click('nav button:first-child');
});