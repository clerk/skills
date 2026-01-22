---
name: testing-auth
description: Write E2E tests for Clerk-authenticated apps. Use when adding tests, testing auth flows, setting up Playwright or Cypress with Clerk, or bypassing bot detection in tests.
license: MIT
metadata:
  author: clerk
  version: '1.0.0'
---

# Testing Authentication with Clerk

Set up E2E testing for Clerk-authenticated applications using Playwright or Cypress.

## Quick Start

```bash
npm install @clerk/testing --save-dev
```

## Templates

| Template                               | Use Case                |
| -------------------------------------- | ----------------------- |
| `templates/playwright/global-setup.ts` | Playwright global setup |
| `templates/playwright/auth.spec.ts`    | Playwright auth tests   |
| `templates/cypress/e2e.ts`             | Cypress support setup   |
| `templates/cypress/auth.cy.ts`         | Cypress auth tests      |

## Environment Variables

```bash
E2E_CLERK_USER_USERNAME=test@example.com
E2E_CLERK_USER_PASSWORD=your-test-password
```

## Key Concepts

1. **Bypass bot detection**: Call `setupClerkTestingToken()` before navigating
2. **Persist auth state**: Save session to `storageState` for faster tests
3. **Sign-in strategies**: Password, email_code, phone_code, OAuth

## Common Pitfalls

- **Call `setupClerkTestingToken()` first** before navigating to auth pages.
- **Use test instance keys**: `pk_test_xxx`, `sk_test_xxx`
- **Save auth state**: Use `storageState` for faster tests.
- **Wait for Clerk to load**: `[data-clerk-loaded="true"]` or `.cl-userButtonTrigger`.
- **Cypress setup**: Add `addClerkCommands({ Cypress, cy })` to support file.

## See Also

- `adding-auth/` - Basic auth setup (prerequisite)

## Documentation

- [Testing Overview](https://clerk.com/docs/testing/overview)
- [Playwright Integration](https://clerk.com/docs/testing/playwright)
- [Cypress Integration](https://clerk.com/docs/testing/cypress)
