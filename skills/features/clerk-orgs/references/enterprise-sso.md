# Enterprise SSO

Per-organization SAML or OIDC. Configured in Dashboard → Organizations → select org → SSO Connections. Domain-verified. Users with a verified email domain auto-join the org on first SSO sign-in.

## Configuration Flow

1. Open Dashboard → Organizations → select the org → **SSO Connections**
2. Add a SAML or OIDC connection with the customer's IdP metadata
3. Set the **Verified Domain** for the org — Clerk verifies ownership via DNS TXT record
4. Once verified, users signing in with a matching email domain are routed through the SSO flow and auto-joined to the org

Each org can have multiple SSO connections (e.g., SAML + OIDC, or SAML for two different IdPs).

Permission required to manage: `org:sys_domains:manage`.

## Strategy Name

```typescript
// Current SDK (Core 3+)
strategy: 'enterprise_sso'
```

Used in `signIn.supportedFirstFactors` when building custom sign-in flows.

> **Core 2 ONLY (skip if current SDK):** Uses `strategy: 'saml'` and `user.samlAccounts` instead of the Core 3 names.

## Accessing SSO Info on the User

This is where the skill used to hallucinate the wrong shape. The correct access paths:

```typescript
import { currentUser } from '@clerk/nextjs/server'

const user = await currentUser()
const ssoAccount = user?.enterpriseAccounts?.[0]

if (ssoAccount) {
  // Directly on EnterpriseAccount:
  ssoAccount.emailAddress           // the email used for SSO
  ssoAccount.active                 // boolean — is the account active
  ssoAccount.firstName, ssoAccount.lastName
  ssoAccount.lastAuthenticatedAt    // Date | null

  // Provider metadata lives on the nested EnterpriseAccountConnection:
  const conn = ssoAccount.enterpriseConnection
  conn?.provider    // 'saml_okta' | 'saml_google' | 'saml_microsoft' | 'saml_custom' | 'oauth_<provider>'
  conn?.protocol    // 'saml' | 'oauth'
  conn?.domain      // the verified domain
  conn?.name        // display name of the connection
  conn?.active
}
```

### Common Mistakes

```typescript
// ❌ Wrong — `provider` is not a field on EnterpriseAccount
ssoAccount.provider

// ✓ Right — `provider` lives on the nested connection
ssoAccount.enterpriseConnection?.provider
```

`enterpriseConnection` is `null` if the connection was deleted after the account was provisioned. Always guard with `?.`.

## Verified Domains

A Verified Domain is an email domain (e.g. `acme.com`) that the org has proven ownership of via DNS TXT record. Once verified:

- Users with `someone@acme.com` emails can auto-join the org
- Enterprise SSO connections can be attached to the domain
- Controlled by `org:sys_domains:manage` Permission

Enrollment modes for verified domains:

| Mode | Behavior |
|------|----------|
| Manual invitation | Admin must invite each user individually |
| Automatic invitation | Clerk auto-sends invitations to anyone signing up with the domain |
| Automatic suggestion | Matching users see a prompt to join the org |

Configure per-domain in Dashboard → Organizations → select org → Verified Domains.

## Custom Sign-In Flow with SSO

Typical pattern:

```typescript
const { signIn } = useSignIn()

// Start SSO — Clerk redirects to the IdP and back
await signIn.authenticateWithRedirect({
  strategy: 'enterprise_sso',
  identifier: emailAddress,
  redirectUrl: '/sso-callback',
  redirectUrlComplete: '/dashboard',
})
```

The `identifier` is the user's email. Clerk uses the domain to route to the correct Enterprise SSO connection. If no matching connection exists, the sign-in falls back to standard email/password or returns an error.

## Key Rules

- **`provider` is nested.** Always `enterpriseAccounts[i].enterpriseConnection?.provider` — not directly on the account.
- **Domain verification first.** SSO doesn't work until the org has at least one Verified Domain.
- **Strategy name matters.** Core 3 uses `'enterprise_sso'`; Core 2 used `'saml'`. They are NOT interchangeable.
- **Multiple connections per org is fine.** Typical enterprise: one SAML connection to Okta + one OIDC to Azure AD for different user segments.
- **Auto-join on first SSO sign-in.** Users with a matching verified email domain are added to the org without an invitation.
