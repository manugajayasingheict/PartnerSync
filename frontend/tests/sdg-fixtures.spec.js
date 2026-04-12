const { test, expect } = require('@playwright/test');

test.describe('SDG Management System - Playwright Fixtures Demo', () => {
  
  //FIXTURE: Before Each Test
  test.beforeEach(async ({ page }) => {
    console.log('Setting up test - Loading app...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');
  });

  //FIXTURE: After Each Test
  test.afterEach(async ({ page }) => {
    console.log('Test completed - Cleaning up...');
  });

  //TEST 1: Home Page Load
  test('TEST 1: Should load home page with login form', async ({ page }) => {
    console.log('Testing: Home page load...');
    
    // Wait for login form to appear
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Verify "Welcome Back" heading exists
    const heading = await page.locator('text=Welcome Back');
    await expect(heading).toBeVisible();
    
    console.log('Home page loaded with login form!');
  });

  //TEST 2: Form Interaction (combines email + password testing)
  test('TEST 2: Should allow complete form interaction', async ({ page }) => {
    console.log('Testing: Complete form interaction...');
    
    // Fill email
    await page.fill('input[type="email"]', 'avishka@gmail.com');
    
    // Fill password
    await page.fill('input[type="password"]', 'password123');
    
    // Verify fields are filled
    const email = await page.locator('input[type="email"]').inputValue();
    const password = await page.locator('input[type="password"]').inputValue();
    
    expect(email).toBe('avishka@gmail.com');
    expect(password).toBe('password123');
    
    console.log('Form interaction successful - Fixture worked!');
  });

  //TEST 3: Login Button
  test('TEST 3: Should have clickable login button', async ({ page }) => {
    console.log('Testing: Login button...');
    
    // Find login button
    const loginButton = page.locator('button:has-text("Login")');
    
    // Verify button exists and is visible
    await expect(loginButton).toBeVisible();
    
    // Verify button is enabled
    await expect(loginButton).toBeEnabled();
    
    console.log('Login button is ready to click!');
  });

});