# Clerk Skills

Skills to help AI coding agents work more effectively with Clerk.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Install

```bash
npx add-skill clerk/skills
```

### Alternative Installation

```bash
# Using Vercel's skills CLI
npx skills add clerk/skills

# Manual (Claude Code)
git clone https://github.com/clerk/skills ~/.claude/skills/clerk
```

## Skills

| Skill | Purpose | Trigger Keywords |
|-------|---------|------------------|
| `setup` | Add Clerk to any framework | setup, integrate, sign-in |
| `customizing-auth-ui` | Custom sign-in/up flows | custom UI, forms, hooks |
| `syncing-users` | Webhook → DB sync | sync, webhook, Prisma, Drizzle |
| `testing-auth` | E2E auth testing | test, Playwright, Cypress |
| `managing-orgs` | Multi-tenant B2B | org, team, RBAC |
| `nextjs-patterns` | Advanced Next.js patterns | middleware, Server Actions |

## Quick Start

### 1. Get API Keys

Get your keys from the [Clerk Dashboard](https://dashboard.clerk.com) → **API Keys**.

### 2. Set Environment Variables

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### 3. Ask Your Agent

| You Say | Skill Used |
|---------|------------|
| "Add Clerk auth to my Next.js app" | `setup` |
| "Build custom sign-in form with hooks" | `customizing-auth-ui` |
| "Sync users to Prisma via webhooks" | `syncing-users` |
| "Add Playwright tests for auth" | `testing-auth` |
| "Set up organizations for B2B" | `managing-orgs` |

## Repository Structure

```
clerk-skills/
├── skills/
│   ├── SKILL.md                 # Master skill (decision trees)
│   ├── setup/
│   │   ├── SKILL.md
│   │   └── templates/
│   ├── customizing-auth-ui/
│   ├── syncing-users/
│   ├── testing-auth/
│   ├── managing-orgs/
│   └── nextjs-patterns/
│       ├── SKILL.md
│       └── references/          # Detailed pattern docs
├── commands/
│   └── clerk.md                 # /clerk command
└── README.md
```

## Using /clerk Command

For agents that support slash commands (Claude Code, OpenCode):

```
/clerk add auth to my Express app
/clerk sync users to Supabase
/clerk fix "redirect_uri_mismatch" error
```

## Resources

- [Clerk Docs](https://clerk.com/docs)
- [Dashboard](https://dashboard.clerk.com)
- [Discord](https://clerk.com/discord)
- [GitHub Examples](https://github.com/clerk/clerk-examples)

## Request a Skill

Don't see what you need? [Request a skill](https://github.com/clerk/skills/issues/new?template=skill-request.md).

## License

MIT
