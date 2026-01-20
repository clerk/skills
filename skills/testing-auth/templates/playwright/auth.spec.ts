// tests/auth.spec.ts
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // IMPORTANT: Must be called before navigating
    await setupClerkTestingToken({ page });
  });

  test('sign in with password', async ({ page }) => {
    await page.goto('/sign-in');

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('protected route redirects when not signed in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('sign out', async ({ page }) => {
    // First sign in
    await page.goto('/sign-in');
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });

    // Then sign out
    await page.getByRole('button', { name: /user/i }).click();
    await page.getByRole('menuitem', { name: /sign out/i }).click();

    await expect(page).toHaveURL('/');
  });
});
