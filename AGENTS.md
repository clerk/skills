# Clerk Authentication Skills

Agent skills for building applications with Clerk authentication.

## Available Skills

### Core Skills (0-1 Setup)

#### clerk-api
Manage Clerk users, organizations, and invitations via the Backend API.

**Use when**: The user asks to list/create/update/delete users, organizations, or invitations.

**Operations**:
- Users: list, get, count, update, update-metadata, delete
- Organizations: list, get, create, update, delete, members
- Invitations: list, get, create, revoke

**Requires**: `CLERK_SECRET_KEY` environment variable

#### nextjs-clerk
Build Next.js applications with Clerk authentication.

**Use when**: The user asks to add Clerk auth to a Next.js app, protect routes, or create auth UI.

**Operations**:
- Project setup with ClerkProvider
- Route protection middleware
- Sign-in/sign-up pages
- Auth components (UserButton, SignInButton, etc.)
- Organization support (B2B/multi-tenant)
- Webhook handlers

**Requires**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

### Production Skills (1-N Development)

#### webhook-sync
Sync Clerk users and organizations to your database via webhooks.

**Use when**: "Sync users to Prisma", "Handle user webhooks", "Set up database sync"

**Patterns**:
- Webhook route handlers with signature verification
- Prisma, Drizzle, Supabase database adapters
- User/organization lifecycle events

**Requires**: `CLERK_WEBHOOK_SECRET`

#### protect-routes
Implement proper route protection with authentication and authorization.

**Use when**: "Protect this route", "Add permission check", "auth() was called but..." errors

**Patterns**:
- `auth.protect()` vs `auth()`
- Permission-based: `has({ permission: 'org:settings:manage' })`
- Role-based: `has({ role: 'org:admin' })`
- API route and Server Action protection
- HTTP status codes (401 vs 403)

#### org-rbac
Build B2B SaaS with organizations and role-based access control.

**Use when**: "Add RBAC", "Manage team permissions", "Organization invitations"

**Patterns**:
- Organization URL sync
- Role and permission checks
- Member management (list, update role, remove)
- Invitation flows (create, list, revoke)
- Organization metadata

#### profile-page
Build user profile pages with the server/client hybrid pattern.

**Use when**: "Build profile page", "currentUser vs useUser confusion", "Profile form"

**Patterns**:
- Server Component: `currentUser()` for initial data
- Client Component: `useUser()` for live updates
- API routes for metadata mutations
- Image upload with `setProfileImage()`

#### billing-checkout
Implement Clerk Billing with subscriptions and payments.

**Use when**: "Add payments", "Implement checkout flow", "Feature gating"

**Patterns**:
- Experimental checkout API (`@clerk/nextjs/experimental`)
- Complete flow: `start()` → `confirm()` → `finalize()`
- PricingTable component
- Feature-based authorization: `has({ feature: '...' })`
- Subscription webhooks

#### clerk-testing
Write E2E tests for Clerk-authenticated applications.

**Use when**: "Add tests", "Test auth flows", "Set up Playwright/Cypress"

**Patterns**:
- `clerkSetup()` global setup
- `setupClerkTestingToken()` to bypass bot detection
- `clerk.signIn()` with multiple strategies
- Auth state persistence with storageState

## Skill Loading

Skills are loaded automatically when relevant. You can also explicitly load them:

```
Load the clerk-api skill: cat ~/.claude/skills/clerk/clerk-api.md
Load the nextjs-clerk skill: cat ~/.claude/skills/clerk/nextjs-clerk.md
```

## Environment Setup

Before using Clerk skills, ensure these environment variables are set:

```bash
# Required for all skills
export CLERK_SECRET_KEY="sk_test_..."

# Required for Next.js apps
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Optional for webhooks
export CLERK_WEBHOOK_SECRET="whsec_..."
```

Get keys from: https://dashboard.clerk.com

## Common Patterns

### Protect a Route (Next.js)
Use `clerkMiddleware()` with `createRouteMatcher()` to define protected routes.

### Add Auth UI
Use `<SignInButton>`, `<SignUpButton>`, `<UserButton>` components with ClerkProvider.

### Server-Side Auth
Use `auth()` or `currentUser()` from `@clerk/nextjs/server` in Server Components.

### Organizations (B2B)
Enable organizations in Clerk Dashboard, use `<OrganizationSwitcher>` component.

## Documentation

- Clerk Docs: https://clerk.com/docs
- Next.js Quickstart: https://clerk.com/docs/quickstarts/nextjs
- API Reference: https://clerk.com/docs/reference/backend-api

## Installation

```bash
curl -fsSL https://clerk.com/skills/install | bash
```

Or manually:
```bash
git clone https://github.com/clerk/skills ~/.claude/skills/clerk
```
