---
name: clerk-setup
description: Set up Clerk authentication in any project with the Clerk MCP server and official framework quickstarts. Use when adding Clerk, initializing Clerk, scaffolding a new app with Clerk, or migrating an existing authentication system to Clerk.
license: MIT
allowed-tools: WebFetch
compatibility: Requires Node.js 20.9.0 or later for current Clerk SDKs. The Clerk MCP server requires a Clerk account.
metadata:
  author: clerk
  version: 3.0.0
---

# Set up Clerk

Use the [Clerk MCP server](https://mcp.clerk.com/mcp) for anything in the user's Clerk account, such as creating an application, getting its keys, changing settings, or going to production. If it isn't connected, have the user add it.

## Existing projects

If the project uses another auth provider, get the user's approval before changing or removing it, and plan the move with the [migration guide](https://clerk.com/docs/guides/development/migrating/overview).

If the project already uses Clerk, keep its Clerk application and SDK version, and add only what's missing.

## Add Clerk

Follow the quickstart for the project's framework. In an empty directory, ask which framework to use, defaulting to Next.js.

- [Next.js](https://clerk.com/docs/nextjs/getting-started/quickstart.md?manual=1)
- [React](https://clerk.com/docs/react/getting-started/quickstart.md?manual=1)
- [React Router](https://clerk.com/docs/react-router/getting-started/quickstart.md?manual=1)
- [Nuxt](https://clerk.com/docs/nuxt/getting-started/quickstart.md?manual=1)
- [TanStack Start](https://clerk.com/docs/tanstack-react-start/getting-started/quickstart.md?manual=1)
- [Astro](https://clerk.com/docs/astro/getting-started/quickstart.md?manual=1)
- [Vue](https://clerk.com/docs/vue/getting-started/quickstart.md?manual=1)
- [JavaScript or Vite](https://clerk.com/docs/js-frontend/getting-started/quickstart.md?manual=1)
- [Expo](https://clerk.com/docs/expo/getting-started/quickstart.md?manual=1)
- [Express](https://clerk.com/docs/expressjs/getting-started/quickstart.md?manual=1)
- [Fastify](https://clerk.com/docs/fastify/getting-started/quickstart.md?manual=1)
- [iOS](https://clerk.com/docs/ios/getting-started/quickstart.md?manual=1)
- [Android](https://clerk.com/docs/android/getting-started/quickstart.md?manual=1)
- [Chrome extension](https://clerk.com/docs/chrome-extension/getting-started/quickstart.md?manual=1)

For anything else, use [Clerk's llms.txt](https://clerk.com/llms.txt).

In a web app, add sign-in, sign-up, and user controls to the existing layout or navigation. Then start the app and check that they render.

Never expose `CLERK_SECRET_KEY` in client code, and don't read or print existing environment files.

## After setup

Have the user sign up as the first user. Then ask how people should sign in (email, phone, username, or social providers), and offer [Organizations](https://clerk.com/docs/guides/organizations/overview) for teams.
