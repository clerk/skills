---
name: clerk-setup
description: Add Clerk authentication to web, Expo, or native Swift iOS/macOS projects using the Clerk CLI and official quickstart guidance.
license: MIT
compatibility: JavaScript setup requires Node.js 20.9.0 or higher and framework-appropriate keys; server-side integrations may require a secret key. Native iOS/macOS setup requires an existing Xcode project and a CLI version with native Apple support; never put a secret key in the app.
metadata:
  author: clerk
  version: 2.5.1
---

# Adding Clerk

> **Web SDK versions**: Check `package.json` for the SDK version — see `clerk` skill for the version table. Core 2 differences are noted inline with `> **Core 2 ONLY (skip if current SDK):**` callouts. Native Xcode projects may have no `package.json`.

This skill sets up Clerk for authentication by following the official quickstart documentation. For agents, the `clerk` CLI handles most of this end to end — see the next section.

## Agent-first: Provision via CLI

The `clerk` CLI replaces most Dashboard clicks. The three scenarios below cover web and Expo projects. For an existing native iOS/macOS Xcode project, use the separate native path below; it is not an accountless or dotenv setup.

### Scenario A — New project, new Clerk app

```bash
clerk init --framework <next|react|vue|nuxt|astro|react-router|tanstack-react-start|expressjs|fastify|expo> -y
```

`clerk init` installs the SDK, wires the project up, and writes framework-specific keys where applicable (e.g. `.env.local` for Next.js, `.env` for Vite-based projects). Never place a Clerk secret key in a client-only app.

The one-command path needs a real Clerk application on frameworks without accountless support, including Expo. An unauthenticated agent without a usable application or credentials may receive manual setup guidance rather than a finished integration; an interactive human can complete login and app selection.

#### Getting started without an account

**No login required on an accountless-capable framework.** There, unauthenticated `clerk init` provisions a claimable accountless app and writes temporary development keys to the project's env file — no account, no browser, no flag. Don't run `clerk auth login` first just for that path. Expo and native Apple setup require a real app instead. With usable authentication, init can create and link a real app; `--app` selects an existing one, while `--login` forces the authenticated path.

`--template <b2b-saas|b2c-saas|native|waitlist>` pre-configures the temporary app. Caveats — a signed-out human in an *existing* project still gets the login flow unless they pass `--accountless`; `--keyless` remains a deprecated compatibility alias. `--template`/`--fresh` error on any run that targets a real app; login only auto-claims what `clerk init` created. See [clerk-cli](../clerk-cli/references/auth.md#accountless-operating-without-an-account).

### Scenario B — Existing project, existing Clerk app

```bash
clerk auth login                      # one-time OAuth (skip if already logged in)
clerk link                            # autolinks if a CLERK_PUBLISHABLE_KEY is in your .env
clerk link --app app_xxx              # explicit form, required in agent mode
clerk env pull                        # writes the framework-detected env vars
```

### Scenario C — Existing project, new Clerk app

```bash
clerk auth login
clerk apps create "My App" --json     # returns the new app_id
clerk link --app app_xxx
clerk env pull
```

### Native Apple — Existing iOS or macOS Xcode project

Use this path when a native Swift project contains an `.xcodeproj` or `.xcworkspace` with an iOS/macOS application target. Do not use it for Expo or React Native projects merely because they have generated Xcode files. If another authentication system already exists, assess its migration before changing the app. `clerk init` configures a selected existing target; it does not create an Xcode project. Confirm that `clerk init --help` lists native `--dry-run` and `--target` before relying on this path. If not, the installed CLI lacks native automation; use `clerk-swift` for manual guidance or obtain a native-capable build.

1. From the Xcode project's directory, run `clerk init --dry-run`. This inspects the project and previews local setup without authenticating, changing files, or contacting Clerk. Include `--prebuilt-auth-ui` or `--sign-in-with-apple` in the preview when the developer explicitly requested either option; use the same option on apply. `--app` and `--app-id-prefix` are not dry-run options. If the plan reports ambiguity or an unsupported target, resolve the specific blocker or leave the project unchanged; do not force a guessed target or platform.
2. For a supported project the user asked to configure, run `clerk init` and let its plan handle SDK linkage, direct Swift configuration where safe, and the required native application setup. In non-interactive agent mode, pass `--yes` for native mutations after inspecting the dry run. Supply `--target`, `--app`, or `--app-id-prefix` only when the CLI cannot prove a safe choice; do not guess these values. Native setup needs a real Clerk application and valid credentials, not temporary accountless keys. If browser login is required, hand that interactive step to the developer.
3. Run `clerk doctor --json` after setup, passing the same `--target` when needed, and address its native diagnostics. It is a read-only health check, not a replacement for the init plan or an Xcode build. Build the selected target when Xcode is available and setup changed Swift or project files. Plain init may leave the authentication UI/flow for the developer to choose; if Doctor reports it missing, do not claim end-to-end sign-in is complete. Inspect existing UI and, when the request calls for usable sign-in, implement the chosen flow or ask one focused UI question after the safe setup work.

Do not require the developer to paste a publishable key, run `clerk env pull`, or create a `.env` file for the native app. The CLI can fetch the development publishable key for proven direct wiring; existing custom key loading is preserved and may require the developer to select the linked Clerk app. Prebuilt `AuthView` scaffolding and native Sign in with Apple are separate opt-ins (`--prebuilt-auth-ui` and `--sign-in-with-apple`), not defaults. For custom authentication UI or manual integration, use `clerk-swift` and current Clerk native Apple documentation.

### Web/Expo daily ops

```bash
clerk env pull                        # refresh keys (uses linked profile)
clerk env pull --instance prod        # production keys
clerk doctor --json                   # framework integration health check
```

### Rotate the secret key (replaces Dashboard rotation)

PLAPI exposes secret-key rotation directly. Use raw `clerk api` until the friendly wrapper ships:

```bash
clerk api --platform POST /v1/platform/applications/<app_id>/rotate_secret_keys \
  -d '{"delay_old_secrets_expiration_hours": 24, "reason": "scheduled rotation"}'
```

`delay_old_secrets_expiration_hours` keeps the old key valid for the grace period so deploys can roll forward without downtime.

### Notes for agents

- Unclaimed accountless apps created by `clerk init` are configurable without an account — see the [accountless command table](../clerk-cli/references/auth.md#accountless-operating-without-an-account) for which commands work and which need a claimed app.
- `clerk link` (no flags) only autolinks when a `CLERK_PUBLISHABLE_KEY` is already in `.env` / `.env.local`. Without it, agent mode errors out: "Cannot select an application in agent mode." When that happens, run `clerk apps list --json`, and ask the user which `app_id` to link rather than guessing.
- Pass `--json` on `apps list/create`, `users create`, and `doctor` for parseable output.
- The CLI auto-detects framework env var names (`VITE_CLERK_PUBLISHABLE_KEY` for Vite, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` for Next.js, etc.) and target file (`.env.development.local` > `.env.local` > `.env`).
- The accountless and env-file guidance in the web/Expo scenarios does not apply to native iOS/macOS Xcode targets. Follow the native path above instead.

## Quick Reference (Web/Expo Dashboard fallback)

If the CLI isn't an option for a web or Expo project (sandboxed environments, docs walkthroughs), here's the manual Dashboard path. For a native Swift project without a native-capable CLI, use `clerk-swift` and the native quickstart instead.

| Step | Action |
|------|--------|
| 1. Detect framework | Check `package.json` dependencies |
| 2. Fetch quickstart | Use WebFetch on the appropriate docs URL |
| 3. Follow instructions | Execute steps; create `proxy.ts` (Next.js <=15: `middleware.ts`) |
| 4. Get API keys | From [dashboard.clerk.com](https://dashboard.clerk.com/~/api-keys) |

> If the project has `components.json` (shadcn/ui), apply the shadcn theme after setup. See `clerk-custom-ui` skill → shadcn Theme.

## Framework Detection

First distinguish Expo/React Native from a native Swift app. For a native app with an existing `.xcodeproj` or `.xcworkspace`, let the CLI inspect its application targets. For web/Expo projects, check `package.json` to identify the framework:

| Dependency | Framework | Quickstart URL |
|------------|-----------|----------------|
| `next` | Next.js | `https://clerk.com/docs/nextjs/getting-started/quickstart` |
| `@remix-run/react` | Remix (deprecated) | Migrate to React Router v7 — use the React Router quickstart below |
| `react-router` | React Router (v7+) | `https://clerk.com/docs/react-router/getting-started/quickstart` |
| `astro` | Astro | `https://clerk.com/docs/astro/getting-started/quickstart` |
| `nuxt` | Nuxt | `https://clerk.com/docs/nuxt/getting-started/quickstart` |
| `@tanstack/react-start` | TanStack Start | `https://clerk.com/docs/tanstack-react-start/getting-started/quickstart` |
| `react` (no framework) | React SPA | `https://clerk.com/docs/react/getting-started/quickstart` |
| `vue` | Vue | `https://clerk.com/docs/vue/getting-started/quickstart` |
| `express` | Express | `https://clerk.com/docs/expressjs/getting-started/quickstart` |
| `fastify` | Fastify | `https://clerk.com/docs/fastify/getting-started/quickstart` |
| `expo` | Expo | `https://clerk.com/docs/expo/getting-started/quickstart` |

For other platforms:
- **Chrome Extension**: `https://clerk.com/docs/chrome-extension/getting-started/quickstart`
- **Android**: `https://clerk.com/docs/android/getting-started/quickstart`
- **iOS**: `https://clerk.com/docs/ios/getting-started/quickstart`
- **Vanilla JavaScript**: `https://clerk.com/docs/js-frontend/getting-started/quickstart`

## Decision Tree

```
User Request: "Add Clerk" / "Add authentication"
    │
    ├─ Native Swift iOS/macOS Xcode project (not Expo/React Native)?
    │   └─ Native Apple path above
    │       └─ Inspect with clerk init --dry-run → supported plan? → init → doctor
    │
    ├─ Otherwise read package.json
    │
    ├─ Existing auth detected?
    │   ├─ YES → Audit → Migration plan
    │   └─ NO → Fresh install
    │
    ├─ Identify framework → WebFetch quickstart → Follow instructions
    │   └─ Next.js? → Create proxy.ts (Next.js <=15: middleware.ts)
    │
    └─ components.json exists? → YES → Apply shadcn theme (see clerk-custom-ui)
```

## Setup Process

The remaining numbered process is for web/Expo projects. Native Swift Xcode apps follow the Native Apple path above and should not continue into web env-file or middleware steps.

### 1. Detect the Framework

For a native Apple Xcode project, use the native path above. Otherwise read the project's `package.json` and match dependencies to the table above.

### 2. Fetch the Quickstart Guide

Use WebFetch to retrieve the official quickstart for the detected framework:

```
WebFetch: https://clerk.com/docs/{framework}/getting-started/quickstart
Prompt: "Extract the complete setup instructions including all code snippets, file paths, and configuration steps."
```

### 3. Follow the Instructions

Execute each step from the quickstart guide:
- Install the required packages
- Set up environment variables
- Add the provider and proxy/middleware
- Create sign-in/sign-up routes if needed
- Test the integration

> **Next.js:** Create `proxy.ts` (Next.js <=15: `middleware.ts`). See the `clerk-nextjs-patterns` skill for middleware strategies.

> **shadcn/ui detected** (`components.json` exists): ALWAYS apply the shadcn theme. See `clerk-custom-ui` skill → shadcn Theme section.

### 4. Get API Keys

For web/Expo development, choose the key path supported by the framework. Native iOS/macOS uses the publishable key through the native init flow; do not put a Clerk secret key in app code or require an env pull.

**CLI (Automatic on accountless-capable frameworks)**
- `clerk init` can write temporary development keys to the project's env file without a Clerk account. Expo and other non-accountless frameworks instead need a real Clerk application and usable credentials.
- When you're ready, run `clerk auth login` and the app is claimed into your Clerk account automatically so you can edit it from the Dashboard
- Simplest path for new projects

**Manual (Dashboard)**
- Get keys from [dashboard.clerk.com](https://dashboard.clerk.com/~/api-keys)
- **Publishable Key**: Starts with `pk_test_` or `pk_live_`
- **Secret Key**: Starts with `sk_test_` or `sk_live_`
- Set as environment variables: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`

## Migrating from Another Auth Provider

If the project already has authentication, create a migration plan before replacing it.

### Detect Existing Auth

Check `package.json` for existing auth libraries:
- `next-auth` / `@auth/core` → NextAuth/Auth.js
- `@supabase/supabase-js` → Supabase Auth
- `firebase` / `firebase-admin` → Firebase Auth
- `@aws-amplify/auth` → AWS Cognito
- `auth0` / `@auth0/nextjs-auth0` → Auth0
- `passport` → Passport.js
- Custom JWT/session implementation

### Migration Process

1. **Audit current auth** - Identify all auth touchpoints:
   - Sign-in/sign-up pages
   - Session/token handling
   - Protected routes and middleware
   - User data storage (database tables, external IDs)
   - OAuth providers configured

2. **Create migration plan** - Consider:
   - **User data export** - Export users and import via Clerk's Backend API
   - **Password hashes** - Clerk can upgrade hashes to Bcrypt transparently
   - **External IDs** - Store legacy user IDs as `external_id` in Clerk
   - **Session handling** - Existing sessions will terminate on switch

3. **Choose migration strategy**:
   - **Big bang** - Switch all users at once (simpler, requires maintenance window)
   - **Trickle migration** - Run both systems temporarily (lower risk, higher complexity)

### Migration Reference

- **Migration Overview**: https://clerk.com/docs/guides/development/migrating/overview

## SDK Notes

### Package Names

| Package | Install |
|---------|---------|
| Next.js | `@clerk/nextjs` |
| React | `@clerk/react` |
| Expo | `@clerk/expo` |
| React Router | `@clerk/react-router` |
| TanStack Start | `@clerk/tanstack-react-start` |

> **Core 2 ONLY (skip if current SDK):** React and Expo packages have different names: `@clerk/clerk-react` and `@clerk/clerk-expo` (with `clerk-` prefix).

### ClerkProvider Placement (Next.js)

`ClerkProvider` must be placed **inside `<body>`**, not wrapping `<html>`:

```tsx
// root layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}
```

> **Core 2 ONLY (skip if current SDK):** `ClerkProvider` can wrap `<html>` directly.

### Dynamic Rendering (Next.js)

For dynamic rendering with auth data, use the `dynamic` prop:

```tsx
<ClerkProvider dynamic>{children}</ClerkProvider>
```

### Node.js Requirement

Requires **Node.js 20.9.0** or higher.

> **Core 2 ONLY (skip if current SDK):** Minimum Node.js 18.17.0.

### Themes Package

Themes are installed from `@clerk/ui`:

```bash
npm install @clerk/ui
```

> **Core 2 ONLY (skip if current SDK):** Themes are from `@clerk/themes` instead of `@clerk/ui`.

### shadcn Theme

If the project uses shadcn/ui (check for `components.json` in the project root), apply the shadcn theme so Clerk components match the app's design system:

```bash
npm install @clerk/ui
```

```tsx
import { shadcn } from '@clerk/ui/themes'

<ClerkProvider appearance={{ theme: shadcn }}>{children}</ClerkProvider>
```

Also import the shadcn CSS in your global styles:
```css
@import 'tailwindcss';
@import '@clerk/ui/themes/shadcn.css';
```

> **Core 2 ONLY (skip if current SDK):** Import from `@clerk/themes` and `@clerk/themes/shadcn.css` instead.

## Common Pitfalls

> **For web projects, run `clerk doctor` to diagnose setup.** For native Xcode projects, inspect with `clerk init --dry-run` first and run Doctor after setup. Doctor reports problems; it does not silently fix them.

| Issue | Solution |
|-------|----------|
| Missing `await` on `auth()` | In Next.js 15+, `auth()` is async: `const { userId } = await auth()` |
| Exposing `CLERK_SECRET_KEY` | Never use the secret key in client code; only `NEXT_PUBLIC_*` keys are safe |
| Missing middleware matcher | Include API routes: `matcher: ['/((?!.*\\..*|_next).*)', '/']` |
| ClerkProvider placement | Must be inside `<body>` in root layout (Core 2: could wrap `<html>`) |
| Auth routes not public | Allow `/sign-in`, `/sign-up` in middleware config |
| Landing page requires auth | To keep "/" public, exclude it: `matcher: ['/((?!.*\\..*|_next|^/$).*)', '/api/(.*)']` |
| Wrong import path | Server code uses `@clerk/nextjs/server`, client uses `@clerk/nextjs` |
| Wrong package name | Use `@clerk/react` not `@clerk/clerk-react` (Core 2 naming) |

## See Also

- `clerk-custom-ui` - Custom sign-in/up components
- `clerk-nextjs-patterns` - Advanced Next.js patterns
- `clerk-react-patterns` - React SPA patterns
- `clerk-react-router-patterns` - React Router patterns
- `clerk-vue-patterns` - Vue patterns
- `clerk-nuxt-patterns` - Nuxt patterns
- `clerk-astro-patterns` - Astro patterns
- `clerk-tanstack-patterns` - TanStack Start patterns
- `clerk-chrome-extension-patterns` - Chrome Extension patterns
- `clerk-orgs` - B2B multi-tenant organizations
- `clerk-webhooks` - Webhook → database sync
- `clerk-testing` - E2E testing setup
- `clerk-swift` - Native iOS/macOS auth UI and manual integration guidance
- `clerk-android` - Native Android auth
- `clerk-expo` - Expo / React Native auth
- `clerk-backend-api` - Backend REST API explorer

## Documentation

- **Quickstart Overview**: https://clerk.com/docs/getting-started/quickstart/overview
- **Migration Guide**: https://clerk.com/docs/guides/development/migrating/overview
- **Full Documentation**: https://clerk.com/docs
