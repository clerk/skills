# Identity provider setup for federated MCP sign-in

Each section creates a public OIDC client that uses Authorization Code + PKCE with no client secret, then connects it with `configure_identity_provider`. Replace `<callback_url>` with the `callback_url` from a `configure_identity_provider` dry run (see section 3 of `SKILL.md`). Run a CLI command only when that CLI is installed and signed in, and ask the user before you create anything in their identity provider.

The issuer must be an `https` URL on a public hostname, because Clerk fetches the discovery document over `https` only. An identity provider that runs on `localhost` needs a public `https` URL first, such as a deployment or a tunnel.

## Auth0

```bash
auth0 apps create \
  --name "Clerk MCP sign-in" \
  --type spa \
  --auth-method None \
  --callbacks "<callback_url>" \
  --no-input --json
```

Use `client_id` from the output. The issuer is the tenant domain, such as `https://<tenant>.us.auth0.com` (often in `AUTH0_DOMAIN` or `AUTH0_ISSUER_BASE_URL`).

Without the CLI, have the user create a **Single Page Application** in the Auth0 Dashboard and add `<callback_url>` to **Settings → Allowed Callback URLs**.

## Microsoft Entra ID

Register the callback as a public client (mobile and desktop) redirect URI, and allow the public client flow:

```bash
az ad app create \
  --display-name "Clerk MCP sign-in" \
  --sign-in-audience AzureADMyOrg \
  --public-client-redirect-uris "<callback_url>" \
  --is-fallback-public-client true \
  --query appId --output tsv
az account show --query tenantId --output tsv
```

The first command prints the client ID and the second prints the tenant ID. The issuer is `https://login.microsoftonline.com/<tenant-id>/v2.0`.

Don't use `--web-redirect-uris`: Entra requires a client secret for the web platform (`AADSTS7000218`). Don't use the single-page application platform either: Entra redeems its codes only from browser cross-origin requests, and Clerk redeems the code from its server.

Entra's `sub` is pairwise: each application gets a different `sub` for the same user, so the `sub` Clerk receives matches none of the team's existing records. Entra's `oid` is the same in every application in the tenant. Before anyone signs in, map Clerk's user ID to `oid` with `patch_instance_config` (preview with `dry_run: true` first). `<slug>` is `provider_key` from `configure_identity_provider` without the `oauth_custom_` prefix. The mapping replaces Clerk's default mapping, so list every field:

```json
{
  "connections_oauth_custom": {
    "<slug>": {
      "user_mapping": {
        "id": { "path": "oid" },
        "email": { "path": "email" },
        "first_name": { "path": "given_name" },
        "last_name": { "path": "family_name" },
        "name": { "path": "name" },
        "username": { "path": "preferred_username" }
      }
    }
  }
}
```

The token's `sub` is then the user's `oid`, so the MCP server matches existing records on `oid`. Clerk stores the ID when a user first signs in, so users who signed in before the mapping keep their pairwise `sub`.

## AWS Cognito

Cognito's OAuth endpoints need a user pool domain. Check for one:

```bash
aws cognito-idp describe-user-pool --user-pool-id <user-pool-id> --query UserPool.Domain --output text
```

If it prints `None`, add a prefix domain:

```bash
aws cognito-idp create-user-pool-domain --user-pool-id <user-pool-id> --domain <unique-prefix>
```

Create the public app client:

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id <user-pool-id> \
  --client-name clerk-mcp-sign-in \
  --no-generate-secret \
  --allowed-o-auth-flows code \
  --allowed-o-auth-flows-user-pool-client \
  --allowed-o-auth-scopes openid profile email \
  --callback-urls '["<callback_url>"]' \
  --supported-identity-providers COGNITO \
  --query UserPoolClient.ClientId --output text
```

If the team's users sign in through a federated provider configured in Cognito, add its name to `--supported-identity-providers`. If the domain uses managed login (version 2), the new client has no branding style until you create one:

```bash
aws cognito-idp create-managed-login-branding \
  --user-pool-id <user-pool-id> \
  --client-id <client-id> \
  --use-cognito-provided-values
```

The issuer is `https://cognito-idp.<region>.amazonaws.com/<user-pool-id>`.

## Okta

Okta Web applications always require client authentication, so a client without a secret must be a Single-Page Application. Have the user create one in the Okta Admin Console: **Applications → Create App Integration → OIDC → Single-Page Application**, with the **Authorization Code** grant, `<callback_url>` under **Sign-in redirect URIs**, and the team's users assigned. The issuer is `https://<org>.okta.com/oauth2/default` for the default custom authorization server, or `https://<org>.okta.com` for the org authorization server, whichever the team's existing app uses.

## Better Auth

Better Auth becomes an OIDC provider with the OAuth Provider plugin. Offer to add it to the user's server:

```bash
npm install @better-auth/oauth-provider
```

```ts
import { betterAuth } from 'better-auth'
import { jwt } from 'better-auth/plugins'
import { oauthProvider } from '@better-auth/oauth-provider'

export const auth = betterAuth({
  disabledPaths: ['/token'],
  plugins: [
    jwt({ disableSettingJwtHeader: true }),
    oauthProvider({
      loginPage: '/sign-in',
      consentPage: '/consent',
    }),
  ],
})
```

Run `npx auth migrate` (or `npx auth generate`) for the plugin's tables. The app needs the login page and a consent page that calls `authClient.oauth2.consent`, with `oauthProviderClient()` from `@better-auth/oauth-provider/client` in its auth client.

Register Clerk as a public client from an admin-only server route that checks the request's `Origin`:

```ts
const client = await auth.api.adminCreateOAuthClient({
  headers: request.headers,
  body: {
    client_name: 'Clerk MCP sign-in',
    redirect_uris: ['<callback_url>'],
    token_endpoint_auth_method: 'none',
  },
})
```

Use `client.client_id`. The issuer is the auth base URL, such as `https://<app-origin>/api/auth`.

## Supabase Auth

Have the user set this up in the Supabase Dashboard:

1. Under **Authentication → OAuth Server**, enable the OAuth 2.1 server and set the **Authorization Path** to a consent page in their app. That page reads `authorization_id` from the query string, calls `supabase.auth.oauth.getAuthorizationDetails(authorization_id)`, and then `approveAuthorization` or `denyAuthorization`.
2. Switch the project's JWT signing keys to an asymmetric key (RS256 or ES256). Clerk requests the `openid` scope, and Supabase can't generate ID tokens with the default HS256 key.
3. Under **Authentication → OAuth Apps**, add a client of type **Public** with `<callback_url>` as its redirect URI.

The issuer is `https://<project-ref>.supabase.co/auth/v1`.

## WorkOS AuthKit

Use WorkOS Connect, not the AuthKit application credentials. Have the user create a Connect OAuth application in the WorkOS Dashboard: **Public** (PKCE, no secret), first-party, with `<callback_url>` as its redirect URI. The issuer is the AuthKit domain, such as `https://<subdomain>.authkit.app`, or the team's custom AuthKit domain.

## Google Workspace

Google web clients need a client secret at the token endpoint, so Google can't use `configure_identity_provider`. Have the user:

1. In the Google Cloud console, under **Google Auth Platform → Audience**, set the user type to **Internal**, so only accounts in their Workspace organization can sign in.
2. Create an OAuth client of type **Web application** with `<callback_url>` as an authorized redirect URI.
3. Enter the issuer `https://accounts.google.com`, the Client ID, and the Client Secret on the **Identity provider** page in the [Clerk Dashboard](https://dashboard.clerk.com/).

## Keycloak and other OIDC providers

Create a public OIDC client (in Keycloak: client authentication off, standard flow on) with PKCE S256, `<callback_url>` as a valid redirect URI, and the `openid profile email` scopes. Connect it with the provider's issuer, such as `https://<host>/realms/<realm>` for Keycloak. If the provider can't issue a client without a secret, have the user enter the credentials on the **Identity provider** page in the [Clerk Dashboard](https://dashboard.clerk.com/).
