# Sources

A source maps one platform's export onto Clerk's user schema, and declares what it brings across. Seven ship with the CLI. For anything else, write a small file in the user's project and pass it with `--source ./my-source.ts`. Do not edit, fork, or clone anything.

```sh
clerk migrate sources                   # the built-ins, with what each carries
clerk migrate sources betterauth        # one in full: export command, field mapping, caveats
clerk migrate sources ./my-source.ts    # check a source you wrote
clerk migrate sources --json
```

`--source` takes a built-in key, or a path: a value starting with `./`, `../` or `/`, or ending in `.ts`, `.js` or `.mjs`, loads as a custom source. An unknown key exits `2` with the valid keys. A file `clerk migrate export` wrote names its own source and needs no `--source`.

## What the built-ins carry

| Source       | Passwords | MFA     | Metadata |
| ------------ | --------- | ------- | -------- |
| `clerk`      | partial   | partial | yes      |
| `auth0`      | partial   | no      | yes      |
| `authjs`     | no        | no      | no       |
| `betterauth` | yes       | no      | no       |
| `firebase`   | yes       | no      | no       |
| `supabase`   | yes       | no      | partial  |
| `workos`     | no        | no      | yes      |

Run `clerk migrate sources <key>` for the note behind each level and where every field lands. Summarize the relevant rows for the user before importing.

**Social sign-ins are never copied**, by any source. Tell the user to enable the same providers in Clerk: a user who signs in with one is linked to their imported account by verified email. See [account linking](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/account-linking).

### Verification

Every source maps a field to `userId`, which becomes the Clerk user's `external_id`. Re-runs and `clerk migrate undo` rely on it.

The mapping that matters most is **how each platform records verification**. Clerk creates primary identifiers already verified, so an unconfirmed address sent there is silently promoted. Sources route unverified values to `unverifiedEmailAddresses` / `unverifiedPhoneNumbers` instead.

| Source       | `userId` from | Verification signal                           | Style     | Password                                         |
| ------------ | ------------- | --------------------------------------------- | --------- | ------------------------------------------------ |
| `clerk`      | `id`          | Already split into verified/unverified arrays | n/a       | `password_digest` + `password_hasher` (Dashboard export only) |
| `auth0`      | `user_id`     | `email_verified`, `phone_verified`            | boolean   | `passwordHash`, bcrypt (support request only)    |
| `supabase`   | `id`          | `email_confirmed_at`, `phone_confirmed_at`    | timestamp | `encrypted_password`, bcrypt                     |
| `authjs`     | `id`          | `email_verified`                              | timestamp | none                                             |
| `betterauth` | `user_id`     | `email_verified`, `phone_number_verified`     | boolean   | `password_hash`, detected per user               |
| `firebase`   | `localId`     | `emailVerified`                               | boolean   | `passwordHash` + `passwordSalt`, `scrypt_firebase` |
| `workos`     | `id`          | `email_verified`                              | boolean   | none                                             |

- **Boolean style** treats `true`, `1`, `"true"` and `"1"` as verified, and the string `"false"` (what a CSV export produces) as not verified.
- **Timestamp style** treats any real date as verified. `""`, `null` and `\N` are not.

The import's checks count only verified identifiers toward a required one, so a user whose only email is unverified is rejected when the instance requires an email.

### Metadata

User-editable metadata goes to **`unsafe_metadata`**, Clerk's user-editable block:

- Auth0 `user_metadata` → `unsafeMetadata`; `app_metadata` → `privateMetadata`
- Supabase `raw_user_meta_data` → `unsafeMetadata`; `raw_app_meta_data` is not carried
- WorkOS `metadata` → `unsafeMetadata`
- Clerk keeps all three blocks in place

### Better Auth passwords

Better Auth hashes with its own scrypt by default and lets an app swap in bcrypt or argon2, so the source detects the hasher per user:

| Stored value                | Sent as                                           |
| --------------------------- | ------------------------------------------------- |
| `<32 hex>:<128 hex>`        | `scrypt_werkzeug` (N, r and p written inline)     |
| `$2a$`, `$2b$` or `$2y$`    | `bcrypt`                                          |
| `$argon2id$` or `$argon2i$` | `argon2id` or `argon2i`                           |
| anything else               | dropped                                           |

A dropped password does not reject the user: they import without it and their run line carries `passwordDropped: true`.

Better Auth normalizes a password to NFKC before hashing it, and Clerk hashes it as typed. A password whose NFKC form differs (full-width characters, some ligatures) will not verify, and that user resets it. Mention this when the user base is likely to have non-ASCII passwords.

### Other per-source notes

- **`clerk`** carries the most, because both ends share a schema: every identifier list, username, names, all three metadata blocks, and account state (`created_at`, `legal_accepted_at`, `banned`, organization and self-delete permissions). Users keep their original signup dates. Passwords and MFA come across from a Dashboard export only; `clerk migrate export clerk` cannot read them.
- **`authjs`** and **`betterauth`** split a single `name` column into first and last name. Better Auth also carries the admin plugin's `banned` flag.
- **`workos`** has no phone or username. The `identities` array from `--with-identities` is informational only.
- **`firebase`** combines `passwordHash`, `passwordSalt` and the project's four hash parameters into one digest. A user with a hash but no salt (or the reverse) has both dropped.

## Writing a source

Do this when the file matches no signature in the routing table. Ask first: a custom source is a file the user keeps in their project.

### Ask these five questions before writing anything

1. **Email verification.** Which field records it? If none, should emails count as verified or unverified? Unverified is the safe answer.
2. **Phone verification.** Same question, if there are phone numbers.
3. **Password hasher.** What produced the digest? A `$2a$`/`$2b$` prefix is bcrypt; `$argon2id$` is argon2id. A wrong guess imports credentials that verify against nothing.
4. **Shape.** Is the JSON wrapped (`{ "users": [...] }`)? Does the CSV have a header row?
5. **Metadata.** Which fields go to `unsafeMetadata` (user-editable), `publicMetadata` (client-readable, server-writable) or `privateMetadata` (server-only)?

### The file

The CLI imports it at runtime. It is plain data with a default export. Its field map sends each field in the export to a Clerk field, and `carries` is **required**:

```ts
export default {
  key: "myplatform",
  label: "My Platform",
  description: "Exports from My Platform's admin console.",
  transformer: {
    account_ref: "userId", // required: becomes the Clerk user's external_id
    contact_email: "email",
    email_ok: "emailVerified", // a scratch field, read by postTransform below
    given: "firstName",
    family: "lastName",
    pw_bcrypt: "password",
    profile: "unsafeMetadata",
  },
  carries: {
    passwords: { level: "yes", note: "bcrypt hashes from the pw_bcrypt column." },
    mfa: { level: "no", note: "Not exported." },
    metadata: { level: "yes", note: "profile → unsafe metadata." },
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

`carries` has three keys, `passwords`, `mfa` and `metadata`, each `{ level: "yes" | "no" | "partial", note }`. `clerk migrate sources ./my-platform.ts` shows it back.

Check it, then dry-run:

```sh
clerk migrate sources ./my-platform.ts
clerk migrate import users.json --source ./my-platform.ts --dry-run
```

TypeScript works (Bun's transpiler is part of the runtime), and so does plain `.js`. The run records the source's key and a hash of the file, so an edited source counts as a different source when re-running.

### Rules that are easy to get wrong

1. **No imports.** The file cannot import helpers from the CLI; a compiled binary has nothing to import from. Write anything `postTransform` needs inline.
2. **Something must map to `userId`.** The CLI refuses a source without it. Without `external_id`, a migration cannot be re-run or undone.
3. **Declare `carries`.** The CLI refuses a source without it.
4. **Do not edit a registry.** There is no source tree to register in. Instructions that say registration is mandatory describe the old standalone tool.

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

| Hook            | Signature                                     | Notes                                                         |
| --------------- | --------------------------------------------- | ------------------------------------------------------------- |
| `preTransform`  | `(filePath, fileType) => { filePath, data? }` | May be `async`. Runs before field mapping.                    |
| `postTransform` | `(user, context) => void`                     | Mutates one mapped user. `context.firebaseHashConfig` is set only for Firebase runs. |

`description` is optional and defaults to `Custom source`.

### Load errors

The CLI validates the file before using it and names the problem:

| Message                                          | What to fix                                                  |
| ------------------------------------------------ | ------------------------------------------------------------ |
| `No source file at …`                            | Wrong path; it resolves against the current directory.       |
| `has no default export. Found named export …`    | Use `export default`, not a named export.                    |
| `Could not load …: Expected identifier …`        | A syntax error in the file.                                  |
| `no source field maps to userId`                 | Add the mapping.                                             |
| `` `carries` must say what the source brings across `` | Add `carries` with all three keys.                     |
| `key is "clerk", which is already a built-in`    | Pick a different `key`.                                      |
| `postTransform must be a function when present`  | A hook was set to something that is not a function.         |

## Schema fields to map onto

Validation drops anything not in this schema, so target these names exactly.

| Field                                                    | Notes                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| `userId`                                                 | **Required.** Becomes `external_id`.                         |
| `email`, `emailAddresses`, `unverifiedEmailAddresses`    | String or array. Primary, additional, unverified.            |
| `phone`, `phoneNumbers`, `unverifiedPhoneNumbers`        | Same shape, for phone numbers.                               |
| `username`, `firstName`, `lastName`                      | Strings.                                                     |
| `password`, `passwordHasher`                             | The hasher is required whenever a password is present.       |
| `totpSecret`, `backupCodesEnabled`, `backupCodes`        | Two-factor state.                                            |
| `unsafeMetadata`, `publicMetadata`, `privateMetadata`    | Objects. `unsafe` is client-**writable**; never trust it.    |
| `createdAt`, `legalAcceptedAt`                           | Date strings. `createdAt` preserves original signup dates.   |
| `banned`, `createOrganizationEnabled`, `createOrganizationsLimit`, `deleteSelfEnabled`, `bypassClientTrust`, `skipLegalChecks`, `skipPasswordChecks` | Account state, passed through to the API. |

Every user needs at least one identifier: email, phone, or username. The import's checks reject users without one.

`passwordHasher` must be one of: `argon2i`, `argon2id`, `awscognito`, `bcrypt`, `bcrypt_peppered`, `bcrypt_sha256_django`, `hmac_sha256_utf16_b64`, `ldap_ssha`, `md5`, `md5_phpass`, `md5_salted`, `pbkdf2_sha1`, `pbkdf2_sha256`, `pbkdf2_sha256_django`, `pbkdf2_sha512`, `pbkdf2_sha512_hex`, `scrypt_firebase`, `scrypt_werkzeug`, `sha256`, `sha256_salted`, `sha512_symfony`. An unrecognized value aborts the run before anything is sent.

## After writing one

1. `clerk migrate sources ./my-platform.ts` confirms it loads and shows the mapping and `carries`.
2. Summarize the mapping for the user, verification rules included.
3. Follow [the import flow](../SKILL.md#step-3-dry-run) from the dry run: relay the checks, get a yes, then import with `--yes`.
