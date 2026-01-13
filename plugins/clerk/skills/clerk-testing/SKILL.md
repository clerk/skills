---
name: clerk-testing
description: Write E2E tests for Clerk-authenticated apps using Playwright or Cypress. Use when adding tests, testing auth flows, debugging test failures, or setting up testing infrastructure for Clerk apps.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Clerk Testing Skill

Write E2E tests for Clerk-authenticated applications using @clerk/testing.

## Framework Detection

Check what testing framework the project uses:

| File | Framework |
|------|-----------|
| `playwright.config.ts` | Playwright → use `templates/playwright/` |
| `cypress.config.ts` | Cypress → use `templates/cypress/` |

## Environment Variables

```bash
# .env.local or .env.test
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Test user credentials
E2E_CLERK_USER_USERNAME=test@example.com
E2E_CLERK_USER_PASSWORD=testpassword123
```

> **Important**: Use test keys (`pk_test_`, `sk_test_`), not production keys.

## Playwright Quick Start

```bash
npm install -D @clerk/testing @playwright/test
npx playwright install
```

Copy templates from `templates/playwright/`:
- `global.setup.ts` - Clerk setup with serial mode
- `playwright.config.ts` - Config with globalSetup
- `auth.spec.ts` - Auth test examples

Key pattern:

```typescript
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';

test('auth test', async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto('/');  // Navigate first!
  await clerk.signIn({ page, signInParams: { strategy: 'password', identifier, password } });
  await clerk.loaded({ page });  // Wait for Clerk!
});
```

## Cypress Quick Start

```bash
npm install -D @clerk/testing cypress
```

Copy templates from `templates/cypress/`:
- `cypress.config.ts` - Config with clerkSetup
- `commands.ts` - Adds cy.clerkSignIn, cy.clerkSignOut, cy.clerkLoaded
- `e2e.ts` - Import commands
- `auth.cy.ts` - Auth test examples

Key pattern:

```typescript
it('auth test', () => {
  cy.visit('/');
  cy.clerkSignIn({ strategy: 'password', identifier, password });
  cy.clerkLoaded();
});
```

## Common Gotchas

### 1. Navigate before signIn

```typescript
// WRONG
await clerk.signIn({ page, ... }); // No app context!

// RIGHT
await page.goto('/');
await clerk.signIn({ page, ... });
```

### 2. Wait for Clerk to load

```typescript
// WRONG - Race condition
await clerk.signIn({ page, ... });
await page.goto('/dashboard');

// RIGHT
await clerk.signIn({ page, ... });
await clerk.loaded({ page });
await page.goto('/dashboard');
```

### 3. Playwright: Use serial mode in global setup

```typescript
// WRONG
export default async function globalSetup() { ... }

// RIGHT
import { test as setup } from '@playwright/test';
setup.describe.configure({ mode: 'serial' });
setup('clerk setup', async ({}) => { await clerkSetup(); });
```

### 4. Cypress: Use addClerkCommands

```typescript
// WRONG
Cypress.Commands.add('clerkSignIn', ...);

// RIGHT
import { addClerkCommands } from '@clerk/testing/cypress';
addClerkCommands({ Cypress, cy });
```

### 5. Cypress: Return clerkSetup in config

```typescript
// WRONG
setupNodeEvents(on, config) { clerkSetup({ config }); }

// RIGHT
setupNodeEvents(on, config) { return clerkSetup({ config }); }
```

### 6. Create test user

Create a dedicated test user in Clerk Dashboard → Users with known credentials.

## Templates

| Path | Description |
|------|-------------|
| `templates/playwright/` | Playwright setup, config, tests |
| `templates/cypress/` | Cypress setup, config, tests |
| `references/sign-in-strategies.md` | All sign-in strategies + organizations |

## Documentation

- [@clerk/testing Reference](https://clerk.com/docs/testing/overview)
- [Playwright Testing Guide](https://clerk.com/docs/testing/playwright)
- [Cypress Testing Guide](https://clerk.com/docs/testing/cypress)
