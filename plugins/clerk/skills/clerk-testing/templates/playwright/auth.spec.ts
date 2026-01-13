// tests/auth.spec.ts
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow signed-in user to access dashboard', async ({ page }) => {
    // Setup testing token (bypasses bot detection)
    await setupClerkTestingToken({ page });

    // IMPORTANT: Navigate to your app first, then sign in
    await page.goto('/');

    // Sign in
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });

    // Wait for Clerk to be fully loaded
    await clerk.loaded({ page });

    // Navigate to protected route
    await page.goto('/dashboard');

    // Verify access
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should redirect unauthenticated user to sign-in', async ({ page }) => {
    await setupClerkTestingToken({ page });

    // Navigate to app first
    await page.goto('/');

    // Try to access protected route without auth
    await page.goto('/dashboard');

    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should sign out successfully', async ({ page }) => {
    await setupClerkTestingToken({ page });

    // Navigate to app first
    await page.goto('/');

    // Sign in first
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });

    await clerk.loaded({ page });
    await page.goto('/dashboard');

    // Sign out
    await clerk.signOut({ page });

    // Verify signed out
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/);
  });
});
