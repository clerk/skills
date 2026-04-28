<p align="center">
  <a href="https://clerk.com?utm_source=github&utm_medium=clerk_skills" target="_blank" rel="noopener noreferrer">
    <img src="./assets/logo-pixel.svg" height="84">
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
npx skills add clerk/skills
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
| `clerk-billing` | Subscription billing and feature gating | Pricing tables, plans, per-seat, entitlements |
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
| "Add Clerk to my Nuxt app" | `clerk-nuxt-patterns` |
| "Add auth to my Expo app" | `clerk-expo-patterns` |
| "Add Clerk to my Astro site" | `clerk-astro-patterns` |
| "Build custom sign-in form" | `clerk-custom-ui` |
| "Sync users to Prisma via webhooks" | `clerk-webhooks` |
| "Add Playwright tests for auth" | `clerk-testing` |
| "Set up organizations for my B2B app" | `clerk-orgs` |
| "Add subscription billing with pricing table" | `clerk-billing` |
| "Gate features by plan" | `clerk-billing` |
| "Add Clerk auth to my iOS app" | `clerk-swift` |
| "Add Clerk auth to my Android app" | `clerk-android` |

## Repository Structure

```
clerk-skills/
├── .claude-plugin/
│   └── marketplace.json
├── skills/
│   ├── core/
│   │   ├── clerk/                  # Router skill
│   │   ├── clerk-setup/            # Framework setup
│   │   ├── clerk-custom-ui/        # Component customization
│   │   └── clerk-backend-api/      # REST API explorer
│   ├── frameworks/
│   │   ├── clerk-nextjs-patterns/
│   │   ├── clerk-react-patterns/
│   │   ├── clerk-react-router-patterns/
│   │   ├── clerk-vue-patterns/
│   │   ├── clerk-nuxt-patterns/
│   │   ├── clerk-astro-patterns/
│   │   ├── clerk-tanstack-patterns/
│   │   ├── clerk-expo-patterns/
│   │   └── clerk-chrome-extension-patterns/
│   ├── features/
│   │   ├── clerk-orgs/
│   │   ├── clerk-billing/
│   │   ├── clerk-webhooks/
│   │   └── clerk-testing/
│   └── mobile/
│       ├── clerk-swift/
│       └── clerk-android/
└── README.md
```

## Resources

- [Clerk Docs](https://clerk.com/docs)
- [Dashboard](https://dashboard.clerk.com)
- [Discord](https://clerk.com/discord)

## Request a Skill

Don't see what you need? [Request a skill](https://github.com/clerk/skills/issues/new?template=skill-request.md).

## License

MIT
