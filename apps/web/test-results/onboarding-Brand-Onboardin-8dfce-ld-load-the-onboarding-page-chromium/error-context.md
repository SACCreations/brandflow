# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.spec.ts >> Brand Onboarding Flow >> should load the onboarding page
- Location: e2e/onboarding.spec.ts:8:7

# Error details

```
Error: page.goto: net::ERR_ABORTED at http://localhost:3002/intelligence/brands/onboarding
Call log:
  - navigating to "http://localhost:3002/intelligence/brands/onboarding", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: BrandFlow
      - heading "Welcome back" [level=1] [ref=e7]
      - paragraph [ref=e8]: Sign in to your workspace
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]: Email
        - textbox "you@company.com" [ref=e12]
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]: Password
          - button "Show" [ref=e16] [cursor=pointer]
        - textbox [ref=e17]
      - button "Sign in" [ref=e18] [cursor=pointer]
    - paragraph [ref=e19]:
      - text: Don't have an account?
      - link "Create one" [ref=e20] [cursor=pointer]:
        - /url: /register
  - region "Notifications (F8)":
    - list
  - status [ref=e21]:
    - generic [ref=e22]:
      - img [ref=e24]
      - generic [ref=e26]:
        - text: Static route
        - button "Hide static indicator" [ref=e27] [cursor=pointer]:
          - img [ref=e28]
  - alert [ref=e31]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Brand Onboarding Flow', () => {
  4  |   // Use a simulated logged-in state or navigate to the public onboarding url directly if it allows it.
  5  |   // Assuming `/intelligence/brands/onboarding` might redirect to login if no auth is found, 
  6  |   // we would normally setup global setup for auth. For this test, we verify the page renders.
  7  |   
  8  |   test('should load the onboarding page', async ({ page }) => {
  9  |     // If onboarding is protected, this test will verify the redirect to login, 
  10 |     // or if we intercept/mock auth, it verifies the onboarding page.
  11 |     // For now we just verify the route responds.
  12 |     await page.goto('/login');
  13 |     
  14 |     // Mock the login API call
  15 |     await page.route('**/auth/login', async route => {
  16 |       await route.fulfill({
  17 |         status: 200,
  18 |         contentType: 'application/json',
  19 |         body: JSON.stringify({
  20 |           user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', mfaEnabled: false },
  21 |           tokens: { accessToken: 'mock-token' },
  22 |           business: { id: '1', name: 'Test Business', slug: 'test-business' }
  23 |         })
  24 |       });
  25 |     });
  26 | 
  27 |     // Simulate login
  28 |     await page.fill('input[type="email"]', 'test@example.com');
  29 |     await page.fill('input[type="password"]', 'password123');
  30 |     await page.click('button:has-text("Sign in")');
  31 | 
  32 |     // Wait for navigation to dashboard
  33 |     await page.waitForURL('/dashboard');
  34 | 
  35 |     // Navigate to onboarding
> 36 |     await page.goto('/intelligence/brands/onboarding');
     |                ^ Error: page.goto: net::ERR_ABORTED at http://localhost:3002/intelligence/brands/onboarding
  37 | 
  38 |     // Verify step 1 renders
  39 |     await expect(page.getByText(/Brand Basics/i)).toBeVisible();
  40 |     await expect(page.locator('input[placeholder="e.g. Acme Corp"]')).toBeVisible();
  41 |   });
  42 | });
  43 | 
```