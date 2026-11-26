---
name: clerk-mcp-server
description: Protect and instrument an MCP server with Clerk using @clerk/mcp-tools. Use for MCP server authentication, OAuth protected resource metadata, activity reporting, or migration from mcpAuth, withClerkMcpAuth, or streamableHttpHandler in Express, Hono, or Next.js.
license: MIT
---

# Protect an MCP server with Clerk

Use the framework subpath of `@clerk/mcp-tools`, not a root import. Check the installed package version: these APIs require `<MIN_MCP_TOOLS_VERSION>` or newer. Do not invent a version if it has not been released. Configure the server's public URL as an OAuth resource in the Clerk instance; `resourceUrl` must be that exact URL, including its path. For OAuth-resource registration and configuration checks, use the `clerk-cli` skill's MCP-server recipe rather than duplicating its CLI steps.

Set `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` in the server environment. Keep secret keys on the server. Serve protected resource metadata at the URL advertised in the authentication challenge, and use the same authentication options for the metadata and MCP routes. The examples below opt in to reporting; omit `reporting` to leave it off.

## Express and Hono

Use `@modelcontextprotocol/server` and its `createMcpHandler` for the SDK 2.x server. Install `@clerk/mcp-tools` and `@modelcontextprotocol/server`; for Express also install `express@5`, `@clerk/express`, and `@modelcontextprotocol/node`, and for Hono install `hono` and `@clerk/backend`. Use the same server factory for either adapter:

```ts
import { McpServer, createMcpHandler } from '@modelcontextprotocol/server'
// Express: import these from '@clerk/mcp-tools/express' instead.
import {
  clerkInstrumentHandler,
  clerkInstrumentServer,
  protectedResourceMetadataHandler,
  authorizationServerMetadataHandler,
} from '@clerk/mcp-tools/hono'

const options = { resourceUrl: 'https://mcp.example.com/mcp', reporting: true } as const

function createServer() {
  const server = new McpServer({ name: 'example', version: '1.0.0' })
  clerkInstrumentServer(server) // Before registering tools, resources, or prompts.
  // Register tools, resources, and prompts here.
  return server
}
```

For Hono, mount the routes on the app:

```ts
import { Hono } from 'hono'

const app = new Hono()
app.all('/.well-known/oauth-protected-resource/mcp', protectedResourceMetadataHandler(options))
app.all('/.well-known/oauth-authorization-server', authorizationServerMetadataHandler())
app.all('/mcp', clerkInstrumentHandler(createMcpHandler(createServer), options))
export default app
```

For Express, keep the server factory above, switch the adapter import to `@clerk/mcp-tools/express`, and mount the handlers on an Express 5 app after `express.json()`:

```ts
import express from 'express'
import {
  authorizationServerMetadataHandler,
  clerkInstrumentHandler,
  protectedResourceMetadataHandler,
} from '@clerk/mcp-tools/express'

const app = express()
app.use(express.json())
app.all('/.well-known/oauth-protected-resource/mcp', protectedResourceMetadataHandler(options))
app.all('/.well-known/oauth-authorization-server', authorizationServerMetadataHandler())
app.all('/mcp', clerkInstrumentHandler(createMcpHandler(createServer), options))
```

Do not also mount a separate `mcpAuth` middleware on the MCP route. In Hono, avoid running `clerkMiddleware()` on the MCP route; the instrumented handler verifies the token itself.

## Next.js with mcp-handler

Install `@clerk/mcp-tools` and `mcp-handler`. Use the same options for the protected resource metadata route at `app/.well-known/oauth-protected-resource/mcp/route.ts` and the MCP route:

```ts
// lib/mcp.ts
export const mcpOptions = { resourceUrl: 'https://mcp.example.com/mcp', reporting: true } as const
```

```ts
// app/.well-known/oauth-protected-resource/mcp/route.ts
import { protectedResourceMetadataHandler } from '@clerk/mcp-tools/next'
import { mcpOptions } from '@/lib/mcp'

const handler = protectedResourceMetadataHandler(mcpOptions)
export { handler as GET }
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

For production, also configure the authorization server metadata and CORS routes as required by the application's deployment. Consult the installed package's Next.js README for the complete route setup.

## Reporting and migration

`reporting` is off by default. Set `reporting: true` to opt in, pass an options object to control or filter the data, or omit it to disable reporting. Reports are queued after the response and sent in batches to Clerk's Backend API at `/v1/mcp_events`; a reporting failure does not affect the MCP request. Events cover client initialization/discovery (client and protocol versions), list requests and item counts, tool calls, resource reads, prompt gets, and authentication failures. Tool events include tool and server names, outcome/error code, timestamps, and total and handler durations. Resource-read events name the registered resource or URI template they matched, or only the URI scheme; they never include the requested URI. Prompt events include the prompt name and message count, and auth failures include status and reason. By default, reports can include the client IP address where the adapter can obtain it, the `User-Agent`, and user, OAuth client, access-token, and organization IDs for tokens Clerk verified. A truncated hash of the session ID, salted with the publishable key, may also be included; the raw session ID is not sent. Tool arguments, results, resource contents, prompt arguments, and error text are not sent.

To reduce reported data, pass options such as `reporting: { ipAddress: false, userAgent: false, identity: false, tools: (name) => name !== 'healthcheck', serverName: 'example-production' }`. `ipAddress`, `userAgent`, and `identity` default to `true`; IP reporting depends on what the adapter/runtime can provide. `tools` can exclude selected tools, and `serverName` overrides the server's registered name in reports. `identity: false` suppresses the Clerk identity fields but does not suppress the session hash; omit `reporting` entirely to send no MCP activity reports. Review the package's reporting options and privacy implications before enabling it.

Replace Express or Hono `mcpAuth` plus `streamableHttpHandler` with `clerkInstrumentHandler(createMcpHandler(createServer), options)`, and add `clerkInstrumentServer` to the factory. Replace Next.js `withClerkMcpAuth(handler, options)` with `clerkInstrumentHandler(handler, options)`. In PR #72, Express `mcpAuth`, the Express and Hono `streamableHttpHandler`, and Next.js `withClerkMcpAuth` are deprecated; Hono `mcpAuth` is also described as deprecated in its adapter README. These older APIs do not accept the reporting option. For SDK 1.x, keep a compatible transport handler rather than passing the SDK 2.x factory unchanged; consult the adapter README for the transport example.

Plain fetch/Workers support from `@clerk/mcp-tools/fetch` is a separate upstream change, not part of the initial reporting API. Check the installed package and its documentation before using that subpath; use Hono on Workers when the fetch adapter is unavailable.
