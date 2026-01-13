# Playwright Setup for Clerk

## Install

```bash
npm install -D @clerk/testing @playwright/test
npx playwright install
```

## Files to Copy

1. `global.setup.ts` → your project root
2. `playwright.config.ts` → your project root
3. `auth.spec.ts` → `tests/auth.spec.ts`
4. `auth-persistence.ts` → optional, for reusing auth state

## Key Pattern

```typescript
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';

test('auth test', async ({ page }) => {
  await setupClerkTestingToken({ page });
  await page.goto('/');  // Navigate first!
  await clerk.signIn({ page, signInParams: { strategy: 'password', identifier, password } });
  await clerk.loaded({ page });  // Wait for Clerk!
});
```

## Gotchas

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

### 3. Use serial mode in global setup

```typescript
// WRONG
export default async function globalSetup() { ... }

// RIGHT
import { test as setup } from '@playwright/test';
setup.describe.configure({ mode: 'serial' });
setup('clerk setup', async ({}) => { await clerkSetup(); });
```
