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
  <a href="https://clerk.com/discord">
    <img alt="Discord" src="https://img.shields.io/discord/856971667393609759?color=7389D8&label&logo=discord&logoColor=ffffff" />
  </a>
  <a href="https://x.com/clerk">
    <img alt="Follow on X" src="https://img.shields.io/twitter/url.svg?label=%40clerk&style=social&url=https%3A%2F%2Fx.com%2Fclerk" />
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

The `clerk` plugin bundles every skill plus the [Clerk MCP server](https://mcp.clerk.com/mcp). `npx skills` installs the skills alone, into any agent.

### Agent Skills

```bash
npx skills add clerk/skills
```

### Claude Code

```bash
/plugin marketplace add clerk/skills
/plugin install clerk@clerk-skills
```

To get updates automatically, open `/plugin`, go to **Marketplaces**, select `clerk-skills`, and enable auto-update.

### Codex

```bash
codex plugin marketplace add clerk/skills
codex plugin add clerk@clerk
```

`clerk` replaces the earlier `clerk-skills@clerk` plugin, which no longer updates. To switch, run `codex plugin remove clerk-skills@clerk`, then add `clerk@clerk`.

### Cursor

```bash
cursor-agent plugin marketplace add https://github.com/clerk/skills
```

Then install `clerk` from `/plugin`, or from **Customize** in the editor.

### GitHub Copilot CLI

```bash
copilot plugin marketplace add clerk/skills
copilot plugin install clerk@clerk-skills
```

## Skills

### Core

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| `/clerk` | **Router** - Routes to the right skill | Always start here |
| `clerk-cli` | Clerk CLI operations | Users, orgs, apps, env keys, deploy checks |
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
| `clerk-expo` | Expo / React Native | Native components, custom flows, SMS OTP, OAuth |

## Quick Start

### 1. Ask Your Agent to Add Clerk

After installing Clerk Skills, ask your coding agent to add Clerk authentication
to your app. The [`clerk-setup`](skills/clerk-setup/SKILL.md#agent-first-provision-via-cli)
skill covers three paths: a new project and Clerk app, an existing project and
Clerk app, or a new Clerk app for an existing project.

For a new project on a supported framework, `clerk init` can start without a
Clerk account or browser login. See [Scenario A: Getting started without an account](skills/clerk-setup/SKILL.md#getting-started-without-an-account)
for how temporary keys and later account claiming work.

### 2. Example Requests

| You Say | Skill Used |
|---------|------------|
| "List Clerk users" | `clerk-cli` |
| "Add Clerk auth to my Next.js app" | `clerk-setup` |
| "Use Server Actions with Clerk" | `clerk-nextjs-patterns` |
| "Add Clerk to my Vue app" | `clerk-vue-patterns` |
| "Add Clerk to my Nuxt app" | `clerk-nuxt-patterns` |
| "Add auth to my Expo app" | `clerk-expo` |
| "Add phone SMS auth to my Expo app" | `clerk-expo` |
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
clerk-skills/                           # the repo root is the plugin root
├── skills/                             # one folder per skill, flat
│   ├── clerk/                          # Router skill
│   ├── clerk-setup/
│   ├── clerk-nextjs-patterns/
│   └── ...
├── plugin.json                         # Agent Plugins 1.0.0 manifest
├── mcp.json                            # Agent Plugins MCP config
├── .mcp.json                           # Claude Code and older Codex MCP config
├── .claude-plugin/                     # plugin.json + marketplace.json
├── .cursor-plugin/                     # plugin.json + marketplace.json
├── .codex-plugin/plugin.json
├── .agents/plugins/marketplace.json    # Codex marketplace
├── scripts/check.py                    # keeps the manifests consistent
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
