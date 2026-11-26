# Clerk MCP server - Reporting

What `reporting` sends to Clerk, for answering "what does this send?" before the user decides. The adapter READMEs in the installed `@clerk/mcp-tools` package have the full detail.

## Delivery

Reports are queued after the response and sent in batches to Clerk's Backend API at `POST /v1/mcp_events`. A reporting failure never delays or fails the MCP request. A call without a token, which `publicAccess` lets through, is not reported.

## Events

- **Tool calls:** tool and server names, outcome, error code, timestamp, and total and handler durations. The error code is the result's `_meta['clerk.com/error_code']`, `thrown:<ErrorClass>` for a handler that threw (never its message), `jsonrpc:<code>`, or `not_found` for an unknown tool.
- **Client initialization:** each `initialize`, or `server/discover` on protocol revision 2026-07-28, with the client's name and version and the protocol version.
- **List requests:** each `tools/list`, `resources/list`, `resources/templates/list`, `prompts/list`, and `tasks/list`, with its item count.
- **Resource reads:** named by the registered resource or URI template they matched, or only the URI's scheme; never the requested URI.
- **Prompt gets:** the prompt name and message count.
- **Auth failures:** each `401`, `403`, and `421` the handler answers, with the reason, the HTTP status, the verifier's code for a rejected token (never its message), and the JSON-RPC method and tool name of the request's first message, read from a copy of the body after the answer is sent. Only a `403` carries Clerk identity fields. At most 100 a minute are reported per secret key.

## Fields on each report

- **Clerk identity:** user, OAuth client, access-token, and organization IDs, for tokens Clerk verified. A token your own `verifyToken` verified sends none.
- **Session hash:** a truncated SHA-256 of the `Mcp-Session-Id` header, salted with the publishable key. The raw session ID is never sent. No option turns it off, not even `identity: false`.
- **IP address:** where the adapter can obtain it. Express uses `req.ip`, which follows the app's `trust proxy` setting. Hono uses `cf-connecting-ip` on Cloudflare Workers and the socket address under `@hono/node-server`. Next.js uses `x-real-ip` on Vercel and sends none when self-hosted. Behind a proxy whose socket address is the proxy's, or wherever the adapter finds none, pass an `ipAddress` function that returns the client's address.
- **`User-Agent`:** up to 512 characters.

Never sent: tool arguments, results, resource contents, prompt arguments, and error text.

## Options

Pass an options object instead of `true`:

- `ipAddress`: `true` (default), `false`, or `(request) => string | undefined`.
- `userAgent`, `identity`: `false` leaves the field out. Both default to `true`.
- `tools`: `(toolName) => boolean`. A tool it returns `false` for is not reported, and its auth failures are reported without its name.
- `serverName`: overrides the server's registered name in reports.

Unknown keys and invalid values throw a `Clerk error:` when the handler is created. Omit `reporting` to send no reports.
