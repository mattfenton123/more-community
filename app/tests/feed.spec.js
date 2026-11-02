import { test, expect } from '@playwright/test';

test.describe('Community Discovery & Profile Tabs', () => {
  test('can browse /discover, open a community profile, and switch tabs', async ({ page }) => {
    await page.goto('/discover');

    // Wait for communities to render on /discover
    const communityLinks = page.locator('a[href^="/community/"]');
    await expect(communityLinks.first()).toBeVisible({ timeout: 15000 });

    await communityLinks.first().click();
    await expect(page).toHaveURL(/\/community\//);

    // Verify tabs exist and switch cleanly without errors
    const eventsTab = page.getByRole('button', { name: /^Events/i }).first();
    await expect(eventsTab).toBeVisible({ timeout: 10000 });
    await eventsTab.click();

    const feedTab = page.getByRole('button', { name: /^Feed/i }).first();
    if (await feedTab.isVisible()) {
      await feedTab.click();
    }

    const aboutTab = page.getByRole('button', { name: /^About/i }).first();
    if (await aboutTab.isVisible()) {
      await aboutTab.click();
    }
  });
});
