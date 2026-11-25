---
name: clerk-mcp-auth
description: Add Clerk OAuth to an MCP server so AI clients such as Claude and ChatGPT can connect to it, while users keep signing in with the team's existing identity provider. Use when protecting an MCP server with Clerk, adding OAuth or authorization to an MCP server, or registering an MCP server with Clerk.
license: MIT
compatibility: Uses the configure_mcp_server, configure_identity_provider, check_mcp_server, and patch_instance_config tools of the Clerk MCP server (https://mcp.clerk.com/mcp). Written against those tools as of November 2026.
metadata:
  author: clerk
  version: 1.2.0
---

# Add Clerk MCP auth to this MCP server

Add OAuth to this MCP server so AI clients such as Claude Code, Claude.ai, and ChatGPT can connect to it. Clerk acts as the OAuth authorization server: users keep signing in with the team's existing identity provider, and Clerk issues JWT access tokens scoped to this MCP server.

You need the Clerk application ID (`app_...`), the MCP server URL that clients connect to, and the team's existing identity provider. Inspect the codebase first to detect the MCP server URL and existing auth provider; ask the user for anything you don't have instead of guessing or creating a new Clerk application.

## 1. Register the MCP server URL with Clerk

Clerk only issues tokens for registered MCP server URLs (RFC 8707 audience binding).

- Register the MCP server URL (HTTPS, or `http://localhost` for local testing) with the Clerk MCP server tool `configure_mcp_server` (`application_id` set to the Clerk application ID, `instance` set to the target instance, and `resource_url` set to the exact MCP server URL). If the Clerk MCP tools aren't available, ask the user either to connect the [Clerk MCP server](https://mcp.clerk.com/mcp) (streamable HTTP) and sign in with their Clerk Dashboard account, or to add the URL on the **MCP servers** page in the [Clerk Dashboard](https://dashboard.clerk.com/).
- If a tool's parameters differ from the ones above, follow the tool's own schema.

## 2. Protect the MCP server in code

Use the instance's Clerk **Issuer URL** (such as `https://<slug>.clerk.app` for Clerk-hosted domains or `https://clerk.<domain>` for custom domains) and its **JWKS URL** (`<issuer>/.well-known/jwks.json`). No Clerk secret key or publishable key is required to verify access tokens offline.

- **Protected resource metadata (RFC 9728):** Serve JSON at `/.well-known/oauth-protected-resource` and, if the MCP endpoint has a path (for example `/mcp`), also at `/.well-known/oauth-protected-resource<path>` (for example `/.well-known/oauth-protected-resource/mcp`):
  - `resource`: the exact registered MCP server URL
  - `authorization_servers`: `["<issuer>"]`
  - `bearer_methods_supported`: `["header"]`
- **401 challenge:** When an MCP request has no valid `Authorization: Bearer <token>` header, return HTTP `401` with `WWW-Authenticate: Bearer resource_metadata="<protected-resource-metadata-url>"` (and `, error="invalid_token"` if a bearer token was sent but rejected). If browser-based clients such as MCP Inspector connect to the server, expose `WWW-Authenticate` in `Access-Control-Expose-Headers`.
- **JWT access token verification:** On every MCP request, verify the Bearer JWT against `<issuer>/.well-known/jwks.json` using an appropriate library for this codebase (such as `@clerk/backend` `authenticateRequest(..., { acceptsToken: 'oauth_token', audience: resourceUrl })` or `jose` in JS/TS, or a standard JWKS verifier in Python, Go, or another language). Verify:
  - Signature matches the JWKS keys and the token is not expired (`exp`)
  - `iss` matches `<issuer>`
  - `aud` matches or contains the exact registered MCP server URL (`resource_url`)
- **User identity:** The verified token's `sub` is the user's subject at the team's identity provider. For most providers that is the user's ID there, the same value the team's existing app sees, so authorize against existing user records without migrating users. Microsoft Entra ID is the exception: its `sub` is pairwise, a different value for each application, so map Clerk's user ID to Entra's `oid` claim before anyone signs in (see `references/identity-providers.md`) and match existing records on `oid`.

## 3. Connect the team's existing identity provider

Never ask for, read, or handle an identity provider's client secret. Only inspect package manifests, auth config files, and non-secret public issuer/domain settings to detect the auth stack.

When the provider can issue a public **PKCE (S256)** OIDC client without a client secret and the Clerk MCP tool `configure_identity_provider` is available, connect it in this order:

1. **Get Clerk's Callback URL.** The identity provider client needs it before it exists. Call `configure_identity_provider` with `dry_run: true`, the `issuer_url`, and `client_id: "pending"`, and take `callback_url` from the result. Don't build it yourself: its path depends on the instance's host and callback settings.
2. **Create the public client** at the identity provider with the Callback URL as its redirect URI. `references/identity-providers.md` has the exact CLI commands or console steps for each provider below.
3. **Preview** with `configure_identity_provider` (`application_id`, `instance`, `issuer_url`, `client_id`, and `dry_run: true`; never a client secret). Clerk fetches the issuer's discovery document and validates the change without saving it, and the result's `callback_url` matches the redirect URI from step 1.
4. **Save** by calling it again without `dry_run`. It saves the provider and turns on federated sign-in together.

`issuer_url` must be `https` on a public hostname, because Clerk fetches discovery documents over `https` only; give a provider on `localhost` a public URL first. The tool refuses to change a provider that already has a client secret, and to point an instance that already federates at a different issuer or client ID. Switching providers gives every user a new subject, so pass `replace: true` only when the user confirms the switch.

When the provider needs a client secret or the tool isn't available, give tailored setup steps with the Callback URL so the user can enter the credentials themselves on the **Identity provider** page in the [Clerk Dashboard](https://dashboard.clerk.com/).

- **Clerk (`@clerk/*`):** Stop and tell the user not to set up a separate bolt-on MCP server app or OIDC federation. Add MCP auth directly to their existing Clerk application instead, so users sign in natively.
- **NextAuth / Auth.js (`next-auth`, `@auth/*`):** Explain that NextAuth / Auth.js is an OAuth/OIDC client, not an OIDC identity provider, so it doesn't expose `/authorize`, `/token`, or `/.well-known/openid-configuration`. Find the upstream OIDC provider in the NextAuth config (such as Google, Auth0, Okta, Microsoft Entra ID, or Cognito) and connect Clerk directly to it. If the app only uses local database credentials with no upstream identity provider, explain that it needs an OIDC provider layer in front of the user store.
- **Auth0 (`auth0`, `@auth0/*`, `AUTH0_DOMAIN`), Microsoft Entra ID (`@azure/msal-*`, `AZURE_AD_*`), and AWS Cognito (`amazon-cognito-*`, `COGNITO_*`):** Create the public client with the provider's CLI when it is installed and signed in, otherwise with the console steps. For Entra, also map `oid` as described in the reference.
- **Okta (`@okta/*`, `OKTA_DOMAIN`):** Okta Web applications require client authentication, so the public client must be a **Single-Page Application**.
- **Better Auth (`better-auth`):** Offer to add the OAuth Provider plugin (`@better-auth/oauth-provider`) and register Clerk as a public client with `token_endpoint_auth_method: "none"`.
- **Supabase Auth (`@supabase/supabase-js`, `SUPABASE_URL`):** The OAuth server needs a consent page at its Authorization Path and asymmetric JWT signing keys for ID tokens.
- **WorkOS AuthKit (`@workos-inc/*`, `WORKOS_*`):** Use a public WorkOS Connect application. The issuer is the AuthKit domain, such as `https://<subdomain>.authkit.app`, not `api.workos.com`.
- **Google Workspace:** Google web clients need a client secret, so send the user to the Clerk Dashboard instead of using the tool, and have them set the OAuth consent screen's audience to **Internal** so only their Workspace accounts can sign in.
- **Keycloak or other OIDC providers:** Create a public client with PKCE when the provider supports one; otherwise use the Clerk Dashboard.

## 4. Verify discovery and end-to-end sign-in

- **Public HTTPS servers:** After updating and deploying the server, call `check_mcp_server` with `application_id`, `instance` set to the target instance, `resource_url`, and `force_recheck: true` to verify that protected resource metadata, the 401 challenge, and Clerk's OAuth discovery documents pass.
- **Localhost servers:** Skip `check_mcp_server` (the hosted checker cannot reach `localhost`) and verify the `/.well-known/oauth-protected-resource` response and 401 `WWW-Authenticate` header locally.
- **End-to-end test:** Discovery checks do not sign in or obtain tokens. Finish by having the user connect from Claude Code, MCP Inspector, Claude.ai, or ChatGPT (Claude.ai and ChatGPT web require a public HTTPS URL), sign in with their identity provider, and call a tool.
