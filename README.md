# Clerk Skills

Official Clerk authentication skills for AI coding agents. Build apps with Clerk auth using Claude Code, Cursor, Windsurf, OpenCode, Gemini CLI, and more.

## Installation

### Quick Install (All Agents)

```bash
curl -fsSL https://raw.githubusercontent.com/clerk/skills/main/install.sh | bash
```

Supports: Claude Code, Cursor 1.6+, OpenCode, Windsurf, Gemini CLI, Aider

### Claude Code (Manual)

```bash
git clone https://github.com/clerk/skills ~/.claude/skills/clerk
```

## Available Skills

### Task Skills (Journeys)

| Skill | Purpose | Use When |
|-------|---------|----------|
| `adding-auth` | Add Clerk to any project | "Add Clerk to my app", "Set up authentication" |
| `customizing-auth-ui` | Custom sign-in/sign-up UIs | "Build custom login form", "Branded auth" |
| `syncing-users` | Sync users to DB via webhooks | "Sync users to Prisma", "Handle user events" |
| `testing-auth` | E2E tests with Playwright/Cypress | "Add auth tests", "Test sign-in flow" |
| `managing-orgs` | B2B multi-tenant apps | "Add organizations", "Team workspaces" |

### Reference Skills (Deep Patterns)

| Skill | Purpose | Use When |
|-------|---------|----------|
| `nextjs-patterns` | Advanced Next.js + Clerk patterns | "Middleware best practices", "Server Actions auth" |

## Repository Structure

```
clerk-skills/
├── plugins/clerk/skills/
│   ├── adding-auth/           # Add Clerk to any project
│   │   ├── SKILL.md
│   │   └── templates/nextjs/
│   ├── customizing-auth-ui/   # Custom auth UIs
│   │   ├── SKILL.md
│   │   └── templates/
│   ├── syncing-users/         # Webhooks → DB sync
│   │   ├── SKILL.md
│   │   └── templates/{prisma,drizzle,supabase}/
│   ├── testing-auth/          # E2E testing
│   │   ├── SKILL.md
│   │   └── templates/{playwright,cypress}/
│   ├── managing-orgs/         # B2B organizations
│   │   ├── SKILL.md
│   │   └── templates/
│   └── nextjs-patterns/       # Advanced patterns (reference)
│       ├── SKILL.md
│       └── references/
├── install.sh
├── AGENTS.md
└── README.md
```

## Setup

### 1. Get API Keys

Get your keys from the [Clerk Dashboard](https://dashboard.clerk.com) under **API Keys**.

### 2. Set Environment Variables

```bash
# Required for all skills
export CLERK_SECRET_KEY="sk_test_..."

# Required for Next.js apps
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Required for webhooks
export CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."
```

## Quick Reference

| User Says | Skill Triggered |
|-----------|-----------------|
| "Add Clerk to my Next.js app" | `adding-auth` |
| "Build custom sign-in form" | `customizing-auth-ui` |
| "Sync users to Postgres" | `syncing-users` |
| "Test my auth flow" | `testing-auth` |
| "Add organizations" | `managing-orgs` |
| "Middleware best practices" | `nextjs-patterns` |

## Links

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Backend API Reference](https://clerk.com/docs/reference/backend-api)
- [Webhooks Guide](https://clerk.com/docs/webhooks/overview)

## License

MIT
