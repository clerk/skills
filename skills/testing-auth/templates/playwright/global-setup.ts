// tests/global-setup.ts
import { clerkSetup } from '@clerk/testing/playwright';

export default async function globalSetup() {
  await clerkSetup();
}

// playwright.config.ts
// import { defineConfig } from '@playwright/test';
//
// export default defineConfig({
//   globalSetup: './tests/global-setup.ts',
//   use: {
//     baseURL: 'http://localhost:3000',
//   },
// });
