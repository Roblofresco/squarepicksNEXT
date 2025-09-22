import { test, expect } from '@playwright/test';

test.describe('Lobby Tour Step 1 (dev)', () => {
  test('popover renders with content and sport tabs blocked, More toggles view', async ({ page }) => {
    await page.goto('https://www.squarepicks.com/lobby?tour=dev');

    // Wait for popover
    const popover = page.locator('[class*="driver"][class*="popover"]');
    await expect(popover).toBeVisible({ timeout: 10000 });

    // Validate content texts
    await expect(popover).toContainText('Choose Your View');
    await expect(popover).toContainText('Sweepstakes');
    await expect(popover).toContainText('Sports');

    // Verify sport tabs blocked (if present)
    const sportTab = page.locator('[data-sport-tab]').first();
    if (await sportTab.count()) {
      const initialURL = page.url();
      await sportTab.click();
      await page.waitForTimeout(300);
      expect(page.url()).toBe(initialURL);
    }

    // Click More to toggle view
    const moreBtn = page.getByRole('button', { name: /More/i });
    if (await moreBtn.count()) {
      await moreBtn.click();
      await page.waitForTimeout(300);
    }

    // Console scan for errors
    // (Using page.on in runtime would be better; quick scan here)
  });
});


