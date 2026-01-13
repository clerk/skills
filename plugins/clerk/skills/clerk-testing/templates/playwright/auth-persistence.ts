// global.setup.ts - Auth State Persistence
// Reuse authentication across tests for speed
import { clerkSetup } from '@clerk/testing/playwright';
import { chromium } from '@playwright/test';

export default async function globalSetup() {
  await clerkSetup();

  // Create authenticated state
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const { setupClerkTestingToken, clerk } = await import('@clerk/testing/playwright');
  await setupClerkTestingToken({ page });

  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });

  // Save auth state
  await page.context().storageState({ path: 'auth.json' });
  await browser.close();
}

// playwright.config.ts - Use saved auth state
// export default defineConfig({
//   projects: [
//     {
//       name: 'authenticated',
//       use: { storageState: 'auth.json' },
//     },
//     {
//       name: 'unauthenticated',
//       use: { storageState: { cookies: [], origins: [] } },
//     },
//   ],
// });
