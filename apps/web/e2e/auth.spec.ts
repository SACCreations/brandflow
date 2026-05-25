import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page and render form', async ({ page }) => {
    await page.goto('/login');
    
    // Check if the page title or a known heading is visible
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    
    // Check for email and password inputs
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for submit button
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
  });

  test('should navigate to register page and render form', async ({ page }) => {
    await page.goto('/register');
    
    // Check if the page title or a known heading is visible
    await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();
    
    // Check for inputs
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for submit button
    await expect(page.getByRole('button', { name: /Get started — free/i })).toBeVisible();
  });
});
