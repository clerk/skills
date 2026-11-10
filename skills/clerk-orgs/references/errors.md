# Organization error signatures

## Diagnose organization failures

Most "org-related" failures are configuration, not code. Do not edit components before checking these:

| Error / symptom | Root cause | Fix |
| --- | --- | --- |
| `orgId` / `orgSlug` is `undefined` for a signed-in user | Organizations not enabled for this instance, OR user has no active org (personal account) | Enable in Dashboard → Organizations; check Membership mode; surface `<OrganizationSwitcher />` |
| `has({ permission: ... })` always `false` | An invented slug (`org:manage_members`), or a System Permission (`org:sys_*`), which `has()` can't check | Check the role (`has({ role: 'org:admin' })`) or a custom Permission created in the Dashboard (see roles-permissions.md) |
| `has({ role })` returns `false` but user looks like an admin | Session token stale after role change | Re-sign-in, or refresh the session: `await clerk.session?.reload()` |
| `has({ permission })` `false` even with the role assigned | Feature not attached to active Plan (Billing gates permissions) | Dashboard → Billing → Plans → attach Feature |
| `<OrganizationSwitcher />` doesn't show "Personal Account" | `Membership required` mode is on (the default since Aug 22, 2025) | Dashboard → Organizations settings → `Membership optional` |
| `TaskChooseOrganization` throws "cannot render when a user doesn't have current session tasks" | Rendered outside a `choose-organization` task context | Wrap in a `choose-organization` session-task route only; don't render unconditionally |
| `enterpriseAccounts[0].provider` is `undefined` | Accessing `provider` at the wrong nesting level | Use `user.enterpriseAccounts[0].enterpriseConnection?.provider` |
