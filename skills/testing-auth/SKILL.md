---
name: testing-auth
description: Write E2E tests for Clerk-authenticated apps. Use when adding tests, testing auth flows, setting up Playwright or Cypress with Clerk, or bypassing bot detection in tests.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Testing Authentication with Clerk

Set up E2E testing for Clerk-authenticated applications using Playwright or Cypress.

## Quick Start

```bash
npm install @clerk/testing --save-dev
```

## Templates

| Template | Use Case |
|----------|----------|
| `templates/playwright/global-setup.ts` | Playwright global setup |
| `templates/playwright/auth.spec.ts` | Playwright auth tests |
| `templates/cypress/e2e.ts` | Cypress support setup |
| `templates/cypress/auth.cy.ts` | Cypress auth tests |

## Environment Variables

```bash
E2E_CLERK_USER_USERNAME=test@example.com
E2E_CLERK_USER_PASSWORD=your-test-password
```

## Key Concepts

1. **Bot Detection Bypass**: Call `setupClerkTestingToken()` before navigating
2. **Auth State Persistence**: Save session to `storageState` for faster tests
3. **Sign-In Strategies**: Password, email_code, phone_code, OAuth

## See Also

- `gotchas.md` - Common testing pitfalls
- `adding-auth/` - Basic auth setup (prerequisite)

## Documentation

- [@clerk/testing](https://clerk.com/docs/testing/overview)
- [Playwright Integration](https://clerk.com/docs/testing/playwright)
- [Cypress Integration](https://clerk.com/docs/testing/cypress)
