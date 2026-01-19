# Customizing Auth UI - Gotchas

Common pitfalls when building custom authentication flows.

## Hook Usage

### Missing isLoaded Check
```typescript
// WRONG - accessing data before loaded
const { signIn } = useSignIn();
signIn.create({ ... }); // Error if not loaded!

// CORRECT - check isLoaded first
const { signIn, isLoaded } = useSignIn();
if (!isLoaded) return <Loading />;
signIn.create({ ... });
```

### Forgetting setActive After Sign-In
```typescript
// WRONG - signed in but session not activated
await signIn.create({ identifier: email, password });
// User appears not logged in!

// CORRECT - activate the session
const result = await signIn.create({ identifier: email, password });
if (result.status === 'complete') {
  await setActive({ session: result.createdSessionId });
}
```

## Form Handling

### Not Handling All Statuses
```typescript
// WRONG - only handling success
const result = await signIn.create({ ... });
router.push('/dashboard');

// CORRECT - handle all statuses
const result = await signIn.create({ ... });
switch (result.status) {
  case 'complete':
    await setActive({ session: result.createdSessionId });
    router.push('/dashboard');
    break;
  case 'needs_first_factor':
    // Show password/code input
    break;
  case 'needs_second_factor':
    // Show 2FA input
    break;
}
```

### Missing Error States
```typescript
// WRONG - no error handling
try {
  await signIn.create({ ... });
} catch (e) {
  console.error(e);
}

// CORRECT - show user-friendly errors
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';

try {
  await signIn.create({ ... });
} catch (err) {
  if (isClerkAPIResponseError(err)) {
    setError(err.errors[0].message);
  }
}
```

## Email Verification

### Not Waiting for Verification
```typescript
// WRONG - redirecting before verification complete
await signUp.create({ emailAddress, password });
router.push('/dashboard'); // User email not verified!

// CORRECT - handle verification flow
const result = await signUp.create({ emailAddress, password });
if (result.status === 'missing_requirements') {
  await signUp.prepareEmailAddressVerification();
  // Show code input UI
}
```

### Code Expiration
- Email codes expire after 10 minutes
- Show countdown timer
- Provide "Resend code" button

## OAuth with Custom UI

### Missing Redirect Handling
```typescript
// WRONG - no callback handling
await signIn.authenticateWithRedirect({
  strategy: 'oauth_google',
  redirectUrl: '/sso-callback',
});

// You need a page at /sso-callback that handles the return!
// pages/sso-callback.tsx or app/sso-callback/page.tsx
```

### SSO Callback Page
```typescript
// app/sso-callback/page.tsx
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallback() {
  return <AuthenticateWithRedirectCallback />;
}
```

## Styling Conflicts

### CSS Conflicts with Clerk Components
```css
/* WRONG - global styles affect Clerk modals */
button { background: red; }

/* CORRECT - scope styles or use Clerk's appearance prop */
.my-app button { background: red; }
```

### Z-Index Issues
Clerk modals use `z-index: 9999`. Ensure your UI doesn't conflict.

## Multi-Step Flows

### State Not Persisted
```typescript
// WRONG - state lost on refresh
const [step, setStep] = useState(1);

// CORRECT - persist to URL or session storage
const searchParams = useSearchParams();
const step = parseInt(searchParams.get('step') || '1');
```

## See Also

- `adding-auth/gotchas.md` - Setup issues
