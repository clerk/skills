---
name: testing-auth
description: Write E2E tests for Clerk-authenticated apps. Use when adding tests, testing auth flows, setting up Playwright or Cypress with Clerk, or bypassing bot detection in tests.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Testing Authentication with Clerk

Set up E2E testing for Clerk-authenticated applications using Playwright or Cypress. Includes bot detection bypass, test user strategies, and auth state persistence.

## Quick Start (Playwright)

### 1. Install Dependencies

```bash
npm install @clerk/testing --save-dev
```

### 2. Configure Global Setup

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: './tests/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

```typescript
// tests/global-setup.ts
import { clerkSetup } from '@clerk/testing/playwright';

export default async function globalSetup() {
  await clerkSetup();
}
```

### 3. Set Environment Variables

```bash
# .env.test or .env.local
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# For testing
E2E_CLERK_USER_USERNAME=test@example.com
E2E_CLERK_USER_PASSWORD=your-test-password
```

### 4. Write Tests

```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Bypass bot detection
    await setupClerkTestingToken({ page });
  });

  test('sign in flow', async ({ page }) => {
    await page.goto('/sign-in');

    // Use Clerk's test helpers
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });

    // Verify signed in
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('protected route redirects when not signed in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/);
  });
});
```

---

## Playwright Patterns

### Reusable Auth State

Save auth state to avoid signing in every test:

```typescript
// tests/auth.setup.ts
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
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'authenticated',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        storageState: 'tests/.auth/user.json',
      },
    },
  ],
});
```

### Testing Different Sign-In Strategies

```typescript
// Password
await clerk.signIn({
  page,
  signInParams: {
    strategy: 'password',
    identifier: 'user@example.com',
    password: 'password123',
  },
});

// Email code (for testing OTP flows)
await clerk.signIn({
  page,
  signInParams: {
    strategy: 'email_code',
    identifier: 'user@example.com',
  },
});
// Then handle the code verification in your test

// Phone code
await clerk.signIn({
  page,
  signInParams: {
    strategy: 'phone_code',
    identifier: '+1234567890',
  },
});
```

### Testing Sign Out

```typescript
test('sign out', async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto('/dashboard');

  // Click user button and sign out
  await page.getByRole('button', { name: /user/i }).click();
  await page.getByRole('menuitem', { name: /sign out/i }).click();

  await expect(page).toHaveURL('/');
});
```

---

## Cypress Setup

### 1. Install Dependencies

```bash
npm install @clerk/testing --save-dev
```

### 2. Configure Cypress

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';
import { clerkSetup } from '@clerk/testing/cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      return clerkSetup({ config });
    },
  },
});
```

### 3. Add Commands

```typescript
// cypress/support/e2e.ts
import { addClerkCommands } from '@clerk/testing/cypress';

addClerkCommands({ Cypress, cy });
```

### 4. Write Tests

```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  beforeEach(() => {
    cy.clerkSignIn({
      strategy: 'password',
      identifier: Cypress.env('E2E_CLERK_USER_USERNAME'),
      password: Cypress.env('E2E_CLERK_USER_PASSWORD'),
    });
  });

  it('shows dashboard when signed in', () => {
    cy.visit('/dashboard');
    cy.contains('Welcome').should('be.visible');
  });

  it('can sign out', () => {
    cy.visit('/dashboard');
    cy.clerkSignOut();
    cy.url().should('include', '/sign-in');
  });
});
```

---

## Test User Strategies

### Option 1: Dedicated Test User

Create a test user in Clerk Dashboard with known credentials:

```bash
E2E_CLERK_USER_USERNAME=test@yourcompany.com
E2E_CLERK_USER_PASSWORD=TestPassword123!
```

### Option 2: Create Users via API

```typescript
// tests/helpers/create-test-user.ts
import { clerkClient } from '@clerk/nextjs/server';

export async function createTestUser() {
  const user = await clerkClient.users.createUser({
    emailAddress: [`test-${Date.now()}@example.com`],
    password: 'TestPassword123!',
  });
  return user;
}

export async function deleteTestUser(userId: string) {
  await clerkClient.users.deleteUser(userId);
}
```

### Option 3: Testing Tokens

For API testing without UI:

```typescript
// tests/api.spec.ts
import { test, expect } from '@playwright/test';
import { clerkClient } from '@clerk/nextjs/server';

test('API with auth', async ({ request }) => {
  // Create a session token for API testing
  const user = await clerkClient.users.getUser('user_xxx');

  const response = await request.get('/api/data', {
    headers: {
      Authorization: `Bearer ${testToken}`,
    },
  });

  expect(response.ok()).toBeTruthy();
});
```

---

## Common Issues

### Bot Detection

Always call `setupClerkTestingToken` before navigating:

```typescript
test.beforeEach(async ({ page }) => {
  await setupClerkTestingToken({ page }); // Must be first!
  await page.goto('/sign-in');
});
```

### Flaky Tests

Add proper waits:

```typescript
// Wait for Clerk to load
await page.waitForSelector('[data-clerk-component]');

// Wait for auth state
await page.waitForFunction(() => {
  return window.Clerk?.user !== undefined;
});
```

### CI Environment

Ensure environment variables are set in CI:

```yaml
# GitHub Actions
env:
  CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}
  CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
  E2E_CLERK_USER_USERNAME: ${{ secrets.E2E_CLERK_USER_USERNAME }}
  E2E_CLERK_USER_PASSWORD: ${{ secrets.E2E_CLERK_USER_PASSWORD }}
```

## Documentation

- [@clerk/testing](https://clerk.com/docs/testing/overview)
- [Playwright Integration](https://clerk.com/docs/testing/playwright)
- [Cypress Integration](https://clerk.com/docs/testing/cypress)
