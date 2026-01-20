// tests/auth.setup.ts
// Save auth state to avoid signing in every test
import { test as setup } from '@playwright/test';
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';

const authFile = 'tests/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await setupClerkTestingToken({ page });

  await page.goto('/sign-in');
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });

  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: authFile });
});

// playwright.config.ts usage:
// export default defineConfig({
//   projects: [
//     { name: 'setup', testMatch: /.*\.setup\.ts/ },
//     {
//       name: 'authenticated',
//       testMatch: /.*\.spec\.ts/,
//       dependencies: ['setup'],
//       use: { storageState: 'tests/.auth/user.json' },
//     },
//   ],
// });
