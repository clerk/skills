---
name: clerk-setup
description: Set up Clerk authentication in new or existing applications, maintain existing Core 2 integrations, and plan upgrades to the current Clerk SDK generation.
license: MIT
allowed-tools: Bash, Read, Edit, WebFetch
compatibility: Current Clerk SDKs require Node.js 20.9.0 or higher. Core 2 supports Node.js 18.17.0 or higher and uses different React, Expo, component, provider, and theme APIs.
metadata:
  author: clerk
  version: 3.0.0
---

# Add or Upgrade Clerk Authentication

Check `package.json` before changing authentication. Use the `clerk` skill's version table to determine whether the project uses Core 2 or the current SDK generation.

## Route the task

- **No Clerk integration:** Read [references/setup.md](references/setup.md) and follow it as the source of truth for setup.
- **Existing current-generation Clerk integration:** Preserve the installed generation. Diagnose or extend it with the relevant framework and feature skills instead of rerunning setup blindly.
- **Existing Core 2 integration:** Preserve Core 2 behavior and apply the compatibility guidance below. Do not replace packages or APIs with current-generation equivalents unless the user asks to upgrade.
- **Core 2 upgrade request:** Inspect the complete integration and propose an upgrade plan before changing it. Wait for approval before removing or replacing working authentication code.
- **Another authentication system:** Follow the migration safeguards in the generated setup reference. Do not remove the existing provider until the user approves the migration plan.

Never read or print environment files. Ask the user for any missing non-sensitive configuration.

## Canonical setup flow

For new setup, `init`, accountless development, app linking, manual quickstart fallback, visible auth controls, verification, and production claiming, read and follow [references/setup.md](references/setup.md).

That reference is generated from `clerk/clerk`'s `clerk-docs/prompts/cli-setup.md`. It owns the shared setup flow. This wrapper owns version detection, existing-Clerk routing, Core 2 compatibility, and upgrade safety.

## Existing Core 2 applications

The generated setup reference targets current SDKs. When maintaining a Core 2 application, keep its existing package generation and apply these differences:

| Area | Current SDK | Core 2 |
| --- | --- | --- |
| React package | `@clerk/react` | `@clerk/clerk-react` |
| Expo package | `@clerk/expo` | `@clerk/clerk-expo` |
| Signed-in/out controls | `<Show>` | `<SignedIn>` and `<SignedOut>` |
| Authorization control | `<Show>` | `<Protect>` |
| Next.js provider | Place `<ClerkProvider>` inside `<body>` | It can wrap `<html>` |
| Minimum Node.js | 20.9.0 | 18.17.0 |
| Themes package | `@clerk/ui` | `@clerk/themes` |
| shadcn theme CSS | `@clerk/ui/themes/shadcn.css` | `@clerk/themes/shadcn.css` |

Use Core 2 callouts in the framework and feature skills whenever they exist. For custom sign-in or sign-up flows, use the Core 2 references in `clerk-custom-ui`.

## Planning a Core 2 upgrade

Before proposing changes:

1. Inventory Clerk packages and versions, provider placement, middleware, auth routes, custom flows, themes, and authorization components.
2. Identify every Core 2-only package or API from the compatibility table and the relevant framework skills.
3. Separate required migration work from optional cleanup.
4. Explain session, routing, and deployment risks and propose a verification and rollback plan.
5. Ask the user to approve the plan before changing dependencies or authentication behavior.

Do not treat a setup request as implicit permission to upgrade an existing Clerk integration.

## Shared safety rules

- Never expose `CLERK_SECRET_KEY` in client code.
- In Next.js 15 and later, always `await auth()`.
- Name the middleware file for the installed Next.js version: `proxy.ts` on Next.js 16 and later, `middleware.ts` on Next.js 15 and earlier.
- If `components.json` exists, apply the generation-appropriate shadcn theme package and CSS from the compatibility table.
- Run `npx -y clerk@latest doctor` after setup or an upgrade, then start the application and test signed-out, sign-up, sign-in, and signed-in behavior.

## Related skills

- `clerk-cli` — CLI operation, authentication, app targeting, and accountless behavior
- `clerk-custom-ui` — current and Core 2 custom authentication flows and themes
- `clerk-nextjs-patterns` — Next.js middleware, server/client, and Core 2 differences
- Framework skills — framework-specific providers, routes, and integration patterns
- `clerk-orgs` — Organizations, roles, permissions, and Core 2 differences
