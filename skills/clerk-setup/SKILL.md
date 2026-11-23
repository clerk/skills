---
name: clerk-setup
description: Set up Clerk authentication in any project with the Clerk plugin, the Clerk MCP server, and official framework quickstarts. Use when adding Clerk, initializing Clerk, scaffolding a new app with Clerk, or migrating an existing authentication system to Clerk.
license: MIT
allowed-tools: WebFetch
compatibility: Requires Node.js 20.9.0 or later for current Clerk SDKs. The Clerk MCP server requires a Clerk account.
metadata:
  author: clerk
  version: 3.0.0
---

# Set up Clerk

Check for the Clerk plugin first. It bundles Clerk's skills and the [Clerk MCP server](https://mcp.clerk.com/mcp). Use the MCP server for anything in the user's Clerk account, such as creating an application, getting its keys, changing settings, or going to production.

## Before you start

Show the user this checklist and wait for a yes:

```
Here's what I'll do to get you set up with Clerk.

1. Add Clerk's agent skills and MCP server for the coding agents on this machine, through the Clerk plugin where possible, if they aren't installed yet.
2. Set up Clerk in this project, or scaffold a new app if this directory is empty.
3. Start your app with Clerk installed.

Shall I proceed?
```

## Install the Clerk plugin

Check this agent's installed plugins, or ask the user to check. Loading this skill from the plugin proves installation; a URL or generated copy does not. MCP tools are not proof: a separate server may provide them, and sign-out can hide plugin tools. If the Clerk plugin is installed in this agent, skip installation. If the MCP server needs sign-in, guide authentication in the agent's MCP settings (Claude Code: `/mcp` → **Authenticate**).

Only if the plugin is absent and the user agreed to install it, show Clerk's native plugin or connector card when this agent has a suggestion tool. Pass Clerk's ID directly; a name search can miss it:

- **ChatGPT and Codex:** `plugin_asdk_app_6ae4e34683b08191933207035aa0d3ac`
- **Claude:** connector `48a3eb31-a881-4d52-b179-1af31624356a` (MCP server only; no plugin or skills)

Wait for the user to finish the card and verify what it installed. The Claude connector adds only the MCP server, so do not treat it as a full plugin. If you have no card tool, or it rejects the ID, run the fallback after the user agrees to the checklist:

```bash
npx -y plugins add clerk/skills --yes
```

The command installs the Clerk plugin, with its skills and the [Clerk MCP server](https://mcp.clerk.com/mcp), into every detected coding agent. The agent may need a reload or restart to load the MCP server. Sign-in may follow in a browser or the agent's MCP settings.

For an agent the command doesn't support, the user can add the [Clerk MCP server](https://mcp.clerk.com/mcp) as a remote MCP server.

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
