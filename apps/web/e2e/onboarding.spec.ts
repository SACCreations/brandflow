import { test, expect } from '@playwright/test';

test.describe('Brand Onboarding Flow', () => {
  // Use a simulated logged-in state or navigate to the public onboarding url directly if it allows it.
  // Assuming `/intelligence/brands/onboarding` might redirect to login if no auth is found, 
  // we would normally setup global setup for auth. For this test, we verify the page renders.
  
  test('should load the onboarding page', async ({ page }) => {
    // If onboarding is protected, this test will verify the redirect to login, 
    // or if we intercept/mock auth, it verifies the onboarding page.
    // For now we just verify the route responds.
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

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');

    // Navigate to onboarding
    await page.goto('/intelligence/brands/onboarding');

    // Verify step 1 renders
    await expect(page.getByText(/Brand Basics/i)).toBeVisible();
    await expect(page.locator('input[placeholder="e.g. Acme Corp"]')).toBeVisible();
  });
});
