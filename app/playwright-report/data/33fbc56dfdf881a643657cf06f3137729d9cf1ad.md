# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Authentication >> should login successfully as a test user
- Location: tests\auth.spec.js:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Good morning')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Good morning')

```

```yaml
- text: Loading...
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication', () => {
  4  |   test('should login successfully as a test user', async ({ page }) => {
  5  |     // Navigate to the site
  6  |     await page.goto('/');
  7  | 
  8  |     // Wait for redirect to login or check if already on login
  9  |     await page.waitForURL('**/login', { timeout: 10000 }).catch(() => {});
  10 | 
  11 |     const isLoginPage = page.url().includes('/login');
  12 |     if (isLoginPage) {
  13 |       // Fill in demo account
  14 |       await page.fill('input[type="email"]', 'demo@example.com');
  15 |       await page.fill('input[type="password"]', 'password123'); // Adjust password if needed
  16 | 
  17 |       // Assuming there's a button to submit login
  18 |       await page.click('button:has-text("Sign In")');
  19 | 
  20 |       // Wait for redirect to homepage
  21 |       await page.waitForURL('**/', { timeout: 10000 });
  22 |     }
  23 | 
  24 |     // Verify we are logged in by checking for a user-specific element
> 25 |     await expect(page.locator('text=Good morning')).toBeVisible();
     |                                                     ^ Error: expect(locator).toBeVisible() failed
  26 |   });
  27 | });
  28 | 
```