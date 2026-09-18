# Transformers

A transformer maps one platform's export onto Clerk's user schema. Seven ship with the CLI. For anything else you write a small file and pass it with `--transformer-file` — you do not edit, fork, or clone anything.

```sh
clerk migrate transformers list          # the built-ins
clerk migrate transformers list --json   # same, machine-readable
```

## What the built-ins map

Every transformer maps a source field to `userId`, which becomes the Clerk user's `external_id` — that is what makes a migration re-runnable and what `clerk migrate delete` matches on.

The mapping that matters most is **how each platform records verification**, because an identifier the source never confirmed must not land in Clerk's primary field: Clerk creates primary identifiers already verified, so an unconfirmed address sent there is silently promoted. Unverified values are routed to `unverifiedEmailAddresses` / `unverifiedPhoneNumbers` instead.

| Transformer  | `userId` from | Verification signal                              | Style     | Password                     |
| ------------ | ------------- | ------------------------------------------------ | --------- | ---------------------------- |
| `clerk`      | `id`          | Already split into verified/unverified arrays    | —         | `password_digest` + `password_hasher` |
| `auth0`      | `user_id`     | `email_verified`, `phone_verified`               | boolean   | `passwordHash`, bcrypt       |
| `supabase`   | `id`          | `email_confirmed_at`, `phone_confirmed_at`       | timestamp | `encrypted_password`, bcrypt |
| `authjs`     | `id`          | `email_verified`                                 | timestamp | none                         |
| `betterauth` | `user_id`     | `email_verified`, `phone_number_verified`        | boolean   | `password_hash`, bcrypt      |
| `firebase`   | `localId`     | `emailVerified`                                  | boolean   | `passwordHash` + `passwordSalt`, `scrypt_firebase` |
| `workos`     | `id`          | `email_verified`                                 | boolean   | none — WorkOS returns no digest, so no hasher default |

- **Boolean style** treats `true`, `1`, `"true"` and `"1"` as verified — and, importantly, the string `"false"` as *not* verified, which is what a CSV export produces.
- **Timestamp style** treats any real date as verified; `""`, `null` and `\N` are not.

Beyond identifiers:

- **`clerk`** carries the most across, because both ends share a schema: every identifier list, username, names, TOTP secret, backup codes, all three metadata blocks, and account state — `created_at`, `legal_accepted_at`, `banned`, and the organization/self-delete permissions. A dev → production migration keeps original signup dates rather than stamping everyone with today.
- **`auth0`** maps `user_metadata` → `publicMetadata` and `app_metadata` → `privateMetadata`, `given_name`/`family_name` → first and last name.
- **`supabase`** maps `raw_user_meta_data` → `publicMetadata`, and recovers a first/last name from the metadata display name when the columns are empty. Discord's `#1234` discriminator is stripped.
- **`authjs`** and **`betterauth`** split a single `name` column into first and last name.
- **`workos`** maps `first_name`/`last_name`, `metadata` → `publicMetadata`, and `created_at`. WorkOS has no phone or username, so there is nothing else to carry. The optional `identities` array from `--with-identities` is informational only — it is not imported.
- **`firebase`** splits `displayName`, and combines `passwordHash` with `passwordSalt` and the project's four hash parameters into one digest. A user with a hash but no salt (or the reverse) has both dropped — half a credential produces an account nobody can sign in to.

Summarize the relevant rows for the user before importing. The verification column is the one worth spelling out.

## Writing one for another platform

Do this when the file matches no signature in the routing table and the fields are clearly not one of the seven. Ask first — a custom transformer is a file the user has to keep.

### Ask these five questions before writing anything

1. **Email verification** — is there a field that records it? If not, should emails be treated as verified or unverified? (Unverified is the safe answer, and it is not reversible in the other direction.)
2. **Phone verification** — same question, if there are phone numbers.
3. **Password hasher** — what produced the digest? A `$2a$`/`$2b$` prefix is bcrypt; `$argon2id$` is argon2id. Guessing wrong imports credentials that verify against nothing.
4. **Shape** — is the JSON wrapped (`{ "users": [...] }`)? Does the CSV have a header row?
5. **Metadata** — which fields belong in `publicMetadata` (client-readable) versus `privateMetadata` (server-only)?

### The file

It lives in the **user's** project and is imported at runtime. It is plain data with a default export:

```ts
export default {
  key: "myplatform",
  label: "My Platform",
  description: "Exports from My Platform's admin console.",
  transformer: {
    account_ref: "userId", // required — becomes the Clerk user's external_id
    contact_email: "email",
    email_ok: "emailVerified", // a scratch field, read by postTransform below
    given: "firstName",
    family: "lastName",
    pw_bcrypt: "password",
    profile: "publicMetadata",
  },
  defaults: { passwordHasher: "bcrypt" },
  postTransform: (user) => {
    // Route unverified emails away from the primary field, then drop the
    // scratch field so validation does not strip it silently.
    if (user.emailVerified !== true && user.email) {
      user.unverifiedEmailAddresses = user.email;
      delete user.email;
    }
    delete user.emailVerified;
  },
};
```

Run it with:

```sh
clerk migrate import --transformer-file ./my-platform.ts --file users.json
clerk migrate transformers list --transformer-file ./my-platform.ts   # verify it loads
```

TypeScript works — Bun's transpiler is part of the runtime — and so does plain `.js`.

### Four rules that are easy to get wrong

1. **No imports.** The file cannot import helpers from the CLI; a compiled binary has nothing to import from. Anything `postTransform` needs must be written inline, as above.
2. **Something must map to `userId`.** The CLI refuses to load a transformer without it. Without `external_id`, a migration cannot be re-run and `clerk migrate delete` cannot undo it.
3. **Do not edit a registry.** There is no source tree to register in, and nothing breaks by not registering. If you find instructions saying registration is mandatory or that `delete` will fail without it, they describe the old standalone tool.
4. **`--transformer-file` and `--transformer` are mutually exclusive.** Both name a transformer; pass one.

### Preprocessing wrapped or headerless files

Use `preTransform` when the file is not a flat array of user objects:

```ts
preTransform: (filePath, fileType) => {
  if (fileType === "application/json") {
    const parsed = JSON.parse(require("node:fs").readFileSync(filePath, "utf-8"));
    return { filePath, data: Array.isArray(parsed) ? parsed : parsed.users };
  }
  return { filePath };
},
```

Return `{ filePath }` to leave the file alone, or `{ filePath, data }` to supply the parsed users directly.

### Hook signatures

| Hook            | Signature                                               | Notes                                                         |
| --------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| `preTransform`  | `(filePath, fileType) => { filePath, data? }`           | May be `async`. Runs before field mapping.                    |
| `postTransform` | `(user, context) => void`                               | Mutates one mapped user. `context.firebaseHashConfig` is only set for Firebase runs. |

`description` is optional for a custom transformer and defaults to `Custom transformer`.

### Load errors

The CLI validates the file before using it and names the specific problem:

| Message                                          | What to fix                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| `No transformer file at …`                       | Wrong path — it resolves against the current directory.               |
| `has no default export. Found named export …`    | Use `export default`, not a named export.                             |
| `Could not load …: Expected identifier …`        | A syntax error in the file.                                           |
| `no source field maps to userId`                 | Add the mapping. Nothing works without it.                            |
| `key is "clerk", which is already a built-in`    | Pick a different `key`.                                               |
| `postTransform must be a function when present`  | A hook was set to something that is not a function.                   |

## Schema fields to map onto

Anything not in this schema is dropped during validation, so target these names exactly.

| Field                                                    | Notes                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| `userId`                                                 | **Required.** Becomes `external_id`.                         |
| `email`, `emailAddresses`, `unverifiedEmailAddresses`    | String or array. Primary, additional, unverified.            |
| `phone`, `phoneNumbers`, `unverifiedPhoneNumbers`        | Same shape, for phone numbers.                               |
| `username`, `firstName`, `lastName`                      | Strings.                                                     |
| `password`, `passwordHasher`                             | The hasher is required whenever a password is present.       |
| `totpSecret`, `backupCodesEnabled`, `backupCodes`        | Two-factor state.                                            |
| `publicMetadata`, `privateMetadata`, `unsafeMetadata`    | Objects. `unsafe` is client-**writable** — never trust it.   |
| `createdAt`, `legalAcceptedAt`                           | Date strings. `createdAt` preserves original signup dates.   |
| `banned`, `createOrganizationEnabled`, `createOrganizationsLimit`, `deleteSelfEnabled`, `bypassClientTrust`, `skipLegalChecks`, `skipPasswordChecks` | Account state, passed through to the API. |

Every user must end up with at least one identifier — email, phone, or username. Users that do not are logged as validation failures and skipped rather than failing the run.

`passwordHasher` must be one of: `argon2i`, `argon2id`, `awscognito`, `bcrypt`, `bcrypt_peppered`, `bcrypt_sha256_django`, `hmac_sha256_utf16_b64`, `ldap_ssha`, `md5`, `md5_phpass`, `md5_salted`, `pbkdf2_sha1`, `pbkdf2_sha256`, `pbkdf2_sha256_django`, `pbkdf2_sha512`, `pbkdf2_sha512_hex`, `scrypt_firebase`, `scrypt_werkzeug`, `sha256`, `sha256_salted`, `sha512_symfony`. An unrecognized value aborts the run rather than importing credentials nobody can use.

## After writing one

1. `clerk migrate transformers list --transformer-file ./my-platform.ts` — confirms it loads. It lists the file as `myplatform  My Platform (custom — ./my-platform.ts)` and ends `7 built-in transformers plus 1 loaded from --transformer-file`. Add `--json` to see which source field maps to `userId`.
2. Summarize the mapping for the user, verification rules included.
3. Follow [Step 3 of the import flow](../SKILL.md#step-3-get-confirmation-then-run): get a yes first, and run **without `-y`** so the Migration Readiness report prints. It is the fastest way to find out the mapping produced users the destination won't accept.
