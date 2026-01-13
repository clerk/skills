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

Detect which framework the project uses, then read ONLY that README:

| Detected File | Action |
|---------------|--------|
| `playwright.config.ts` | Read `templates/playwright/README.md` |
| `cypress.config.ts` | Read `templates/cypress/README.md` |

The README contains install instructions, key patterns, and framework-specific gotchas.

## Environment Variables

```bash
# .env.local or .env.test
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Test user credentials
E2E_CLERK_USER_USERNAME=test@example.com
E2E_CLERK_USER_PASSWORD=testpassword123
```

> Use test keys (`pk_test_`, `sk_test_`), not production.

## Templates

| Framework | Templates |
|-----------|-----------|
| Playwright | `templates/playwright/global.setup.ts`, `playwright.config.ts`, `auth.spec.ts` |
| Cypress | `templates/cypress/cypress.config.ts`, `commands.ts`, `auth.cy.ts` |

## Shared Reference

`references/sign-in-strategies.md` - All sign-in strategies, organizations testing.

## Critical Pattern

Both frameworks require:
1. **Navigate first** - Go to app before signing in
2. **Wait for Clerk** - Call loaded() after signIn
3. **Test user exists** - Create in Clerk Dashboard first

## Documentation

- [@clerk/testing](https://clerk.com/docs/testing/overview)
- [Playwright Guide](https://clerk.com/docs/testing/playwright)
- [Cypress Guide](https://clerk.com/docs/testing/cypress)
