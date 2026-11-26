---
name: clerk-mcp-server
description: Write the server code that protects and instruments an MCP server with Clerk using @clerk/mcp-tools in Express, Hono, or Next.js. Use for MCP server authentication, OAuth protected resource metadata, MCP analytics or audit-log reporting, or migrating from mcpAuth, withClerkMcpAuth, or streamableHttpHandler. Registering the server with Clerk is clerk-cli's `clerk agents mcp` recipe.
license: MIT
---

# Protect and instrument an MCP server with Clerk

1. Install a `@clerk/mcp-tools` version at or above `<MIN_MCP_TOOLS_VERSION>` with the framework's packages below. Import from its framework subpath (`/express`, `/hono`, `/next`), and from `/server` in code shared between adapters.
2. Register the server's public URL with Clerk through the [clerk-cli MCP-server recipe](../clerk-cli/references/recipes.md#your-own-mcp-server). Use the URL it registers, path included, as `resourceUrl`.
3. Set `CLERK_SECRET_KEY` and the publishable key in the server environment: `CLERK_PUBLISHABLE_KEY` for Express and Hono, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` for Next.js. A Next.js app that passes its keys to `clerkMiddleware()` or runs keyless passes `clerkClient: () => clerkClient()` from `@clerk/nextjs/server` in the options instead, and keeps `/mcp` in the middleware's `matcher` so that client gets the middleware's keys.
4. Mount the metadata and MCP routes below with one shared options object, so the metadata's `resource` is the URL the MCP route checks.
5. Confirm the server works as [Verify](#verify) describes.

The instrumented handler verifies the token itself. Mount it as the only auth on `/mcp`: leave out `mcpAuth`, keep Express and Hono `clerkMiddleware()` off `/mcp`, and in Next.js leave `/mcp` and the `/.well-known` routes out of `auth.protect()`, so clients get the `401` challenge rather than a second verification or a sign-in redirect.

## Express and Hono

Both adapters serve an MCP SDK 2.x server from `@modelcontextprotocol/server`. Share the server factory and options:

```ts
// server.ts
import { McpServer } from '@modelcontextprotocol/server'
import { clerkInstrumentServer } from '@clerk/mcp-tools/server'

export const options = { resourceUrl: 'https://mcp.example.com/mcp' } as const

export function createServer() {
  const server = new McpServer({ name: 'example', version: '1.0.0' })
  clerkInstrumentServer(server) // Before registering tools, resources, or prompts.
  // Register tools, resources, and prompts here.
  return server
}
```

### Hono

```bash
npm install @clerk/mcp-tools hono @clerk/backend @modelcontextprotocol/server
```

```ts
// app.ts
import { Hono } from 'hono'
import { createMcpHandler } from '@modelcontextprotocol/server'
import {
  authorizationServerMetadataHandler,
  clerkInstrumentHandler,
  protectedResourceMetadataHandler,
} from '@clerk/mcp-tools/hono'
import { createServer, options } from './server'

const app = new Hono()
app.all('/.well-known/oauth-protected-resource/mcp', protectedResourceMetadataHandler(options))
app.all('/.well-known/oauth-authorization-server', authorizationServerMetadataHandler())
app.all('/mcp', clerkInstrumentHandler(createMcpHandler(createServer), options))
export default app
```

`export default app` runs on Cloudflare Workers and Bun. On Node.js, also install `@hono/node-server` and start the app with `serve({ fetch: app.fetch, port: 3000 })`.

### Express

```bash
npm install @clerk/mcp-tools @clerk/express express@5 @modelcontextprotocol/server @modelcontextprotocol/node
```

Mount the handlers after `express.json()`:

```ts
// app.ts
import express from 'express'
import { createMcpHandler } from '@modelcontextprotocol/server'
import {
  authorizationServerMetadataHandler,
  clerkInstrumentHandler,
  protectedResourceMetadataHandler,
} from '@clerk/mcp-tools/express'
import { createServer, options } from './server'

const app = express()
app.use(express.json())
app.all('/.well-known/oauth-protected-resource/mcp', protectedResourceMetadataHandler(options))
app.all('/.well-known/oauth-authorization-server', authorizationServerMetadataHandler())
app.all('/mcp', clerkInstrumentHandler(createMcpHandler(createServer), options))
app.listen(3000)
```

## Next.js with mcp-handler

```bash
npm install @clerk/mcp-tools @clerk/nextjs mcp-handler @modelcontextprotocol/server zod
```

```ts
// lib/mcp.ts
export const mcpOptions = { resourceUrl: 'https://mcp.example.com/mcp' } as const
```

```ts
// app/.well-known/oauth-protected-resource/mcp/route.ts
import { metadataCorsHandler, protectedResourceMetadataHandler } from '@clerk/mcp-tools/next'
import { mcpOptions } from '@/lib/mcp'

const handler = protectedResourceMetadataHandler(mcpOptions)
const corsHandler = metadataCorsHandler()
export { handler as GET, corsHandler as OPTIONS }
```

```ts
// app/mcp/route.ts
import { clerkInstrumentHandler, clerkInstrumentServer } from '@clerk/mcp-tools/next'
import { createMcpHandler } from 'mcp-handler'
import { mcpOptions } from '@/lib/mcp'

const handler = createMcpHandler((server) => {
  clerkInstrumentServer(server)
  // Register tools, resources, and prompts here.
})
const route = clerkInstrumentHandler(handler, mcpOptions)
export { route as GET, route as POST, route as DELETE }
```

Serve `authorizationServerMetadataHandler()` at `app/.well-known/oauth-authorization-server/route.ts` as `GET`. Browser-based clients such as MCP Inspector also need CORS on `/mcp`; follow the "CORS for browser-based MCP clients" section of the package's Next.js README.

## Reporting

`reporting` sends MCP analytics and audit-log events to Clerk. It is off by default, and the examples above leave it off.

Ask the user before turning reporting on: it sends Clerk the caller's IP address, `User-Agent`, and Clerk user, organization, OAuth client, and token IDs. With their yes, add `reporting: true` to the shared options, or an options object to send less.

To send less, pass `reporting: { ipAddress: false, userAgent: false, identity: false, tools: (name) => name !== 'healthcheck', serverName: 'example-production' }`; `identity: false` still sends the session hash. When the user asks what is sent, read [references/reporting.md](references/reporting.md).

## Migrate from deprecated APIs

`mcpAuth`, `streamableHttpHandler`, and `withClerkMcpAuth` are deprecated and refuse `reporting` with a `Clerk error:`. Replace Express or Hono `mcpAuth` plus `streamableHttpHandler` with `clerkInstrumentHandler(createMcpHandler(createServer), options)`, and Next.js `withClerkMcpAuth(handler, options)` with `clerkInstrumentHandler(handler, options)`; add `clerkInstrumentServer` where each server is created. On MCP SDK 1.x, pass your own handler serving the SDK's transport instead of `createMcpHandler`: `StreamableHTTPServerTransport` on Express, as the Express README's "MCP SDK 1.x" section shows, or `WebStandardStreamableHTTPServerTransport` on Hono.

On Cloudflare Workers, use the Hono adapter.

## Verify

The server is done when all of these hold:

- An unauthenticated request to `/mcp` gets `401` with a `WWW-Authenticate: Bearer` challenge whose `resource_metadata` is the metadata URL.
- That URL answers `200` with `resource` equal to `resourceUrl`.
- A token issued for another resource is rejected.
- A valid token for this resource reaches a tool.

After deploying, run the `clerk agents mcp check` step of the [clerk-cli MCP-server recipe](../clerk-cli/references/recipes.md#your-own-mcp-server).
