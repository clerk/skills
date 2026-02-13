<p align="center">
  <a href="https://clerk.com?utm_source=github&utm_medium=clerk_skills" target="_blank" rel="noopener noreferrer">
    <img src="https://images.clerk.com/static/logo-light-mode-400x400.png" height="64">
  </a>
  <br />
</p>
<div align="center">
  <h1>
    Clerk Skills
  </h1>
  <a href="https://clerk.com/docs">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-clerk-green.svg" />
  </a>
  <a href="https://discord.com/invite/b5rXHjAg7A">
    <img alt="Discord" src="https://img.shields.io/discord/856971667393609759?color=7389D8&label&logo=discord&logoColor=ffffff" />
  </a>
  <a href="https://twitter.com/clerk">
    <img alt="Twitter" src="https://img.shields.io/twitter/url.svg?label=%40clerk&style=social&url=https%3A%2F%2Ftwitter.com%2Fclerk" />
  </a>
  <br />
  <br />
  <p>
    <strong>
      Skills to help AI coding agents work more effectively with Clerk.
    </strong>
  </p>
</div>

---

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

| Skill                   | Purpose                                      | When to Use                            | Type               |
| ----------------------- | -------------------------------------------- | -------------------------------------- | ------------------ |
| `/clerk`                | **Clerk router** - Routes to the right skill | Always start here                      | Router             |
| `/clerk-new`            | Bootstrap a full Clerk project from scratch  | Starting a new project with Clerk      | Project Generator  |
| `clerk-setup`           | Add Clerk to any framework                   | New projects, framework setup          | Auth Setup         |
| `clerk-custom-ui`       | Custom sign-in/up components and appearance  | Building custom forms, styling         | UI Customization   |
| `clerk-nextjs-patterns` | Advanced Next.js patterns                    | Server Actions, middleware, caching    | Framework Patterns |
| `clerk-orgs`            | Multi-tenant B2B organizations               | Building team workspaces, RBAC         | B2B SaaS           |
| `clerk-webhooks`        | Real-time events and data syncing            | Webhooks, database sync, notifications | Data Sync          |
| `clerk-testing`         | E2E testing for auth flows                   | Writing Playwright/Cypress tests       | Testing            |

## Quick Start

### 1. Get API Keys

Get your keys from the [Clerk Dashboard](https://dashboard.clerk.com) → **API Keys**.

### 2. Set Environment Variables

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### 3. Ask Your Agent

| You Say                                  | Skill Used              |
| ---------------------------------------- | ----------------------- |
| "Add Clerk auth to my Next.js app"       | `clerk-setup`           |
| "Build custom sign-in form with styling" | `clerk-custom-ui`       |
| "Sync users to Prisma via webhooks"      | `clerk-webhooks`        |
| "Add Playwright tests for auth"          | `clerk-testing`         |
| "Set up organizations for my B2B app"    | `clerk-orgs`            |
| "Use Server Actions with Clerk"          | `clerk-nextjs-patterns` |

### Using /clerk-new

`/clerk-new` scaffolds a complete Clerk project end-to-end — framework setup, shadcn UI, Clerk SDK, middleware, auth pages, and a Clerk app instance via the platform API.

Requires `CLERK_PLATFORM_TOKEN` in your root `.env` to create Clerk app instances via the platform API.

Options can be natural language, recognized CLI flags, or a combination of both.

```bash
# Interactive — walks through all options
/clerk-new

# One-shot — accepts all defaults, creates test-app/ instantly
/clerk-new one-shot

# One-shot with overrides (flags or natural language)
/clerk-new one-shot biome bun
/clerk-new one-shot --use-pnpm --eslint
/clerk-new one-shot use bun with biome and the waitlist template

# Dry run — prints commands without executing
/clerk-new --dry-mode

# Show all available options
/clerk-new help
```

## Repository Structure

```
clerk-skills/
├── .claude-plugin/
│   └── marketplace.json         # Plugin registry
├── skills/
│   ├── clerk/                   # Router skill
│   │   └── SKILL.md
│   ├── clerk-new/               # Project generator
│   │   ├── SKILL.md
│   │   ├── references/          # Framework & UI docs
│   │   └── scripts/             # Platform API setup
│   ├── setup/                   # Framework setup
│   │   └── SKILL.md
│   ├── custom-ui/               # Component customization
│   │   └── SKILL.md
│   ├── nextjs-patterns/         # Next.js patterns
│   │   └── SKILL.md
│   ├── orgs/                    # Organizations (B2B)
│   │   └── SKILL.md
│   ├── webhooks/                # Webhooks & data sync
│   │   └── SKILL.md
│   └── testing/                 # E2E testing
│       └── SKILL.md
└── README.md
```

## Using /clerk Command

For agents that support slash commands (Claude Code, OpenCode):

```
/clerk add auth to my Express app
/clerk sync users to Supabase
/clerk fix "redirect_uri_mismatch" error

/clerk-new one-shot biome bun
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
