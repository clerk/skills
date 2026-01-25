---
name: testing-auth
description: E2E testing for Clerk apps with Playwright or Cypress.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Testing Authentication

```bash
npm install @clerk/testing --save-dev
```

## Templates

| Template | Use Case |
|----------|----------|
| `templates/playwright/global-setup.ts` | Playwright setup |
| `templates/playwright/auth.spec.ts` | Playwright tests |
| `templates/cypress/e2e.ts` | Cypress setup |
| `templates/cypress/auth.cy.ts` | Cypress tests |

## Environment Variables

```bash
E2E_CLERK_USER_USERNAME=test@example.com
E2E_CLERK_USER_PASSWORD=your-test-password
```

## Best practices

- Prefer using `clerk.signIn({ emailAddress })`, it is more efficient and bypasses the auth UI

## Common Pitfalls

- **Call `setupClerkTestingToken()` first** - before navigating to auth pages
- **Use test keys** - `pk_test_xxx`, `sk_test_xxx`
- **Save auth state** - `storageState` for faster tests
- **Wait for Clerk** - `[data-clerk-loaded="true"]`
- **Cypress** - add `addClerkCommands({ Cypress, cy })` to support file

## See Also

`setup/` (prerequisite)

## Docs

- [Testing](https://clerk.com/docs/testing/overview)
- [Playwright](https://clerk.com/docs/testing/playwright)
- [Cypress](https://clerk.com/docs/testing/cypress)
