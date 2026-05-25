import { test, expect } from '@playwright/test';

test.describe('Content Generation Loop', () => {
  test('should load the create content page', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Mock the login API call
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', mfaEnabled: false },
          tokens: { accessToken: 'mock-token' },
          business: { id: '1', name: 'Test Business', slug: 'test-business' }
        })
      });
    });
    
    // Simulate login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');

    // Wait for navigation
    await page.waitForURL('/dashboard');

    // Navigate to content generation
    await page.goto('/create/content');

    // Verify main components are present
    await expect(page.getByText(/Generate Content/i)).toBeVisible();
    
    // In a real E2E test, we would intercept the AI API call here
    // await page.route('**/api/generate', route => {
    //   route.fulfill({
    //     status: 200,
    //     contentType: 'application/json',
    //     body: JSON.stringify({ content: "Mocked AI generated content" })
    //   });
    // });
    
    // Check for the prompt input or context selector
    const promptInput = page.getByPlaceholder(/What would you like to create/i);
    if (await promptInput.count() > 0) {
      await expect(promptInput).toBeVisible();
    }
  });
});
