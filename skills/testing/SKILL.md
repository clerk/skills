---
name: testing
description: E2E testing for Clerk apps. Use with Playwright or Cypress for auth flow tests.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: "2.0.0"
---

# Testing

## Decision Tree

| Framework | Documentation |
|-----------|---------------|
| Overview | https://clerk.com/docs/testing/overview |
| Playwright | https://clerk.com/docs/testing/playwright |
| Cypress | https://clerk.com/docs/testing/cypress |

## Setup

```bash
npm install @clerk/testing --save-dev
```

## Environment Variables

```bash
E2E_CLERK_USER_USERNAME=test@example.com
E2E_CLERK_USER_PASSWORD=your-test-password
```

## Best Practices

- Use `clerk.signIn()` to bypass auth UI (faster)
- Use test API keys: `pk_test_xxx`, `sk_test_xxx`
- Save auth state with `storageState` for faster tests
- Call `setupClerkTestingToken()` before navigating to auth pages

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Production keys in tests | Security risk | Use `pk_test_*` keys |
| No `setupClerkTestingToken()` | Auth fails | Call before navigation |
| UI-based sign-in | Slow tests | Use `clerk.signIn()` |

## Framework-Specific

**Playwright**: Use `globalSetup` for auth state
**Cypress**: Add `addClerkCommands({ Cypress, cy })` to support file

## See Also

- [Testing Overview](https://clerk.com/docs/testing/overview)
