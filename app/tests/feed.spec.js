import { test, expect } from '@playwright/test';

test.describe('Feed Interactions', () => {
  // Use a beforeEach to ensure we are logged in
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for redirect to login or check if already on login
    await page.waitForURL('**/login', { timeout: 10000 }).catch(() => {});

    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      await page.fill('input[type="email"]', 'demo@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/', { timeout: 10000 });
      await expect(page.locator('text=Good morning')).toBeVisible({ timeout: 15000 });
    }
  });

  test('should allow liking a feed post and verify it toggles correctly', async ({ page }) => {
    // Navigate to communities page
    await page.goto('/explore');
    
    // We'll just click on the first community available
    await page.click('a[href^="/community/"] >> nth=0');
    
    // Wait for feed to load
    await expect(page.locator('text=Community Feed').or(page.locator('text=Join Community'))).toBeVisible({ timeout: 15000 });

    // Find the first like button (heart icon)
    // We assume the like button has a specific class or we can find it by the lucide-react Heart icon
    // For this test, we look for a button containing a heart icon
    const likeButton = page.locator('button:has(svg.lucide-heart)').first();
    
    if (await likeButton.count() > 0) {
      // Get the current text (e.g. "Upvote (5)" or just "5")
      const initialText = await likeButton.innerText();
      const initialLikes = parseInt(initialText.replace(/[^0-9]/g, '') || '0', 10);
      
      // Click to toggle
      await likeButton.click();
      
      // Wait a moment for optimistic UI and backend update
      await page.waitForTimeout(1000);
      
      const newText = await likeButton.innerText();
      const newLikes = parseInt(newText.replace(/[^0-9]/g, '') || '0', 10);
      
      // It should either be +1 or -1 depending on initial state
      expect(Math.abs(newLikes - initialLikes)).toBe(1);

      // Click again to toggle back
      await likeButton.click();
      await page.waitForTimeout(1000);
      
      const finalText = await likeButton.innerText();
      const finalLikes = parseInt(finalText.replace(/[^0-9]/g, '') || '0', 10);
      
      // Should revert back to initial state
      expect(finalLikes).toBe(initialLikes);
    } else {
      console.log('No posts available to like in this community.');
    }
  });

  test('should allow commenting on a feed post', async ({ page }) => {
    await page.goto('/explore');
    await page.click('a[href^="/community/"] >> nth=0');
    await expect(page.locator('text=Community Feed').or(page.locator('text=Join Community'))).toBeVisible({ timeout: 15000 });

    // Find the comment button (message circle icon)
    const commentButton = page.locator('button:has(svg.lucide-message-circle)').first();
    
    if (await commentButton.count() > 0) {
      await commentButton.click();

      // Find the comment input
      const commentInput = page.locator('input[placeholder="Write a comment..."]').first();
      await expect(commentInput).toBeVisible();

      const testComment = `Test comment ${Date.now()}`;
      await commentInput.fill(testComment);

      // Submit comment
      const sendButton = page.locator('button:has(svg.lucide-send)').first();
      await sendButton.click();

      // Verify comment appears
      await expect(page.locator(`text=${testComment}`)).toBeVisible({ timeout: 10000 });
    } else {
      console.log('No posts available to comment on in this community.');
    }
  });
});
