import { test, expect } from '@playwright/test';

test.describe('Public Routes, Security Guards & Clean Formatting', () => {
  test('landing page (/) renders hero and navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/MORE|Community|Tunbridge Wells/i);
  });

  test('/discover and /experiences are publicly accessible without redirecting to /login', async ({ page }) => {
    await page.goto('/discover');
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.getByPlaceholder(/Search communities/i)).toBeVisible({ timeout: 15000 });

    await page.goto('/experiences');
    await expect(page).toHaveURL(/\/experiences/);
  });

  test('/events renders cleanly without leaking raw @lat,lng coordinate tokens', async ({ page }) => {
    await page.goto('/events');
    await expect(page).toHaveURL(/\/events/);
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/•\s*@-?\d+\.\d+,-?\d+\.\d+/);
    expect(bodyText).not.toMatch(/\[r=\d+(?:\.\d+)?km\]/i);
  });

  test('guest visiting /community/[id] never sees Leader Panel and sees Sign In to Join', async ({ page }) => {
    await page.goto('/discover');
    const firstCommunity = page.locator('a[href^="/community/"]').first();
    await expect(firstCommunity).toBeVisible({ timeout: 15000 });
    await firstCommunity.click();

    await expect(page).toHaveURL(/\/community\//);
    await expect(page.locator('[title="Leader Panel"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Sign In to Join/i })).toBeVisible({ timeout: 10000 });
  });
});
