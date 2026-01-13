---
name: clerk-testing
description: Write E2E tests for Clerk-authenticated apps using Playwright or Cypress. Use when adding tests, testing auth flows, debugging test failures, or setting up testing infrastructure for Clerk apps.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Clerk Testing Skill

Write E2E tests for Clerk-authenticated applications. Covers Playwright and Cypress setup with the @clerk/testing package.

## Quick Start (Playwright)

### 1. Install Dependencies

```bash
npm install -D @clerk/testing @playwright/test
npx playwright install
```

### 2. Set Environment Variables

```bash
# .env.local or .env.test
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Optional: Test user credentials
E2E_CLERK_USER_USERNAME=test@example.com
E2E_CLERK_USER_PASSWORD=testpassword123
```

### 3. Configure Global Setup

```typescript
// global.setup.ts
import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

// IMPORTANT: Use serial mode for setup
setup.describe.configure({ mode: 'serial' });

setup('clerk global setup', async ({}) => {
  await clerkSetup();
});
```

### 4. Configure Playwright

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: require.resolve('./global.setup'),
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 5. Write Tests

```typescript
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
```

## Sign-In Strategies

The `ClerkSignInParams` type supports these strategies:

```typescript
type ClerkSignInParams =
  | { strategy: 'password'; password: string; identifier: string; }
  | { strategy: 'phone_code' | 'email_code'; identifier: string; }
  | { strategy: 'ticket'; ticket: string; };
```

### Password Strategy

```typescript
await clerk.signIn({
  page,
  signInParams: {
    strategy: 'password',
    identifier: 'user@example.com', // email or username
    password: 'password123',
  },
});
```

### Phone/Email Code Strategy (Test Mode)

```typescript
// Uses test phone numbers (+15555550100 to +15555550199)
// or test emails (user+clerk_test@example.com)
// These auto-verify with code "424242"
await clerk.signIn({
  page,
  signInParams: {
    strategy: 'phone_code',
    identifier: '+15555550100', // test phone number
  },
});
```

### Email-Based Sign-In (Recommended)

```typescript
// Simplest for testing - automatically creates sign-in token via Backend API
// Requires CLERK_SECRET_KEY environment variable
await clerk.signIn({
  page,
  emailAddress: 'test@example.com',
});
```

This is the recommended approach as it:
- Works in both development and production environments
- Doesn't require test phone numbers or email codes
- Uses Clerk's Backend API to create a sign-in token automatically

## Auth State Persistence

Reuse authentication across tests for speed:

```typescript
// global.setup.ts
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
```

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'authenticated',
      use: {
        storageState: 'auth.json', // Reuse auth
      },
    },
    {
      name: 'unauthenticated',
      use: {
        storageState: { cookies: [], origins: [] }, // No auth
      },
    },
  ],
});
```

## Cypress Setup

### 1. Install Dependencies

```bash
npm install -D @clerk/testing cypress
```

### 2. Configure Cypress

```typescript
// cypress.config.ts
import { clerkSetup } from '@clerk/testing/cypress';
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // IMPORTANT: Call clerkSetup in setupNodeEvents
      return clerkSetup({ config });
    },
  },
});
```

### 3. Add Clerk Commands

```typescript
// cypress/support/commands.ts
import { addClerkCommands } from '@clerk/testing/cypress';

// IMPORTANT: Use addClerkCommands instead of manual command definitions
addClerkCommands({ Cypress, cy });

// This adds the following commands automatically:
// - cy.clerkSignIn(params)
// - cy.clerkSignOut()
// - cy.clerkLoaded()
```

### 4. Import Commands in Support

```typescript
// cypress/support/e2e.ts
import './commands';
```

### 5. Write Cypress Tests

```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should allow signed-in user to access dashboard', () => {
    // Use the automatically added cy.clerkSignIn command
    cy.clerkSignIn({
      strategy: 'password',
      identifier: Cypress.env('E2E_CLERK_USER_USERNAME'),
      password: Cypress.env('E2E_CLERK_USER_PASSWORD'),
    });

    // Wait for Clerk to be loaded
    cy.clerkLoaded();

    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should redirect unauthenticated user', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/sign-in');
  });
});
```

## Testing Organizations

```typescript
// tests/organizations.spec.ts
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';
import { test, expect } from '@playwright/test';

test('should access organization dashboard', async ({ page }) => {
  await setupClerkTestingToken({ page });

  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });

  // Wait for Clerk to load
  await clerk.loaded({ page });

  // Navigate to org dashboard
  await page.goto('/org/my-org/dashboard');

  await expect(page.getByText('Organization Dashboard')).toBeVisible();
});
```

## Common Gotchas

### 1. Missing page.goto() before signIn

```typescript
// WRONG - signIn before navigating to app
await setupClerkTestingToken({ page });
await clerk.signIn({ page, ... }); // May fail - no app context

// RIGHT - Navigate first, then sign in
await setupClerkTestingToken({ page });
await page.goto('/'); // Navigate to app first
await clerk.signIn({ page, ... });
```

### 2. Not waiting for Clerk to load

```typescript
// WRONG - Race condition
await clerk.signIn({ page, ... });
await page.goto('/dashboard'); // May fail

// RIGHT - Wait for Clerk
await clerk.signIn({ page, ... });
await clerk.loaded({ page });
await page.goto('/dashboard');
```

### 3. Wrong Playwright global setup

```typescript
// WRONG - Using async default export
export default async function globalSetup() {
  await clerkSetup();
}

// RIGHT - Use test fixture with serial mode
import { test as setup } from '@playwright/test';
setup.describe.configure({ mode: 'serial' });

setup('clerk setup', async ({}) => {
  await clerkSetup();
});
```

### 4. Wrong Cypress commands setup

```typescript
// WRONG - Manual command definitions
Cypress.Commands.add('clerkSignIn', (credentials) => { ... });

// RIGHT - Use addClerkCommands helper
import { addClerkCommands } from '@clerk/testing/cypress';
addClerkCommands({ Cypress, cy });
```

### 5. Missing clerkSetup in Cypress config

```typescript
// WRONG - No clerkSetup in setupNodeEvents
setupNodeEvents(on, config) {
  // Missing!
}

// RIGHT - Call clerkSetup and return config
setupNodeEvents(on, config) {
  return clerkSetup({ config });
}
```

### 6. Using wrong environment

```bash
# Use test keys, not production!
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx  # pk_test, not pk_live
CLERK_SECRET_KEY=sk_test_xxxxx       # sk_test, not sk_live
```

### 7. Test user not created

Create a dedicated test user in Clerk Dashboard:
1. Go to Users
2. Create user with known credentials
3. Use those credentials in E2E_CLERK_USER_* env vars

## Documentation

- [@clerk/testing Reference](https://clerk.com/docs/testing/overview)
- [Playwright Testing Guide](https://clerk.com/docs/testing/playwright)
- [Cypress Testing Guide](https://clerk.com/docs/testing/cypress)
- [Testing Tokens](https://clerk.com/docs/testing/testing-tokens)
