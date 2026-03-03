# Type Generation Reference

This document explains how to generate `types.ts` and `constants.ts` from Clerk dashboard data using the template assets.

## Templates

| Asset | Output file | Description |
|-------|-------------|-------------|
| [assets/types-template.ts](../assets/types-template.ts) | `types.ts` | Roles, rolesets, permissions (system & custom) |
| [assets/constants-template.ts](../assets/constants-template.ts) | `constants.ts` | Plan slugs, plan IDs, role set mappings |

## Generating `types.ts`

Read [assets/types-template.ts](../assets/types-template.ts) and replace placeholder values with real data from the API.

### Rules

1. **Separate system vs custom permissions** — Keys matching `org:sys_*` are **system** permissions. All others are **custom**.
2. **Group custom permissions by feature** — Extract the feature name from `org:<feature>:<action>`. Create a separate type per feature group: `type <FeatureName>Permission` (PascalCase).
3. **Compose types bottom-up:**
   - `SystemPermission` — union of all `org:sys_*` keys
   - `<Feature>Permission` — one type per custom feature group
   - `CustomOrganizationPermission` — `Expand<Feature1Permission | Feature2Permission | ...>`
   - `OrganizationPermission` — `Expand<SystemPermission | CustomOrganizationPermission>`
4. **Always include the `Expand<T>` utility** at the top of the file.

### Formatting

- **JSDoc comments** — Each type must have a `/** type TypeName */` comment above it.
- **Tabs for indentation** — All union members indented with tabs and prefixed with `|`.

## Generating `constants.ts`

Read [assets/constants-template.ts](../assets/constants-template.ts) and replace placeholder values with real plan data from the API.

### Mappings

- `PLAN_SLUGS` — Map plan display names (UPPER_SNAKE_CASE) to their slug keys
- `PLAN_NAME` — Map plan names to slug keys
- `PLAN_IDS` — Map plan display names to their Clerk plan IDs (`cplan_*`)
- `PLAN_ROLE_SETS` — Map plan slugs to their associated role set keys

### Rules

- The `import type { OrganizationRoleSet } from './types'` import must stay at the top.
- All objects use `as const` for literal type inference.
