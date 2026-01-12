# Clerk Authentication Skills

Agent skills for building applications with Clerk authentication.

## Available Skills

### clerk-api
Manage Clerk users, organizations, and invitations via the Backend API.

**Use when**: The user asks to list/create/update/delete users, organizations, or invitations.

**Operations**:
- Users: list, get, count, update, update-metadata, delete
- Organizations: list, get, create, update, delete, members
- Invitations: list, get, create, revoke

**Requires**: `CLERK_SECRET_KEY` environment variable

### nextjs-clerk
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
