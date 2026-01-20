---
name: clerk
description: Comprehensive Clerk authentication skill. Use for any auth task - setup, custom UI, database sync, testing, multi-tenant B2B, or troubleshooting.
license: MIT
metadata:
  author: clerk
  version: "2.0.0"
---

# Clerk Authentication Skill

Master skill for building with Clerk. Use decision trees below to find the right skill, then load detailed references.

## Quick Decision Tree

```
What do you need?
├─ Add auth to project → adding-auth/
├─ Custom sign-in/up UI → customizing-auth-ui/
├─ Sync users to database → syncing-users/
├─ E2E testing → testing-auth/
├─ Multi-tenant / B2B → managing-orgs/
└─ Advanced Next.js patterns → nextjs-patterns/
```

## Decision Trees by Task

### Platform: "What platform?"

```
Platform?
├─ Web (Next.js, React, Express, Remix) → adding-auth/
└─ Android → (planned)
```

### Setup: "I need to add authentication"

```
Framework?
├─ Next.js → adding-auth/ (templates/nextjs/)
├─ React + Vite → adding-auth/ (scripts/setup-react.sh)
├─ Express → adding-auth/ (scripts/setup-express.sh)
├─ Remix → adding-auth/ (scripts/setup-remix.sh)
└─ Other → adding-auth/ (manual setup)
```

### Data: "I need to sync users to my database"

```
ORM/Database?
├─ Prisma → syncing-users/ (templates/prisma/)
├─ Drizzle → syncing-users/ (templates/drizzle/)
├─ Supabase → syncing-users/ (templates/supabase/)
└─ Raw SQL/Other → syncing-users/ (webhook patterns)
```

### B2B: "I need multi-tenant / organizations"

```
Use case?
├─ B2B SaaS → managing-orgs/ (full org setup)
├─ Team workspaces → managing-orgs/ (org-switcher)
├─ Role-based access → managing-orgs/ (RBAC templates)
└─ Member invitations → managing-orgs/ (invite-form)
```

### Testing: "I need to test auth flows"

```
Test framework?
├─ Playwright → testing-auth/ (templates/playwright/)
└─ Cypress → testing-auth/ (templates/cypress/)
```

### Advanced: "I need Next.js patterns"

```
Pattern needed?
├─ Server vs Client auth → nextjs-patterns/references/server-vs-client.md
├─ Middleware strategies → nextjs-patterns/references/middleware-strategies.md
├─ Server Actions auth → nextjs-patterns/references/server-actions.md
├─ API route protection → nextjs-patterns/references/api-routes.md
└─ Caching with auth → nextjs-patterns/references/caching-auth.md
```

## Skill Index

| Category | Skill | When to Use |
|----------|-------|-------------|
| **Setup** | `adding-auth/` | New project, integrating Clerk, framework setup |
| **UI** | `customizing-auth-ui/` | Custom sign-in/up forms, branded auth flows |
| **Data** | `syncing-users/` | Webhook → database sync, Prisma/Drizzle/Supabase |
| **Testing** | `testing-auth/` | E2E auth testing with Playwright/Cypress |
| **B2B** | `managing-orgs/` | Multi-tenant, organizations, RBAC, teams |
| **Patterns** | `nextjs-patterns/` | Server components, middleware, caching |

## How to Use This Skill

1. **Identify task type** from decision trees above
2. **Load the appropriate skill** for detailed guidance
3. **Check gotchas.md** in each skill for common pitfalls
4. **Use templates** provided in skill directories

### File Structure per Skill

```
skills/{skill-name}/
├── SKILL.md      # Main skill instructions
├── gotchas.md    # Common pitfalls and security issues
├── templates/    # Code templates (if applicable)
└── references/   # Additional reference docs (if applicable)
```

## No Matching Skill?

If your task isn't covered by existing skills:

1. **Check Clerk Docs**: [clerk.com/docs](https://clerk.com/docs)
2. **Request a Skill**: [Create an issue](https://github.com/clerk/skills/issues/new?template=skill-request.md)

We actively review skill requests and prioritize based on community demand.

## Resources

- [Clerk Docs](https://clerk.com/docs)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [GitHub Examples](https://github.com/clerk/clerk-examples)
- [Discord Community](https://clerk.com/discord)
