// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

/**
 * [BDD PRINCIPLE: Feature Description]
 * Using 'test.describe' to group tests under a human-readable "Feature" name.
 * This acts as living documentation for the "PartnerSync Core Flow".
 */
test.describe('PartnerSync Core Flow', () => {

  test.beforeEach(async ({ page }) => {
    // [BDD: Setup/Given] Ensuring the environment is ready (Logged in)
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.goto(BASE_URL);
    
    /** * [BDD: User-Centric Selectors]
     * Using getByPlaceholder mimics how a real human identifies fields, 
     * validating the UI's accessibility and usability.
     */
    await page.getByPlaceholder('admin@partnersync.com').fill('admin@gmail.com');
    await page.getByPlaceholder('••••••••').fill('admin123');
    await page.getByRole('button', { name: /login/i }).click();

    /**
     * [CI/CD: Resilient Execution]
     * 'networkidle' ensures the test waits for the automated environment to settle, 
     * making the CI pipeline stable and preventing "flaky" test results.
     */
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/home/);
  });

  /**
   * [BDD: Scenario]
   * Describing a specific "User Story": An admin creating a new project.
   */
  test('should allow admin to create a new project', async ({ page }) => {
    // [BDD: Action/When] User navigates and interacts with the UI
    await page.goto(`${BASE_URL}/projects`);
    
    /**
     * [CI/CD: Cross-Browser Validation]
     * Because this script runs on Chromium, Firefox, and WebKit, 
     * it ensures the 'Project Registry' heading is visible on ALL engines in the pipeline.
     */
    await expect(page.getByRole('heading', { name: /Project Registry/i })).toBeVisible();

    await page.getByRole('button', { name: /New Project/i }).click();
    
    // [BDD: Interaction] Simulating a user filling out the form
    await page.locator('input[type="text"]').first().fill('Clean Water Initiative');
    await page.locator('input[type="text"]').nth(1).fill('UNESCO');
    await page.locator('input[type="number"]').fill('50200');
    await page.locator('textarea').fill('This project provides clean water to rural communities.');

    await page.getByRole('combobox').first().selectOption({ label: 'Clean Water' });
    await page.getByRole('combobox').nth(1).selectOption('Proposed');

    const submitBtn = page.getByRole('button', { name: /Submit Project/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    /**
     * [BDD: Outcome/Then] 
     * Verifying that the UI reflects the expected result for the user.
     * [CI/CD: Automated Assertion]
     * If this fails in the pipeline, the deployment is blocked automatically.
     */
    await expect(page.getByText('Clean Water Initiative')).toBeVisible({ timeout: 10000 });
  });
});






