// type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// /** type OrganizationRoleSet */
// export type OrganizationRoleSet = "role_set:pro" | "role_set:default";

// /** type OrganizationRole - union of all roles in all rolesets */
// export type OrganizationRole =
// 	| "org:developer"
// 	| "org:member"
// 	| "org:admin";

// /** type OrganizationFeature - custom feature */
// export type OrganizationFeature =
// 	| "feature1"
// 	| "feature2"

// /** type SystemPermission */
// export type SystemPermission =
// 	| "org:sys_feature1:action"
// 	| "org:sys_feature1:action"
// 	| "org:sys_feature2:action"
// 	| "org:sys_feature2:action"

// /** type <FeatureName>Permission */
// export type Feature1Permission =
// 	| "org:<feature1>:action"
// 	| "org:<feature1>:action"
// export type Feature2Permission =
// 	| "org:<feature2>:action"
// 	| "org:<feature2>:action"

// /** type CustomOrganizationPermission - all custom/user-generated permissions */
// export type CustomOrganizationPermission = Expand<Feature1Permission | Feature2Permission>;

// /** type OrganizationPermission - all permissions including system */
// export type OrganizationPermission = Expand<
// 	SystemPermission | CustomOrganizationPermission
// >;
