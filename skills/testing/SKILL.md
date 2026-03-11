---
name: clerk-testing
description: Set up end-to-end authentication testing for Clerk apps using Playwright or Cypress. Configures test environments, bypasses bot detection with setupClerkTestingToken, and manages auth state persistence. Use when writing login tests, setting up Clerk E2E testing, configuring Playwright or Cypress auth flows, or mocking Clerk sessions in tests.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Testing

## Decision Tree

| Framework | Documentation |
|-----------|---------------|
| Overview | https://clerk.com/docs/guides/development/testing/overview |
| Playwright | https://clerk.com/docs/guides/development/testing/playwright/overview |
| Cypress | https://clerk.com/docs/guides/development/testing/cypress/overview |

## Mental Model

Test auth = isolated session state. Each test needs fresh auth context.
- `clerkSetup()` initializes test environment
- `setupClerkTestingToken()` bypasses bot detection
- `storageState` persists auth between tests for speed

## Workflow

1. Identify test framework (Playwright or Cypress)
2. WebFetch the appropriate URL from decision tree above
3. Follow official setup instructions
4. Use `pk_test_*` and `sk_test_*` keys only

## Playwright Quick Setup

```typescript
// playwright.config.ts
import { clerkSetup } from '@clerk/testing/playwright'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  globalSetup: clerkSetup,
})

// e2e/auth.spec.ts
import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { test, expect } from '@playwright/test'

test('authenticated user can access dashboard', async ({ page }) => {
  await setupClerkTestingToken({ page })
  await page.goto('/dashboard')
  await expect(page.locator('[data-clerk-component]')).toBeVisible()
})
```

## Best Practices

- Use `setupClerkTestingToken()` before navigating to auth pages
- Use test API keys: `pk_test_xxx`, `sk_test_xxx`
- Save auth state with `storageState` for faster tests
- Use `page.waitForSelector('[data-clerk-component]')` for Clerk UI
- Verify setup by running a simple auth test before building the full test suite

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

- [Demo Repo](https://github.com/clerk/clerk-playwright-nextjs/tree/95c7189a48c24d7e9e9744897040aa9418f68ac2/e2e)
