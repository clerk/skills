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

## Mental Model

Test auth = isolated session state. Each test needs fresh auth context.
- `clerkSetup()` initializes test environment
- `setupClerkTestingToken()` bypasses bot detection
- `storageState` persists auth between tests for speed

## Minimal Pattern

```typescript
// global.setup.ts
import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'

setup('global setup', async ({}) => {
  await clerkSetup()
})

// playwright.config.ts
projects: [
  { name: 'global setup', testMatch: /global\.setup\.ts/ },
  {
    name: 'tests',
    dependencies: ['global setup'],
    use: { storageState: 'playwright/.clerk/user.json' }  // Reuse auth
  }
]

// my-test.spec.ts
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test('authenticated flow', async ({ page }) => {
  await setupClerkTestingToken({ page })
  await page.goto('/dashboard')
})
```

## Workflow

1. Identify test framework (Playwright or Cypress)
2. WebFetch the appropriate URL from decision tree above
3. Follow official setup instructions
4. Use `pk_test_*` and `sk_test_*` keys only

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
