<p align="center">
  <a href="https://clerk.com?utm_source=github&utm_medium=clerk_skills" target="_blank" rel="noopener noreferrer">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset=".github/dark.webp">
      <source media="(prefers-color-scheme: light)" srcset=".github/light.webp">
      <img src=".github/light.webp" alt="Clerk Skills" width="600">
    </picture>
  </a>
</p>
<div align="center">
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
npx skills add clerk/skills
```

### Via Clerk CLI

```bash
clerk init  # auto-installs skills for your framework
```

### Manual (Claude Code)

```bash
git clone https://github.com/clerk/skills ~/.claude/skills/clerk
```

## Skills

### Core

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `/clerk` | **Router** - Routes to the right skill | Always start here |
| `clerk-setup` | Add Clerk to any framework | New projects, framework setup |
| `clerk-custom-ui` | Custom sign-in/up and appearance | Building custom forms, styling |
| `clerk-backend-api` | Backend REST API explorer | Browsing or calling API endpoints |

### Framework Patterns

| Skill | Framework | Patterns |
|-------|-----------|----------|
| `clerk-nextjs-patterns` | Next.js | Middleware, Server Actions, caching |
| `clerk-react-patterns` | React | Hooks, auth guards, protected routes |
| `clerk-react-router-patterns` | React Router | Loaders, actions, route protection |
| `clerk-vue-patterns` | Vue | Composables, Pinia integration |
| `clerk-nuxt-patterns` | Nuxt | Server middleware, SSR auth |
| `clerk-astro-patterns` | Astro | SSR auth, island components |
| `clerk-tanstack-patterns` | TanStack Start | Server functions, route protection |
| `clerk-expo-patterns` | Expo | Secure storage, deep linking |
| `clerk-chrome-extension-patterns` | Chrome Extension | Background scripts, popup auth |

### Features

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `clerk-orgs` | Multi-tenant B2B organizations | Team workspaces, RBAC |
| `clerk-webhooks` | Real-time events and data syncing | Database sync, notifications |
| `clerk-testing` | E2E testing for auth flows | Playwright/Cypress tests |

### Native Mobile

| Skill | Platform | Patterns |
|-------|----------|----------|
| `clerk-swift` | iOS | ClerkKit, SwiftUI, Apple Sign-In |
| `clerk-android` | Android | Kotlin, Jetpack Compose |

## Quick Start

### 1. Set Up API Keys

Get your keys from the [Clerk Dashboard](https://dashboard.clerk.com/) and add them to `.env`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### 2. Ask Your Agent

| You Say | Skill Used |
|---------|------------|
| "Add Clerk auth to my Next.js app" | `clerk-setup` |
| "Use Server Actions with Clerk" | `clerk-nextjs-patterns` |
| "Add Clerk to my Vue app" | `clerk-vue-patterns` |
| "Build custom sign-in form" | `clerk-custom-ui` |
| "Sync users to Prisma via webhooks" | `clerk-webhooks` |
| "Add Playwright tests for auth" | `clerk-testing` |
| "Set up organizations for my B2B app" | `clerk-orgs` |
| "Add Clerk auth to my iOS app" | `clerk-swift` |

## Repository Structure

```
clerk-skills/
├── .claude-plugin/
│   └── marketplace.json
├── skills/
│   ├── core/
│   │   ├── clerk/                  # Router skill
│   │   ├── setup/                  # Framework setup
│   │   ├── custom-ui/              # Component customization
│   │   └── backend-api/            # REST API explorer
│   ├── frameworks/
│   │   ├── nextjs-patterns/
│   │   ├── react-patterns/
│   │   ├── react-router-patterns/
│   │   ├── vue-patterns/
│   │   ├── nuxt-patterns/
│   │   ├── astro-patterns/
│   │   ├── tanstack-patterns/
│   │   ├── expo-patterns/
│   │   └── chrome-extension-patterns/
│   ├── features/
│   │   ├── orgs/
│   │   ├── webhooks/
│   │   └── testing/
│   └── mobile/
│       ├── swift/
│       └── android/
├── commands/
│   └── clerk.md
└── README.md
```

## Using /clerk Command

For agents that support slash commands (Claude Code, OpenCode):

```
/clerk add auth to my Express app
/clerk sync users to Supabase
/clerk fix "redirect_uri_mismatch" error

/clerk-backend-api tags
/clerk-backend-api GET /users
```

## Resources

- [Clerk Docs](https://clerk.com/docs)
- [Dashboard](https://dashboard.clerk.com)
- [Discord](https://clerk.com/discord)

## Request a Skill

Don't see what you need? [Request a skill](https://github.com/clerk/skills/issues/new?template=skill-request.md).

## License

MIT
