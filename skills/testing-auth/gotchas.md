# Testing Auth - Gotchas

Common pitfalls when testing Clerk authentication.

## Bot Detection

### Tests Blocked by Bot Protection
```typescript
// WRONG - navigating without setup
await page.goto('/sign-in');
await page.fill('input[name="email"]', email); // Blocked!

// CORRECT - setup testing token first
import { setupClerkTestingToken } from '@clerk/testing/playwright';

test.beforeEach(async ({ page }) => {
  await setupClerkTestingToken({ page });
});

test('sign in', async ({ page }) => {
  await page.goto('/sign-in');
  // Now it works!
});
```

### Missing @clerk/testing Package
```bash
# Must install the testing package
npm install @clerk/testing --save-dev
```

## Environment Setup

### Wrong API Keys
```bash
# Use TEST keys, not production!
E2E_CLERK_USER_USERNAME=test@example.com
E2E_CLERK_USER_PASSWORD=test-password-123

# These should be test instance keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### Test User Not Created
```bash
# Create a test user in your Clerk Dashboard (test instance)
# Or use the API:
curl -X POST https://api.clerk.com/v1/users \
  -H "Authorization: Bearer sk_test_xxx" \
  -d '{"email_address": ["test@example.com"], "password": "test-password"}'
```

## Session Persistence

### Not Saving Auth State
```typescript
// WRONG - logging in for every test
test('test 1', async ({ page }) => {
  await signIn(page);
  // ...
});
test('test 2', async ({ page }) => {
  await signIn(page); // Slow!
  // ...
});

// CORRECT - save and reuse state
// global-setup.ts
async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await setupClerkTestingToken({ page });
  await signIn(page);
  await page.context().storageState({ path: 'auth.json' });
  await browser.close();
}

// playwright.config.ts
export default {
  use: {
    storageState: 'auth.json',
  },
};
```

### Storage State Expired
```typescript
// Session tokens expire! Re-authenticate in global-setup before test run
// Add to CI: run global-setup before tests
```

## Playwright-Specific

### Wrong Selector for Clerk Components
```typescript
// WRONG - Clerk components have dynamic selectors
await page.click('button.sign-in');

// CORRECT - use data attributes or text
await page.click('button:has-text("Sign in")');
await page.click('[data-testid="sign-in-button"]');
```

### Waiting for Clerk to Load
```typescript
// WRONG - not waiting for Clerk JS
await page.goto('/');
await page.click('#protected-link'); // Clerk not ready!

// CORRECT - wait for Clerk
await page.goto('/');
await page.waitForSelector('[data-clerk-loaded="true"]');
// Or wait for specific element
await page.waitForSelector('.cl-userButtonTrigger');
```

## Cypress-Specific

### Clerk Intercepting Routes
```typescript
// Add to cypress/support/e2e.ts
import { addClerkCommands } from '@clerk/testing/cypress';
addClerkCommands({ Cypress, cy });

// In tests
cy.clerkSignIn({
  strategy: 'password',
  identifier: 'test@example.com',
  password: 'password',
});
```

### Session Not Persisting Between Tests
```typescript
// Cypress clears cookies by default
// Preserve Clerk session
Cypress.Cookies.defaults({
  preserve: ['__session', '__client'],
});
```

## CI/CD Issues

### Headless Browser Differences
```typescript
// Some Clerk features behave differently in headless mode
// Use headed mode for debugging
// playwright.config.ts
export default {
  use: {
    headless: process.env.CI ? true : false,
  },
};
```

### Rate Limiting in CI
```typescript
// Too many sign-in attempts can trigger rate limits
// Use different test users or add delays
await page.waitForTimeout(1000); // Between auth attempts
```

### Flaky Tests
```typescript
// Add retries for auth-related tests
test.describe.configure({ retries: 2 });

// Use proper waits, not arbitrary timeouts
await page.waitForURL('/dashboard'); // Not waitForTimeout
```

## OAuth Testing

### Can't Test Real OAuth
```typescript
// OAuth requires real browser interaction
// Options:
// 1. Use password strategy for E2E tests
// 2. Mock OAuth responses
// 3. Use Clerk's test mode with pre-authorized users
```

## See Also

- `adding-auth/gotchas.md` - Setup issues
