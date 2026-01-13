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

### Core Skills (0-1 Setup)

| Skill | Description | Use When |
|-------|-------------|----------|
| `clerk-api` | Manage users, organizations, invitations via Backend API | "List all users", "Create organization" |
| `nextjs-clerk` | Build Next.js apps with Clerk auth | "Add Clerk to my app", "Protect this route" |

### Production Skills (1-N Development)

| Skill | LLM Score | Description | Use When |
|-------|-----------|-------------|----------|
| `webhook-sync` | 84% | Sync Clerk users to your database | "Sync users to Prisma", "Handle user webhooks" |
| `protect-routes` | 44% | Route protection with permissions | "Protect this route", "Add permission check" |
| `org-rbac` | 57% | Organizations + role-based access | "Add RBAC", "Manage team permissions" |
| `profile-page` | 42% | Server/client hybrid user profiles | "Build profile page", "currentUser vs useUser" |
| `billing-checkout` | 0% | Clerk Billing + subscription management | "Add payments", "Implement checkout flow" |
| `clerk-testing` | N/A | E2E testing with Playwright/Cypress | "Add tests", "Test auth flows" |

> **LLM Score**: Baseline success rate without the skill. Lower = more value from the skill.

## Setup

### 1. Get API Keys

Get your keys from the [Clerk Dashboard](https://dashboard.clerk.com) under **API Keys**.

### 2. Set Environment Variables

```bash
# Required for all skills
export CLERK_SECRET_KEY="sk_test_..."

# Required for Next.js apps
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Optional for webhooks
export CLERK_WEBHOOK_SECRET="whsec_..."
```

## clerk-api Skill

Manage Clerk resources via the Backend API.

### Operations

**Users**
| Operation | Description |
|-----------|-------------|
| `list_users()` | List/search users |
| `get_user(user_id)` | Get user by ID |
| `get_user_count()` | Get total user count |
| `update_user(user_id, ...)` | Update user profile |
| `update_user_metadata(user_id, ...)` | Update metadata |
| `delete_user(user_id)` | Delete user permanently |

**Organizations**
| Operation | Description |
|-----------|-------------|
| `list_organizations()` | List/search organizations |
| `get_organization(org_id)` | Get organization by ID |
| `create_organization(name, ...)` | Create new organization |
| `update_organization(org_id, ...)` | Update organization |
| `delete_organization(org_id)` | Delete organization |
| `list_members(org_id)` | List organization members |
| `add_member(org_id, user_id, role)` | Add member |
| `update_member(org_id, user_id, role)` | Update member role |
| `remove_member(org_id, user_id)` | Remove member |

**Invitations**
| Operation | Description |
|-----------|-------------|
| `list_invitations(org_id)` | List organization invitations |
| `get_invitation(org_id, invitation_id)` | Get invitation by ID |
| `create_invitation(org_id, email, role)` | Invite user |
| `revoke_invitation(org_id, invitation_id)` | Revoke invitation |

## nextjs-clerk Skill

Build Next.js applications with Clerk authentication.

### Features

- Project setup with ClerkProvider
- Route protection middleware (public, protected, org-aware)
- Sign-in/sign-up pages
- Auth components (UserButton, SignInButton, etc.)
- Organization support (B2B/multi-tenant)
- Webhook handlers
- Server actions

### Scripts

| Script | Description |
|--------|-------------|
| `setup.sh` | Bootstrap new Next.js + Clerk project |
| `middleware.sh` | Generate route protection middleware |
| `auth-pages.sh` | Generate sign-in/sign-up pages |
| `components.sh` | Generate common components |
| `webhook.sh` | Generate webhook handlers |

## Repository Structure

```
clerk-skills/
├── .claude-plugin/
│   └── marketplace.json       # Claude Code marketplace
├── plugins/
│   └── clerk/
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── hooks/             # Auto-approve API calls
│       └── skills/
│           ├── clerk-api/     # Backend API management
│           ├── nextjs-clerk/  # Next.js setup & auth
│           ├── webhook-sync/  # Database sync via webhooks
│           ├── protect-routes/# Route protection patterns
│           ├── org-rbac/      # Organizations + RBAC
│           ├── profile-page/  # Server/client profiles
│           ├── billing-checkout/ # Payments & subscriptions
│           └── clerk-testing/ # E2E testing (Playwright/Cypress)
├── install.sh                 # curl installer
├── AGENTS.md                  # Universal agent instructions
├── CLAUDE.md -> AGENTS.md
└── README.md
```

## Security

- Never share your Clerk secret key
- Use test keys (`sk_test_`) in development
- Audit operations in Clerk Dashboard logs
- Consider restricted keys for read-only access

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `CLERK_SECRET_KEY not set` | Export your Clerk secret key |
| `401 Unauthorized` | Secret key is invalid or expired |
| `404 Not Found` | Resource ID is incorrect |
| `422 Validation Error` | Check error details for invalid parameters |

## Links

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Backend API Reference](https://clerk.com/docs/reference/backend-api)
- [AI Skills Documentation](https://clerk.com/docs/ai)

## License

MIT
