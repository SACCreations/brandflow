# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: content-generation.spec.ts >> Content Generation Loop >> should load the create content page
- Location: e2e/content-generation.spec.ts:4:7

# Error details

```
Error: page.goto: net::ERR_ABORTED at http://localhost:3002/create/content
Call log:
  - navigating to "http://localhost:3002/create/content", waiting until "load"

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
  3  | test.describe('Content Generation Loop', () => {
  4  |   test('should load the create content page', async ({ page }) => {
  5  |     // Navigate to login
  6  |     await page.goto('/login');
  7  |     
  8  |     // Mock the login API call
  9  |     await page.route('**/auth/login', async route => {
  10 |       await route.fulfill({
  11 |         status: 200,
  12 |         contentType: 'application/json',
  13 |         body: JSON.stringify({
  14 |           user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', mfaEnabled: false },
  15 |           tokens: { accessToken: 'mock-token' },
  16 |           business: { id: '1', name: 'Test Business', slug: 'test-business' }
  17 |         })
  18 |       });
  19 |     });
  20 |     
  21 |     // Simulate login
  22 |     await page.fill('input[type="email"]', 'test@example.com');
  23 |     await page.fill('input[type="password"]', 'password123');
  24 |     await page.click('button:has-text("Sign in")');
  25 | 
  26 |     // Wait for navigation
  27 |     await page.waitForURL('/dashboard');
  28 | 
  29 |     // Navigate to content generation
> 30 |     await page.goto('/create/content');
     |                ^ Error: page.goto: net::ERR_ABORTED at http://localhost:3002/create/content
  31 | 
  32 |     // Verify main components are present
  33 |     await expect(page.getByText(/Generate Content/i)).toBeVisible();
  34 |     
  35 |     // In a real E2E test, we would intercept the AI API call here
  36 |     // await page.route('**/api/generate', route => {
  37 |     //   route.fulfill({
  38 |     //     status: 200,
  39 |     //     contentType: 'application/json',
  40 |     //     body: JSON.stringify({ content: "Mocked AI generated content" })
  41 |     //   });
  42 |     // });
  43 |     
  44 |     // Check for the prompt input or context selector
  45 |     const promptInput = page.getByPlaceholder(/What would you like to create/i);
  46 |     if (await promptInput.count() > 0) {
  47 |       await expect(promptInput).toBeVisible();
  48 |     }
  49 |   });
  50 | });
  51 | 
```