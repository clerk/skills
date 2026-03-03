# Permissions Template

Follow this template **exactly** when generating permission types. Do not deviate from the structure, naming, or comments.

## Instructions

1. **Separate system vs custom permissions** — Permissions with keys matching `org:sys_*` are **system** permissions. All others are **custom** permissions.
2. **Group custom permissions by feature** — Extract the feature name from the key pattern `org:<feature>:<action>`. Create a separate named type for each feature group: `type <FeatureName>Permission` (PascalCase the feature name).
3. **Compose types bottom-up:**
   - `SystemPermission` — union of all `org:sys_*` keys
   - `<Feature>Permission` — one type per custom feature group
   - `CustomOrganizationPermission` — `Expand<Feature1Permission | Feature2Permission | ...>`
   - `OrganizationPermission` — `Expand<SystemPermission | CustomOrganizationPermission>`
4. **Use `Expand<T>` utility** — Always include the `Expand` helper at the top. It must be used in `CustomOrganizationPermission` and `OrganizationPermission`.

## Example

```typescript
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

/** type OrganizationRoleSet */
export type OrganizationRoleSet = "role_set:pro" | "role_set:default";

/** type OrganizationRole - union of all roles in all rolesets */
export type OrganizationRole =
	| "org:developer"
	| "org:member"
	| "org:admin";

/** type OrganizationFeature - custom feature */
export type OrganizationFeature =
	| "feature1"
	| "feature2"

/** type SystemPermission */
export type SystemPermission =
	| "org:sys_feature1:action"
	| "org:sys_feature1:action"
	| "org:sys_feature2:action"
	| "org:sys_feature2:action"

/** type <FeatureName>Permission */
export type Feature1Permission =
	| "org:<feature1>:action"
	| "org:<feature1>:action"
export type Feature2Permission =
	| "org:<feature2>:action"
	| "org:<feature2>:action"

/** type CustomOrganizationPermission - all custom/user-generated permissions  */
export type CustomOrganizationPermission = Expand<Feature1Permission | Feature2Permission>;

/** type OrganizationPermission - all permissions including system */
export type OrganizationPermission = Expand<
	SystemPermission | CustomOrganizationPermission
>;
```