# Clerk Skills

Official Clerk authentication skills for AI coding agents. Build apps with Clerk auth using Claude Code, Cursor, Windsurf, OpenCode, Gemini CLI, and more.

## Installation

### Quick Install (All Agents)

```bash
curl -fsSL https://clerk.com/skills/install | bash
```

Supports: Claude Code, Cursor 1.6+, OpenCode, Windsurf, Gemini CLI, Aider

### Claude Code (Marketplace)

```bash
claude plugin marketplace add clerk/clerk-skills
claude plugin install clerk@clerk-skills
```

### Manual

```bash
git clone https://github.com/clerk/skills ~/.claude/skills/clerk
```

## Available Skills

| Skill | Purpose | Use When |
|-------|---------|----------|
| `clerk-nextjs` | Build Next.js apps with Clerk from scratch | "Add Clerk to my app", "Protect this route" |
| `clerk-auth-flows` | Custom sign-in/sign-up with Clerk hooks | "Build custom login form", "Add MFA" |
| `clerk-testing` | Setup @clerk/testing for e2e tests | "Add auth tests", "Test sign-in flow" |
| `clerk-webhooks` | Handle webhooks to sync data to DB | "Sync users to Prisma", "Handle user events" |

## Design Principles

### Progressive Disclosure

Agent loads only what's relevant to the user's framework:

```
SKILL.md (framework-agnostic, <100 lines)
  → detects framework config
  → routes to templates/{framework}/README.md
  → agent loads only that framework's code
```

### Naming Convention

`clerk-*` prefix for discoverability - type `/clerk` to find all skills:

```
clerk-auth-flows
clerk-nextjs
clerk-testing
clerk-webhooks
```

## Repository Structure

```
clerk-skills/
├── plugins/clerk/skills/
│   ├── clerk-auth-flows/
│   │   ├── SKILL.md
│   │   ├── references/
│   │   │   ├── sign-in-api.md
│   │   │   └── sign-up-api.md
│   │   └── templates/
│   │       ├── sign-in-password.tsx
│   │       ├── sign-up-verify.tsx
│   │       ├── oauth-buttons.tsx
│   │       └── mfa-totp.tsx
│   ├── clerk-nextjs/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   └── templates/
│   ├── clerk-testing/
│   │   ├── SKILL.md
│   │   └── templates/
│   │       ├── playwright/
│   │       └── cypress/
│   └── clerk-webhooks/
│       ├── SKILL.md
│       ├── references/
│       │   └── events.md
│       └── templates/
│           ├── nextjs/
│           ├── express/
│           ├── astro/
│           └── db-sync.ts
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

## Skill Details

### clerk-nextjs

Build Next.js applications with Clerk authentication.

**Features**:
- Project setup with ClerkProvider
- Route protection middleware
- Sign-in/sign-up pages
- Auth components (UserButton, SignInButton)
- Organization support (B2B/multi-tenant)
- Webhook handlers & server actions

**Scripts**:
| Script | Description |
|--------|-------------|
| `setup.sh` | Bootstrap new Next.js + Clerk project |
| `middleware.sh` | Generate route protection middleware |
| `auth-pages.sh` | Generate sign-in/sign-up pages |
| `components.sh` | Generate common components |
| `webhook.sh` | Generate webhook handlers |

### clerk-auth-flows

Build custom authentication UIs with Clerk hooks (not Elements - deprecated).

**Templates**:
| Template | Description |
|----------|-------------|
| `sign-in-password.tsx` | Full sign-in with password |
| `sign-up-verify.tsx` | Sign-up with email verification |
| `oauth-buttons.tsx` | OAuth (Google, GitHub) buttons |
| `mfa-totp.tsx` | MFA with TOTP codes |

### clerk-testing

Setup @clerk/testing for e2e authentication tests.

**Frameworks**:
- Playwright (`templates/playwright/`)
- Cypress (`templates/cypress/`)

### clerk-webhooks

Handle Clerk webhooks to sync data to your database.

**Frameworks**:
- Next.js (`templates/nextjs/`)
- Express (`templates/express/`)
- Astro (`templates/astro/`)

**Shared**: `templates/db-sync.ts` - ORM-agnostic database sync pattern

## Next: clerk-admin Subagent

Skills help agents **write Clerk code**. But agents still tell users "go to Dashboard" for config.

**Exploring**: `clerk-admin` subagent for PLAPI operations:
- Create webhook endpoints
- Configure org settings
- Manage domains
- Fetch secrets

Skills reference the subagent when admin operations are needed, keeping code-writing separate from configuration.

## Security

- Never share your Clerk secret key
- Use test keys (`sk_test_`) in development
- Audit operations in Clerk Dashboard logs

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `CLERK_SECRET_KEY not set` | Export your Clerk secret key |
| `401 Unauthorized` | Secret key is invalid or expired |
| Webhook 400 errors | Check `CLERK_WEBHOOK_SIGNING_SECRET` |
| Webhook 404 errors | Verify endpoint path matches route |

## Links

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Backend API Reference](https://clerk.com/docs/reference/backend-api)
- [Webhooks Guide](https://clerk.com/docs/webhooks/overview)

## License

MIT
