# Next.js Patterns for Organizations

Framework-specific pieces for `@clerk/nextjs` v7+: middleware-level route protection, `next/navigation`'s `redirect()`, and route matchers for org-scoped URL segments. Conceptual content lives in the main SKILL.md.

For other frameworks see:
- `clerk-react-patterns` (Vite/CRA)
- `clerk-astro-patterns`
- `clerk-nextjs-patterns` (broader Next.js patterns beyond orgs)

## Protecting Routes in Middleware

Next.js middleware runs before the request hits your page, so you can reject unauthorized traffic without rendering anything:

```typescript
// proxy.ts (Next.js 16+) or middleware.ts (Next.js <=15)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isOrgAdminRoute = createRouteMatcher(['/orgs/:slug/admin(.*)'])
const isBillingRoute = createRouteMatcher(['/orgs/:slug/billing(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isOrgAdminRoute(req)) {
    await auth.protect({ role: 'org:admin' })
  }

  if (isBillingRoute(req)) {
    await auth.protect({ permission: 'org:sys_billing:manage' })
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

`auth.protect({ ... })` accepts the same shape as `has()` — `{ role }`, `{ permission }`, or a callback `condition: (has) => boolean`.

## Server Component Redirects

Use `redirect()` from `next/navigation` to short-circuit rendering after an auth check. `redirect()` throws a special error Next.js handles internally — don't wrap it in try/catch:

```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function AdminPage({ params }: { params: { slug: string } }) {
  const { orgSlug, has } = await auth()

  if (orgSlug !== params.slug) redirect('/dashboard')
  if (!has({ role: 'org:admin' })) redirect(`/orgs/${orgSlug}`)

  return <AdminContent />
}
```

## Route Matchers with Org Slugs

`createRouteMatcher` accepts the same path syntax as Next.js App Router dynamic segments — `:slug` captures a path parameter:

```typescript
const isOrgRoute = createRouteMatcher([
  '/orgs/:slug',
  '/orgs/:slug/(.*)',
])
```

Note: `:slug` in the matcher is NOT automatically bound to the `orgSlug` from `auth()`. You still need to verify they match inside the page:

```typescript
const { orgSlug } = await auth()
if (orgSlug !== params.slug) redirect('/dashboard')
```

Otherwise a user with an active `acme` org can hit `/orgs/other-org/...` URLs and confuse your data layer.

## Server Actions + Orgs

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

  // scope the write by orgId so data can never leak across orgs
  return db.projects.create({ data: { name, orgId, createdBy: userId } })
}
```

Pattern: **always scope server actions by `orgId`** at the database layer. Don't trust the client to send the right org.

## API Routes

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
  if (!has({ permission: 'org:sys_memberships:read' })) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const clerk = await clerkClient()
  const { data } = await clerk.organizations.getOrganizationMembershipList({
    organizationId: orgId!,
  })

  return NextResponse.json({ members: data })
}
```

Return `403` (forbidden) when the user is authenticated but lacks permission; `401` (unauthenticated) when there's no session.

## File Naming

- `proxy.ts` — Next.js 16+ (current)
- `middleware.ts` — Next.js <=15 (Core 2 era and earlier)

Both use the same `clerkMiddleware` export. Only the filename changed. If you're on Next.js 16 with cache components, `ClerkProvider` must also move inside `<body>` — see the Core 3 upgrade guide.

## Key Rules

- **Validate `orgSlug === params.slug` on every org-scoped page.** The slug in the URL is an identifier; the active org in the session is the authority. Don't let them diverge.
- **Scope database writes by `orgId`.** Never trust the client to supply it.
- **Use `auth.protect()` in middleware**, `redirect()` in server components. Don't try to `redirect()` from middleware — use `NextResponse.redirect()` or let `auth.protect()` handle it.
- **`redirect()` throws** — it doesn't return. Don't put code after it expecting to run.
- **Middleware is fast-path protection**, not a replacement for page-level checks. Defense in depth: middleware catches 95%, page-level catches the edge cases.
