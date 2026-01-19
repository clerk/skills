# Adding Auth - Gotchas

Common pitfalls when setting up Clerk authentication.

## Security Issues

### API Key Exposure
```typescript
// WRONG - secret key in client code
const clerk = new Clerk(process.env.CLERK_SECRET_KEY); // Exposed!

// CORRECT - use publishable key on client
const clerk = new Clerk(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
```

### Missing Environment Variables
```bash
# Development (.env.local)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Production - set in hosting provider, not committed!
```

## Middleware Mistakes

### Forgetting the Matcher
```typescript
// WRONG - no matcher, middleware doesn't run
export default clerkMiddleware();

// CORRECT - include matcher
export default clerkMiddleware();
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Public Routes Not Configured
```typescript
// WRONG - everything protected, can't reach sign-in
export default clerkMiddleware((auth) => {
  auth().protect();
});

// CORRECT - allow public routes
export default clerkMiddleware((auth, req) => {
  const isPublic = ['/sign-in', '/sign-up', '/'].includes(req.nextUrl.pathname);
  if (!isPublic) auth().protect();
});
```

## Framework-Specific Issues

### Next.js App Router
```typescript
// WRONG - auth() without await in Server Components
export default function Page() {
  const { userId } = auth(); // Error or stale data!
}

// CORRECT - always await
export default async function Page() {
  const { userId } = await auth();
}
```

### React SPA (Vite)
```typescript
// WRONG - no ClerkProvider wrapper
ReactDOM.createRoot(root).render(<App />);

// CORRECT - wrap with ClerkProvider
ReactDOM.createRoot(root).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);
```

### Express
```typescript
// WRONG - middleware after routes
app.get('/api/protected', handler);
app.use(clerkMiddleware()); // Too late!

// CORRECT - middleware before routes
app.use(clerkMiddleware());
app.get('/api/protected', handler);
```

## OAuth Setup

### Redirect URI Mismatch
Provider dashboard must have EXACT callback URL:
- Development: `http://localhost:3000/sso-callback`
- Production: `https://yourapp.com/sso-callback`

### Missing Scopes
```typescript
// If you need user email, ensure scope is requested
// Configure in Dashboard > User & Authentication > Social Connections
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Sign-in attempts | 10/minute per IP |
| API calls | 100/minute per key |
| Webhook deliveries | 1000/hour |

## See Also

- `nextjs-patterns/gotchas.md` - Next.js-specific issues
