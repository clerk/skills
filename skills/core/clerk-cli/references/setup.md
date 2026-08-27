<!-- Generated from clerk/clerk@main:clerk-docs/prompts/cli-setup.md. Do not edit by hand. -->

# Add Clerk Authentication

Set up Clerk authentication with the Clerk CLI. When the framework supports it, `npx clerk@latest init` defaults to auto-generated temporary development keys that a later `npx clerk@latest auth login` claims automatically.

## Before you start

Show the user this checklist and wait for a yes:

```
Here's what I'll do to get you set up with Clerk.

1. Set up Clerk in this project, or scaffold a new app if this directory is empty
2. Start your app with Clerk installed.

Shall I proceed?
```

## Existing authentication

Before running init, inspect the project's dependencies and auth-related routes, middleware, session handling, and user records. If another authentication system is already present, do not replace it as a fresh setup. Propose a migration plan first that covers:

- User export and import through Clerk's Backend API, including stable external IDs
- Password-hash compatibility and OAuth provider continuity
- Protected routes, session/token handling, and the fact that existing sessions may terminate at cutover
- A big-bang or gradual migration strategy appropriate to the application's risk and user count

Migration guide: https://clerk.com/docs/guides/development/migrating/overview

## Step 1a: Existing project

From the project root:

```bash
npx clerk@latest init
```

`init` detects the framework and package manager, installs the SDK, and applies framework setup — provider, middleware, auth routes, env. Do not pass `--framework` or `--pm` unless the user wants to override detection. Do not list apps or ask which Clerk app to use.

## Step 1b: Empty directory

Ask which framework and package manager to use, defaulting to Next.js and npm:

```bash
npx clerk@latest init --framework <framework> --pm <package-manager>
```

If a lockfile is present, let it pick the package manager: `pnpm-lock.yaml` -> `pnpm`, `yarn.lock` -> `yarn`, `bun.lock` or `bun.lockb` -> `bun`, `package-lock.json` -> `npm`.

## Step 1c: Development keys

If the framework supports temporary development keys, `init` writes them to the project's env file, so the user needs no Clerk account. The CLI prints a confirmation naming the env file it wrote, followed by:

```
When you're ready, run clerk auth login and your app will be claimed automatically.
```

Relay that, using the filename the CLI printed: the app stays unclaimed until the user runs `npx clerk@latest auth login`. Do not run it for them unless they ask to claim now.

Frameworks without development-key support need real API keys. There `init` applies what setup it can and prints the remaining steps.

To link an existing Clerk application, add `--app <application_id>` — but only when the user supplies the ID. If they want to link and have no ID, run `npx clerk@latest apps list --json`, show the names and IDs, and ask. Never choose an application for them.

## Step 2: Fall back to docs when init is incomplete

If `init` reports the framework is unsupported or undetected, follow the quickstart instead.

`init` scaffolds Next.js (App and Pages Router), React, React Router, Nuxt, TanStack Start, Astro, Vue, JavaScript/Vite, Expo, Express, Fastify, iOS, and Android.

| Framework               | Quickstart                                                                |
| ----------------------- | ------------------------------------------------------------------------- |
| `next`                  | https://clerk.com/docs/nextjs/getting-started/quickstart.md               |
| `astro`                 | https://clerk.com/docs/astro/getting-started/quickstart.md                |
| `nuxt`                  | https://clerk.com/docs/nuxt/getting-started/quickstart.md                 |
| `react-router`          | https://clerk.com/docs/react-router/getting-started/quickstart.md         |
| `@tanstack/react-start` | https://clerk.com/docs/tanstack-react-start/getting-started/quickstart.md |
| `react`                 | https://clerk.com/docs/react/getting-started/quickstart.md                |
| `vue`                   | https://clerk.com/docs/vue/getting-started/quickstart.md                  |
| `vite` or vanilla JS    | https://clerk.com/docs/js-frontend/getting-started/quickstart.md          |
| `express`               | https://clerk.com/docs/expressjs/getting-started/quickstart.md            |
| `fastify`               | https://clerk.com/docs/fastify/getting-started/quickstart.md              |
| `expo`                  | https://clerk.com/docs/expo/getting-started/quickstart.md                 |
| iOS (Swift)             | https://clerk.com/docs/ios/getting-started/quickstart.md                  |
| Android (Kotlin)        | https://clerk.com/docs/android/getting-started/quickstart.md              |
| Chrome Extension        | https://clerk.com/docs/chrome-extension/getting-started/quickstart.md     |

Everything else: https://clerk.com/docs/llms.txt

## Step 3: Add visible auth controls

The app needs sign-in, sign-up, and signed-in user controls, worked into the existing layout or navigation. If they already exist, adapt them instead of duplicating.

For Next.js App Router:

```text
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs'

<>
  <Show when="signed-out">
    <SignInButton />
    <SignUpButton />
  </Show>
  <Show when="signed-in">
    <UserButton />
  </Show>
</>
```

Other frameworks use the same component names from their own Clerk package — `@clerk/vue`, `@clerk/react`, `@clerk/nuxt`, and so on.

## Step 4: Verify

```bash
npx clerk@latest doctor
```

Then start the app, confirm the auth controls render, and fix anything the CLI reports.

## Step 5: If using shadcn/ui

If `components.json` exists in the project root, add `@clerk/ui` with the package manager from Step 1 — `npm install`, `pnpm add`, `yarn add`, or `bun add`.

Apply the theme in your provider:

```text
import { shadcn } from '@clerk/ui/themes'

<ClerkProvider appearance={{ theme: shadcn }}>{children}</ClerkProvider>
```

Add to global CSS:

```css
@import '@clerk/ui/themes/shadcn.css';
```

## Critical rules

- Next.js 15+: `auth()` is async. Always `await auth()`
- `ClerkProvider` goes inside `<body>`, not wrapping `<html>`
- Never expose `CLERK_SECRET_KEY` in client code
- Use `@clerk/nextjs`, not `@clerk/clerk-react`
- Do not read or print existing environment variable files; ask the user for any missing non-sensitive configuration

Docs: https://clerk.com/docs/cli https://clerk.com/docs/llms.txt

## After Setup

Have the user sign up as their first test user. Congratulate them once the profile icon appears in the nav.

Then offer Organizations — multi-tenancy, team invitations, roles and permissions, and enterprise SSO.

If yes:

1. Run `npx clerk@latest enable orgs`.
2. Add `<OrganizationSwitcher />` next to the existing `<UserButton />`, or the framework equivalent.
3. Have them create an organization from the switcher and invite a teammate.

If no, point them to Organizations (https://clerk.com/docs/guides/organizations/overview), Components (https://clerk.com/docs/reference/components/overview), and the Dashboard (https://dashboard.clerk.com/).
