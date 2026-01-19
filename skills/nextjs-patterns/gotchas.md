# Next.js Patterns - Gotchas

Common pitfalls when using Clerk with Next.js App Router.

## Server vs Client Auth

### Missing await on auth()
```typescript
// WRONG - most common mistake!
export default function Page() {
  const { userId } = auth(); // Returns promise, not data!
}

// CORRECT - always await in Server Components
export default async function Page() {
  const { userId } = await auth();
}
```

### Using Hooks in Server Components
```typescript
// WRONG - hooks only work in Client Components
export default function ServerPage() {
  const { userId } = useAuth(); // Error!
}

// CORRECT - use auth() in Server Components
export default async function ServerPage() {
  const { userId } = await auth();
}

// Or make it a Client Component
'use client';
export default function ClientPage() {
  const { userId } = useAuth(); // Works!
}
```

## Middleware

### Matcher Not Catching Routes
```typescript
// WRONG - API routes not matched
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)'],
};

// CORRECT - include API routes
export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/(api|trpc)(.*)', // Don't forget this!
  ],
};
```

### Static Files Matched
```typescript
// WRONG - matching static files slows down app
matcher: ['/:path*']

// CORRECT - exclude static files
matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)', '/(api|trpc)(.*)']
```

## Caching

### Caching Auth Data
```typescript
// WRONG - caching page with user data
export const revalidate = 3600; // Cached for all users!

export default async function Page() {
  const { userId } = await auth();
  const userData = await fetchUser(userId);
  return <Profile data={userData} />; // Wrong user's data!
}

// CORRECT - use dynamic rendering or user-scoped cache
export const dynamic = 'force-dynamic';
// Or use unstable_cache with user key
```

### Cache Keys Without User
```typescript
// WRONG - same cache for all users
const data = await unstable_cache(
  () => fetchUserData(userId),
  ['user-data'], // Same key for everyone!
)();

// CORRECT - include userId in cache key
const data = await unstable_cache(
  () => fetchUserData(userId),
  ['user-data', userId], // User-specific cache
)();
```

## API Routes

### 401 vs 403 Confusion
```typescript
// 401 = Not authenticated (no valid session)
// 403 = Authenticated but not authorized

export async function GET(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 }); // Not logged in
  }

  const hasAccess = await checkPermission(userId);
  if (!hasAccess) {
    return new Response('Forbidden', { status: 403 }); // Logged in, no access
  }
}
```

### Not Protecting API Routes
```typescript
// WRONG - assuming middleware handles everything
export async function GET() {
  // No auth check!
  return Response.json(sensitiveData);
}

// CORRECT - always verify in route handler
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  return Response.json(sensitiveData);
}
```

## Server Actions

### Missing Auth in Server Actions
```typescript
// WRONG - no auth check
'use server';
export async function deleteItem(id: string) {
  await db.item.delete({ where: { id } }); // Anyone can delete!
}

// CORRECT - always check auth
'use server';
export async function deleteItem(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Also verify ownership
  const item = await db.item.findUnique({ where: { id } });
  if (item.ownerId !== userId) throw new Error('Forbidden');

  await db.item.delete({ where: { id } });
}
```

### Returning Sensitive Data
```typescript
// WRONG - returning full user object
'use server';
export async function getUser() {
  const user = await currentUser();
  return user; // Includes all fields!
}

// CORRECT - return only needed fields
'use server';
export async function getUser() {
  const user = await currentUser();
  return {
    name: user?.firstName,
    imageUrl: user?.imageUrl,
  };
}
```

## Redirect Loops

### Protected Page as Sign-In Page
```typescript
// WRONG - sign-in page requires auth
// middleware.ts
export default clerkMiddleware((auth) => {
  auth().protect(); // Blocks /sign-in!
});

// CORRECT - allow auth pages
export default clerkMiddleware((auth, req) => {
  const isAuthPage = ['/sign-in', '/sign-up'].includes(req.nextUrl.pathname);
  if (!isAuthPage) {
    auth().protect();
  }
});
```

### Redirect After Sign-In Not Working
```typescript
// Set redirect URLs in middleware or env vars
// .env.local
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding

// Or in middleware
export default clerkMiddleware((auth, req) => {
  if (!auth().userId && !isPublicRoute(req)) {
    return auth().redirectToSignIn({
      returnBackUrl: req.url, // Remember where user was going
    });
  }
});
```

## RSC Hydration

### Auth State Mismatch
```typescript
// Server renders with auth, client hydrates without
// Can cause hydration errors

// Use dynamic rendering for auth-dependent pages
export const dynamic = 'force-dynamic';

// Or handle loading state
const { isLoaded, userId } = useAuth();
if (!isLoaded) return null; // Prevent hydration mismatch
```

## See Also

- `adding-auth/gotchas.md` - Setup issues
- `references/` - Detailed patterns
