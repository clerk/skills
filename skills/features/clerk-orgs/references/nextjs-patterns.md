# Next.js Patterns for Organizations

Org-specific adaptations for `@clerk/nextjs`. For generic Next.js patterns (route protection, `auth()` server vs client, 401/403 responses, server action shape, caching) see the `clerk-nextjs-patterns` skill.

For other frameworks see `clerk-react-patterns`, `clerk-astro-patterns`, `clerk-react-router-patterns`, `clerk-tanstack-patterns`.

## Role + Permission Protection in Each Page

`auth.protect()` accepts the same shape as `has()` — pass `{ role }`, `{ permission }`, or a callback — so each org-scoped page and Route Handler enforces org authorization without any new API. A signed-in user without the role or permission gets a `404`. `proxy.ts` stays a bare `clerkMiddleware()`.

```typescript
// app/orgs/[slug]/billing/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function BillingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { orgSlug } = await auth.protect({ permission: 'org:billing:manage' })
  if (orgSlug !== slug) redirect('/dashboard')
  return <BillingSettings />
}
```

`org:billing:manage` is a custom permission: create it in the Dashboard and assign it to a role. Server-side permission checks only work with custom permissions. System permissions (`org:sys_*`) aren't in the session token, so to require one of those, check the role instead (`{ role: 'org:admin' }`). See the [authorization checks guide](https://clerk.com/docs/guides/secure/authorization-checks).

## URL Slug Safety Invariant

Nothing validates that the URL slug matches the active org. A user with active org `acme` can hit `/orgs/other-org/...` and your data layer will happily reply with `acme`'s data. Always verify on each org-scoped page, alongside the role or permission check:

```typescript
// app/orgs/[slug]/admin/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { orgSlug, has } = await auth()
  if (orgSlug !== slug) redirect('/dashboard')
  if (!has({ role: 'org:admin' })) redirect(`/orgs/${orgSlug}`)
  return <AdminContent />
}
```

The same check applies to API routes and server actions — see below.

## Server Actions: Scope Writes by `orgId`

```typescript
'use server'
import { auth } from '@clerk/nextjs/server'

export async function createProject(name: string) {
  const { orgId, userId, has } = await auth()

  if (!userId) throw new Error('Not signed in')
  if (!orgId) throw new Error('No active organization')
  if (!has({ permission: 'org:projects:create' })) {
    throw new Error('Not authorized')
  }

  // Pull orgId from the session, never from client input — prevents cross-org writes
  return db.projects.create({ data: { name, orgId, createdBy: userId } })
}
```

**Rule:** always bind `orgId` from `auth()` at the database layer. Never trust a client-supplied org identifier.

## API Route Example

```typescript
// app/api/orgs/[slug]/members/route.ts
import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { orgSlug, orgId, has } = await auth()
  const { slug } = await params

  if (orgSlug !== slug) {
    return NextResponse.json({ error: 'wrong org' }, { status: 403 })
  }
  // Reading members needs org:sys_memberships:read, which every default role
  // has and which has() can't check. The slug check above already proves
  // membership. To restrict further, check a role:
  if (!has({ role: 'org:admin' })) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const clerk = await clerkClient()
  const { data } = await clerk.organizations.getOrganizationMembershipList({
    organizationId: orgId!,
  })

  return NextResponse.json({ members: data })
}
```

(Generic 401 vs 403 response policy lives in `clerk-nextjs-patterns/references/api-routes.md`.)

## Key Rules

- **Validate `orgSlug === params.slug` on every org-scoped surface.** The slug in the URL is an identifier; the active org in the session is the authority. Don't let them diverge.
- **Bind `orgId` from `auth()` at the database layer.** Never let a client supply it.
- **Use `auth.protect({ role / permission })` in each org-scoped page and Route Handler.** Middleware doesn't decide which routes need auth.
- **`redirect()` throws** — it doesn't return. Don't put code after it expecting to run.
