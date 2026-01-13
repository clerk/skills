# Cypress Setup for Clerk

## Install

```bash
npm install -D @clerk/testing cypress
```

## Files to Copy

1. `cypress.config.ts` → your project root
2. `commands.ts` → `cypress/support/commands.ts`
3. `e2e.ts` → `cypress/support/e2e.ts`
4. `auth.cy.ts` → `cypress/e2e/auth.cy.ts`

## Key Pattern

```typescript
it('auth test', () => {
  cy.visit('/');
  cy.clerkSignIn({ strategy: 'password', identifier, password });
  cy.clerkLoaded();
});
```

## Gotchas

### 1. Use addClerkCommands

```typescript
// WRONG
Cypress.Commands.add('clerkSignIn', ...);

// RIGHT
import { addClerkCommands } from '@clerk/testing/cypress';
addClerkCommands({ Cypress, cy });
```

### 2. Return clerkSetup in config

```typescript
// WRONG
setupNodeEvents(on, config) { clerkSetup({ config }); }

// RIGHT
setupNodeEvents(on, config) { return clerkSetup({ config }); }
```

### 3. Visit before signIn

```typescript
// WRONG
cy.clerkSignIn({ ... }); // No app context!

// RIGHT
cy.visit('/');
cy.clerkSignIn({ ... });
```
