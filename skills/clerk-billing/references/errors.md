# Billing error signatures

## Diagnose billing failures

When you see any of these errors or symptoms, the fix is almost always a Dashboard toggle, not a code change. Do not start editing components.

| Error / symptom | Root cause | Fix |
|---|---|---|
| `Clerk: 🔒 The <PricingTable/> component cannot be rendered when billing is disabled.` (code: `cannot_render_billing_disabled`, dev only) | Billing is not enabled for this instance | Enable Billing at [dashboard.clerk.com → Billing → Settings](https://dashboard.clerk.com/last-active?path=billing/settings), or run `clerk enable billing`. |
| `<PricingTable />` renders empty | No plans, OR plan in the wrong tab (User vs Organization), OR Billing not enabled | Create plan in matching tab; pass `for="organization"` for B2B; check Billing Settings |
| Users can't subscribe to a personal plan on a B2C + B2B app | Membership required mode (default since 2025-08-22) disables personal accounts, signed-in users are forced into `choose-organization` and never land on a personal-subscription state | If you need personal + org subscriptions coexisting: Dashboard → Organizations settings → *Membership optional* |
| Can't find a Features page | Features are per-plan, not global | Dashboard → Billing → Plans → click plan → Features |
| `has({ plan: 'pro' })` always returns `false` after a successful checkout | Session token hasn't been refreshed to include the new plan | `await clerk.session?.reload()` or navigate to force a new session |
| `has({ plan: 'pro' })` returns `false` before any subscribe attempt | Plan slug mismatch (case-sensitive), OR Billing not enabled, OR payment gateway not connected in production | Verify slug in Dashboard → Billing → Plans; confirm Billing → Settings shows enabled + connected gateway |
| `has({ permission: 'org:x:y' })` returns `false` for a user who has the role | The Feature tied to that permission is not included in the organization's active Plan | Add the Feature to the Plan in Dashboard → Billing → Plans → Features |
| Webhook 401 or 404 / signature verification failed | `CLERK_WEBHOOK_SIGNING_SECRET` mismatch, or `auth.protect()` covers the webhook route | Copy the Signing Secret from Dashboard → Webhooks. Ensure nothing calls `auth.protect()` for `/api/webhooks(.*)`, in middleware or in the handler |
