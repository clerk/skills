---
name: clerk-mcp
description: Use when implementing Clerk authentication, Clerk SDK usage, Clerk quickstarts, B2B SaaS organization flows, billing examples, or other Clerk integration patterns where the Clerk MCP server can provide snippets or guidance.
license: MIT
metadata:
  author: clerk
  version: 1.0.0
---

# Clerk MCP

Use the bundled `clerk` MCP server when the task involves Clerk implementation guidance, especially:

- Adding Clerk authentication to a frontend or backend app.
- Choosing or applying Clerk SDK hooks, helpers, or components.
- Implementing B2B SaaS organization flows, organization switching, role checks, or billing patterns.
- Looking up Clerk quickstarts for Next.js App Router, React/Vite, Expo, Astro, Remix, Express, or Go.

Prefer MCP-provided snippets and quickstarts over guessing API shapes from memory. Start with `list_clerk_sdk_snippets` when the right slug is unclear, then call `clerk_sdk_snippet` for the specific snippet or bundle.

Current public MCP scope is guidance-only: SDK snippets, snippet bundles, and quickstart resources. Do not assume live Clerk account/user/organization tools are available unless the MCP tool list shows them in the current session.
