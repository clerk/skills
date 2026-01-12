# Next.js Clerk Authentication Skill

An Agent Skill that helps you implement Clerk authentication in Next.js applications. This skill provides scripts, templates, and code patterns for building secure, authenticated Next.js apps.

## Features

- 🚀 Quick project setup with Clerk pre-configured
- 🔐 Route protection with middleware
- 👤 User authentication (sign-in, sign-up, user management)
- 🏢 Organization support for B2B/multi-tenant apps
- 🎨 Pre-built UI components and custom flow templates
- 🔗 Webhook handling for user/org events
- 📱 Server and Client component patterns

## Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- A Clerk account and application ([Get started free](https://dashboard.clerk.com/sign-up))

### Installation

#### Option A: Claude.ai

1. Zip this directory
2. Go to Settings → Features in [claude.ai](https://claude.ai)
3. Upload the zip under Custom Skills

#### Option B: Claude Code

Copy this directory into your project's `.claude/skills/` folder:

```bash
cp -r nextjs-clerk/ .claude/skills/nextjs-clerk
```

### Environment Setup

Get your API keys from the [Clerk Dashboard](https://dashboard.clerk.com) and create a `.env.local` file:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Optional: Custom sign-in/sign-up URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `setup.sh` | Initialize a new Next.js project with Clerk |
| `middleware.sh` | Generate middleware with customizable route protection |
| `auth-pages.sh` | Create sign-in and sign-up pages |
| `components.sh` | Generate common auth component patterns |
| `webhook.sh` | Set up Clerk webhook handler |

### Usage Examples

```bash
# Set up a new project
bash setup.sh my-clerk-app

# Add middleware to existing project
bash middleware.sh

# Generate auth pages
bash auth-pages.sh

# Generate common components
bash components.sh
```

## File Structure

```
nextjs-clerk/
├── SKILL.md              # Skill definition (for Claude)
├── README.md             # This file
├── setup.sh              # Project scaffolding script
├── middleware.sh         # Middleware generator
├── auth-pages.sh         # Auth pages generator
├── components.sh         # Component generator
├── webhook.sh            # Webhook setup script
└── templates/
    ├── layout.tsx        # Root layout with ClerkProvider
    ├── middleware.ts     # Middleware template
    ├── sign-in/          # Sign-in page template
    ├── sign-up/          # Sign-up page template
    ├── components/       # Reusable component templates
    └── api/              # API route templates
```

## Common Patterns

### Protecting Routes

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/private(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Server Components

```typescript
// app/dashboard/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId, orgId, orgRole } = await auth();
  
  if (!userId) {
    return <div>Please sign in</div>;
  }

  const user = await currentUser();
  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      {orgId && <p>Organization: {orgId}</p>}
    </div>
  );
}
```

### Client Components

```typescript
'use client';
import { useUser, useAuth, useOrganization } from '@clerk/nextjs';

export function UserProfile() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const { organization } = useOrganization();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Sign in to continue</div>;

  return (
    <div>
      <p>Hello, {user.firstName}!</p>
      {organization && <p>Org: {organization.name}</p>}
    </div>
  );
}
```

### API Routes

```typescript
// app/api/protected/route.ts
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId, orgId } = await auth();

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch data scoped to user or organization
  return Response.json({ userId, orgId });
}
```

### Server Actions

```typescript
// app/actions.ts
'use server';
import { auth } from '@clerk/nextjs/server';

export async function createItem(formData: FormData) {
  const { userId, orgId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  // Create item in database
}
```

## Organizations (B2B)

For multi-tenant applications:

### Enable Organizations

1. Go to Clerk Dashboard → Organizations → Settings
2. Enable Organizations
3. Configure roles and permissions

### Organization Switcher

```tsx
import { OrganizationSwitcher } from '@clerk/nextjs';

export function Header() {
  return (
    <header>
      <OrganizationSwitcher 
        hidePersonal={true}  // For B2B apps
        afterSelectOrganizationUrl="/dashboard"
        afterCreateOrganizationUrl="/onboarding"
      />
    </header>
  );
}
```

### Role-Based Access

```tsx
import { Protect } from '@clerk/nextjs';

export function AdminSection() {
  return (
    <Protect
      role="org:admin"
      fallback={<p>Admin access required</p>}
    >
      <AdminDashboard />
    </Protect>
  );
}
```

## Webhooks

Sync Clerk events with your database:

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;
  const headerPayload = await headers();
  
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);
  
  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id!,
      'svix-timestamp': svix_timestamp!,
      'svix-signature': svix_signature!,
    }) as WebhookEvent;
  } catch (err) {
    return Response.json({ error: 'Invalid webhook' }, { status: 400 });
  }

  switch (evt.type) {
    case 'user.created':
      await db.users.create({ data: { clerkId: evt.data.id } });
      break;
    case 'user.deleted':
      await db.users.delete({ where: { clerkId: evt.data.id } });
      break;
    case 'organization.created':
      await db.orgs.create({ data: { clerkId: evt.data.id, name: evt.data.name } });
      break;
  }

  return Response.json({ received: true });
}
```

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [@clerk/nextjs API Reference](https://clerk.com/docs/references/nextjs/overview)
- [Clerk Backend API](https://clerk.com/docs/reference/backend-api)
- [Clerk Discord](https://clerk.com/discord)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing` | Add key to `.env.local` and restart dev server |
| `401 Unauthorized` in API routes | Ensure middleware is configured and route is protected |
| Middleware not running | Check `matcher` config in `middleware.ts` |
| Session not persisting | Verify `ClerkProvider` wraps your entire app |

## License

MIT

