---
name: testing
description: E2E testing for Clerk apps. Use with Playwright or Cypress for auth flow tests.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: "2.1.0"
---

# Testing

## Decision Tree

| Framework | Documentation |
|-----------|---------------|
| Overview | https://clerk.com/docs/guides/development/testing/overview |
| Playwright | https://clerk.com/docs/guides/development/testing/playwright/overview |
| Cypress | https://clerk.com/docs/guides/development/testing/cypress/overview |

## Setup

```bash
npm install @clerk/testing @playwright/test --save-dev
```

## Environment Variables

```bash
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

## Playwright Config

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    { name: 'tests', dependencies: ['setup'] }
  ]
});
```

## Global Setup

```typescript
// e2e/global.setup.ts
import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

setup('clerk setup', async ({}) => {
  await clerkSetup();
});
```

## Best Practices

- Use `setupClerkTestingToken()` before navigating to auth pages
- Use test API keys: `pk_test_xxx`, `sk_test_xxx`
- Save auth state with `storageState` for faster tests
- Use `page.waitForSelector('[data-clerk-component]')` for Clerk UI

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Production keys in tests | Security risk | Use `pk_test_*` keys |
| No `setupClerkTestingToken()` | Auth fails | Call before navigation |
| UI-based sign-in every test | Slow tests | Use `storageState` |

## Framework-Specific

**Playwright**: Use `globalSetup` for auth state
**Cypress**: Add `addClerkCommands({ Cypress, cy })` to support file

## See Also

- [Testing Overview](https://clerk.com/docs/guides/development/testing/overview)
- [Demo Repo](https://github.com/clerk/clerk-playwright-nextjs)
