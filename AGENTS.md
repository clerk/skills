# Clerk Authentication Skills

Agent skills for building applications with Clerk authentication. Task-based architecture following the [Agent Skills Specification](https://agentskills.io/specification).

## Skill Architecture

| Type | Purpose | Example |
|------|---------|---------|
| **Task Skills** | Common journeys, cross-framework | `adding-auth`, `syncing-users` |
| **Reference Skills** | Deep framework-specific patterns | `nextjs-patterns` |

---

## Task Skills (Journeys)

### adding-auth
Add Clerk authentication to any project.

**Use when**: User asks to set up Clerk, add auth to a new app, or integrate Clerk with any framework.

**Frameworks supported**: Next.js, Express, Remix, React SPA

**Triggers**: "add auth", "set up Clerk", "integrate authentication", "install Clerk"

### customizing-auth-ui
Build custom sign-in and sign-up UIs with Clerk hooks.

**Use when**: User needs full control over auth UI, custom forms, multi-step flows, or branded authentication.

**Triggers**: "custom sign-in", "custom sign-up", "build auth form", "branded login"

### syncing-users
Sync Clerk users to your database via webhooks.

**Use when**: User needs to store user data locally, react to auth events, or sync with Prisma/Drizzle/Supabase.

**Triggers**: "sync users", "webhook handler", "user to database", "store users locally"

### testing-auth
Write E2E tests for Clerk-authenticated apps.

**Use when**: User wants to add tests, test auth flows, or set up Playwright/Cypress with Clerk.

**Triggers**: "test auth", "e2e tests", "Playwright Clerk", "Cypress Clerk", "bypass bot detection"

### managing-orgs
Build B2B multi-tenant apps with Clerk Organizations.

**Use when**: User needs team workspaces, role-based access, organization switching, or member invitations.

**Triggers**: "organizations", "multi-tenant", "team workspaces", "RBAC", "invite members"

---

## Reference Skills (Deep Patterns)

### nextjs-patterns
Advanced Next.js patterns with Clerk.

**Use when**: User asks about middleware strategies, Server Actions auth, App Router patterns, caching, or optimizing Clerk in Next.js.

**Triggers**: "middleware best practices", "Server Actions auth", "auth() vs useAuth()", "caching with auth"

---

## Skill Loading

Skills are loaded automatically when relevant based on trigger keywords. You can also explicitly reference them:

```
cat ~/.claude/skills/clerk/adding-auth/SKILL.md
cat ~/.claude/skills/clerk/nextjs-patterns/SKILL.md
```

## Environment Setup

Before using Clerk skills, ensure these environment variables are set:

```bash
# Required for all skills
export CLERK_SECRET_KEY="sk_test_..."

# Required for Next.js/React apps
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Optional for webhooks
export CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."
```

Get keys from: https://dashboard.clerk.com

## Quick Reference

| User Says | Skill | Why |
|-----------|-------|-----|
| "Add Clerk to my Next.js app" | `adding-auth` | Task, detects Next.js |
| "Set up authentication" | `adding-auth` | Generic task |
| "Build custom sign-in form" | `customizing-auth-ui` | Task |
| "Sync users to Postgres" | `syncing-users` | Task |
| "How do Server Actions work with Clerk?" | `nextjs-patterns` | Deep pattern |
| "Middleware best practices" | `nextjs-patterns` | Framework optimization |
| "Test my auth flow" | `testing-auth` | Task |
| "Add organizations to my app" | `managing-orgs` | Task |

## Documentation

- [Clerk Docs](https://clerk.com/docs)
- [Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [API Reference](https://clerk.com/docs/reference/backend-api)
- [Agent Skills Spec](https://agentskills.io/specification)

## Installation

```bash
curl -fsSL https://clerk.com/skills/install | bash
```

Or manually:
```bash
git clone https://github.com/clerk/skills ~/.claude/skills/clerk
```
