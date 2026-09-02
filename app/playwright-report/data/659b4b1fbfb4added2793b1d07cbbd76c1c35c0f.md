# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: feed.spec.js >> Feed Interactions >> should allow commenting on a feed post
- Location: tests\feed.spec.js:67:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('a[href^="/community/"]').first()

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]: Loading...
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Feed Interactions', () => {
  4  |   // Use a beforeEach to ensure we are logged in
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto('/');
  7  |     
  8  |     // Wait for redirect to login or check if already on login
  9  |     await page.waitForURL('**/login', { timeout: 10000 }).catch(() => {});
  10 | 
  11 |     const isLoginPage = page.url().includes('/login');
  12 |     if (isLoginPage) {
  13 |       await page.fill('input[type="email"]', 'demo@example.com');
  14 |       await page.fill('input[type="password"]', 'password123');
  15 |       await page.click('button:has-text("Sign In")');
  16 |       await page.waitForURL('**/', { timeout: 10000 });
  17 |       await expect(page.locator('text=Good morning')).toBeVisible({ timeout: 15000 });
  18 |     }
  19 |   });
  20 | 
  21 |   test('should allow liking a feed post and verify it toggles correctly', async ({ page }) => {
  22 |     // Navigate to communities page
  23 |     await page.goto('/explore');
  24 |     
  25 |     // We'll just click on the first community available
  26 |     await page.click('a[href^="/community/"] >> nth=0');
  27 |     
  28 |     // Wait for feed to load
  29 |     await expect(page.locator('text=Community Feed').or(page.locator('text=Join Community'))).toBeVisible({ timeout: 15000 });
  30 | 
  31 |     // Find the first like button (heart icon)
  32 |     // We assume the like button has a specific class or we can find it by the lucide-react Heart icon
  33 |     // For this test, we look for a button containing a heart icon
  34 |     const likeButton = page.locator('button:has(svg.lucide-heart)').first();
  35 |     
  36 |     if (await likeButton.count() > 0) {
  37 |       // Get the current text (e.g. "Upvote (5)" or just "5")
  38 |       const initialText = await likeButton.innerText();
  39 |       const initialLikes = parseInt(initialText.replace(/[^0-9]/g, '') || '0', 10);
  40 |       
  41 |       // Click to toggle
  42 |       await likeButton.click();
  43 |       
  44 |       // Wait a moment for optimistic UI and backend update
  45 |       await page.waitForTimeout(1000);
  46 |       
  47 |       const newText = await likeButton.innerText();
  48 |       const newLikes = parseInt(newText.replace(/[^0-9]/g, '') || '0', 10);
  49 |       
  50 |       // It should either be +1 or -1 depending on initial state
  51 |       expect(Math.abs(newLikes - initialLikes)).toBe(1);
  52 | 
  53 |       // Click again to toggle back
  54 |       await likeButton.click();
  55 |       await page.waitForTimeout(1000);
  56 |       
  57 |       const finalText = await likeButton.innerText();
  58 |       const finalLikes = parseInt(finalText.replace(/[^0-9]/g, '') || '0', 10);
  59 |       
  60 |       // Should revert back to initial state
  61 |       expect(finalLikes).toBe(initialLikes);
  62 |     } else {
  63 |       console.log('No posts available to like in this community.');
  64 |     }
  65 |   });
  66 | 
  67 |   test('should allow commenting on a feed post', async ({ page }) => {
  68 |     await page.goto('/explore');
> 69 |     await page.click('a[href^="/community/"] >> nth=0');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  70 |     await expect(page.locator('text=Community Feed').or(page.locator('text=Join Community'))).toBeVisible({ timeout: 15000 });
  71 | 
  72 |     // Find the comment button (message circle icon)
  73 |     const commentButton = page.locator('button:has(svg.lucide-message-circle)').first();
  74 |     
  75 |     if (await commentButton.count() > 0) {
  76 |       await commentButton.click();
  77 | 
  78 |       // Find the comment input
  79 |       const commentInput = page.locator('input[placeholder="Write a comment..."]').first();
  80 |       await expect(commentInput).toBeVisible();
  81 | 
  82 |       const testComment = `Test comment ${Date.now()}`;
  83 |       await commentInput.fill(testComment);
  84 | 
  85 |       // Submit comment
  86 |       const sendButton = page.locator('button:has(svg.lucide-send)').first();
  87 |       await sendButton.click();
  88 | 
  89 |       // Verify comment appears
  90 |       await expect(page.locator(`text=${testComment}`)).toBeVisible({ timeout: 10000 });
  91 |     } else {
  92 |       console.log('No posts available to comment on in this community.');
  93 |     }
  94 |   });
  95 | });
  96 | 
```