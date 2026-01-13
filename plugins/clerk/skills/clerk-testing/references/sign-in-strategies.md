# Sign-In Strategies Reference

The `ClerkSignInParams` type supports these strategies:

```typescript
type ClerkSignInParams =
  | { strategy: 'password'; password: string; identifier: string; }
  | { strategy: 'phone_code' | 'email_code'; identifier: string; }
  | { strategy: 'ticket'; ticket: string; };
```

## Password Strategy

```typescript
await clerk.signIn({
  page,
  signInParams: {
    strategy: 'password',
    identifier: 'user@example.com', // email or username
    password: 'password123',
  },
});
```

## Phone/Email Code Strategy (Test Mode)

```typescript
// Uses test phone numbers (+15555550100 to +15555550199)
// or test emails (user+clerk_test@example.com)
// These auto-verify with code "424242"
await clerk.signIn({
  page,
  signInParams: {
    strategy: 'phone_code',
    identifier: '+15555550100', // test phone number
  },
});
```

## Email-Based Sign-In (Recommended)

```typescript
// Simplest for testing - automatically creates sign-in token via Backend API
// Requires CLERK_SECRET_KEY environment variable
await clerk.signIn({
  page,
  emailAddress: 'test@example.com',
});
```

This is the recommended approach as it:
- Works in both development and production environments
- Doesn't require test phone numbers or email codes
- Uses Clerk's Backend API to create a sign-in token automatically

## Testing Organizations

```typescript
// tests/organizations.spec.ts
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';
import { test, expect } from '@playwright/test';

test('should access organization dashboard', async ({ page }) => {
  await setupClerkTestingToken({ page });

  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });

  // Wait for Clerk to load
  await clerk.loaded({ page });

  // Navigate to org dashboard
  await page.goto('/org/my-org/dashboard');

  await expect(page.getByText('Organization Dashboard')).toBeVisible();
});
```

## Documentation

- [@clerk/testing Reference](https://clerk.com/docs/testing/overview)
- [Testing Tokens](https://clerk.com/docs/testing/testing-tokens)
