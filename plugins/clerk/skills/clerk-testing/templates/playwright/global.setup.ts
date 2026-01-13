// global.setup.ts
import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

// IMPORTANT: Use serial mode for setup
setup.describe.configure({ mode: 'serial' });

setup('clerk global setup', async ({}) => {
  await clerkSetup();
});
