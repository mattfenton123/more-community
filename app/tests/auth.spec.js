import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully as a test user', async ({ page }) => {
    // Navigate to the site
    await page.goto('/');

    // Wait for redirect to login or check if already on login
    await page.waitForURL('**/login', { timeout: 10000 }).catch(() => {});

    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      // Fill in demo account
      await page.fill('input[type="email"]', 'demo@example.com');
      await page.fill('input[type="password"]', 'password123'); // Adjust password if needed

      // Click the primary submit button
      await page.click('button[type="submit"]');

      // Wait for redirect to homepage
      await page.waitForURL('**/', { timeout: 10000 });
    }

    // Verify we are logged in by checking for a user-specific element
    await expect(page.locator('text=Good morning')).toBeVisible();
  });
});
