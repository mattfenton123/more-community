import { test, expect } from '@playwright/test';

test.describe('Authentication & Route Protection', () => {
  test('renders login screen with email/password inputs and sign up toggle', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByPlaceholder('Email address')).toBeVisible();
    await expect(page.getByPlaceholder('Password (min 6 chars)')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i }).first()).toBeVisible();

    // Switch to Sign Up mode
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page.getByPlaceholder('Full Name')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();

    // Switch back to Sign In and test Forgot Password toggle
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByRole('button', { name: /Forgot password\?/i }).click();
    await expect(page.getByRole('button', { name: /Send Reset Link/i })).toBeVisible();
  });

  test('redirects unauthenticated guests from protected /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
