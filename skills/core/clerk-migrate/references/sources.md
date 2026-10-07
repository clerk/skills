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

### Ask these six questions before writing anything

Ask all six in one turn, every time, even when the file seems to answer one. For each, say what the data shows and ask the user to confirm it.

1. **Email verification.** Which field records it? Look in the data first: a boolean, a timestamp (`confirmed_at` set means verified), a status, or a bitmask. Ask about every email field, secondary ones included. Default to unverified only when the data has no signal at all.
2. **Phone verification.** The same, if there are phone numbers. Also ask which country national-format numbers belong to.
3. **Password hasher.** What produced the digest? See [Password hashes](#password-hashes). A wrong guess imports credentials that verify against nothing.
4. **Shape.** Is the JSON wrapped (`{ "users": [...] }`)? Does the CSV have a header row?
5. **Metadata.** Which fields go to `publicMetadata`, `privateMetadata` or `unsafeMetadata`? See [Metadata](#metadata).
6. **Account state.** Which fields mark a user banned, disabled, locked or suspended, and which mark a deleted user? Check status strings, flag arrays and bitmasks, and ask about every flag or bit whose meaning the data doesn't show.
   - Any state that stops a user signing in imports as `banned: true`: banned, disabled, suspended, locked, even a temporary lock. The import can't create a locked user, and an admin can unban later.
   - Use `skipReason` only for users the data marks as gone (deleted, anonymized), or a group the user names by a field (test accounts). Never for a state that only stops sign-in. See [Leaving users out](#leaving-users-out).

### Check every answer against the file

Before you act on an answer, compare it with the data. When they disagree, say what you see and ask once whether to follow the data:

- told "argon2id", but every digest starts with `$2b$`: the hashes are bcrypt
- told "they're all US numbers", but a `region` column holds `GB` and `DE`: use the region
- told "everyone is verified", but `emailConfirmed` is `false` for some users: those stay unverified
- told to drop some users, but nothing in the data marks them: ask which field does
- told to skip users the data marks `suspended` or `locked`: import them banned, since the data doesn't say deleted

When the file carries an explicit signal (a hash prefix, a verified flag, a region column, a status value), the data wins, even if the user repeats their answer after seeing the conflict. A `$2b$` digest is bcrypt whatever anyone remembers, and a `GB` number is not a US number. Follow the user only where the file is silent. Don't stop the migration over a disagreement, and list each conflict and how you settled it in your summary.

### Metadata

Each Clerk metadata field has a different audience:

| Field | Read by | Written by | Put here |
| --- | --- | --- | --- |
| `publicMetadata` | the browser and the server | the server | display settings, plan names, roles |
| `privateMetadata` | the server only | the server | CRM and billing IDs, internal notes, risk scores |
| `unsafeMetadata` | the browser and the server | the user | preferences the user changes themselves |

Unwrap containers, not values. Don't keep an object named after the provider or the export column: `{ gatekeep: { attrs: { plan } } }` goes in as `{ plan }`. Don't store a packed string as-is. Parse it first: a JSON string becomes its keys, and `k=v;k=v` becomes one key per pair. Then place each key on its own. A value that is structured in its own right, such as `address: { city, zip }`, stays nested. The customer's app reads metadata by path, so list every key you moved in your summary.

Never drop a metadata field you can't place. When unsure, use `privateMetadata`: nothing leaks from there, and the user can move it later. A field the export calls `internal`, `admin` or `app` belongs in `privateMetadata`.

### Password hashes

Work out the format from the digests, then set `passwordHasher`:

| The digest looks like | `passwordHasher` |
| --- | --- |
| `$2a$…`, `$2b$…`, `$2y$…` | `bcrypt` |
| `$argon2id$…`, `$argon2i$…` | `argon2id`, `argon2i` |
| `pbkdf2_sha256$<iterations>$<salt>$<base64 key>` | `pbkdf2_sha256_django` or `pbkdf2_sha256`: see below |
| `pbkdf2:sha256:<iterations>:<salt>:<base64 key>`, or other separators | the same: rebuild it as `pbkdf2_sha256$…` first |
| `pbkdf2:sha256:<iterations>$<salt>$<hex key>` (Werkzeug, Flask) | `pbkdf2_sha256_django`: the salt is text. Convert the hex key to base64 and rebuild it as `pbkdf2_sha256$…` |

- **Strip wrapper prefixes.** `bcrypt:$2b$10$…` goes in as `$2b$10$…`.
- **PBKDF2-SHA256: pick the hasher by how the old system used the salt.** Both hashers take the same string, `pbkdf2_sha256$<iterations>$<salt>$<base64 key>`, and differ only in how they read the salt. A wrong pick still imports, then fails at every sign-in, and the import's checks can't catch it.
  - The salt was hashed as the text it is (Django, and most apps that store a readable salt): use `pbkdf2_sha256_django`, with the salt exactly as stored.
  - The salt is base64 of the random bytes that were hashed: use `pbkdf2_sha256`, with the salt still in base64.
  - Ask the user when the export doesn't say. A salt that isn't valid base64 can only be text.
  - If the user can't tell, read the salts. When no salt in the export contains `+`, `/`, `=`, `-` or `_`, they're text: use `pbkdf2_sha256_django`. Random base64, standard or URL-safe, across a dozen or more salts would almost certainly include one of those characters. Drop the passwords only when the salts still leave it open, such as a handful of users, or some salts with any of those characters.
- **PBKDF2 limits.** The key must be 32 bytes, which is 44 base64 characters. Convert a hex key to base64. Iterations must be 2,000,000 or fewer.
- **Rebuild split formats.** An export that keeps PBKDF2-SHA256 in parts (iterations, salt, key) goes into Clerk as the one string above.
- **Detect the hasher per user.** One export can mix formats.
- **No match:** leave the password out, set `passwordDropped: true`, and tell the user those users will reset their password. Don't guess a hasher.

### Common export shapes

- **Phones** go into Clerk as E.164 (`+447911123456`). Strip spaces, dashes and brackets, and add the country code. A national number (`07911 123456`) needs its country: use a region column if there is one, and never assume `+1`. Drop the trunk prefix where the country uses one (the leading `0` in the UK, Germany or France), but not in Italy, where the `0` stays (`06 1234 5678` is `+390612345678`).
- **Names.** `"First Last"` splits on the first space. `"Last, First"` splits on the comma. A single word is a first name.
- **One column, mixed identifiers** (a `login` holding an email, a phone or a username): classify each value. An `@` means email; digits and phone punctuation mean phone; anything else is a username.
- **Several emails or phones per user:** keep them all, and put the one the export marks as primary first. The CLI makes the first verified email or phone the primary and adds the rest to the user.
- **Unix timestamps:** 10 digits are seconds, 13 are milliseconds. Convert them to an ISO string for `createdAt`.

### Leaving users out

To leave a user out (deleted, anonymous, a test account), set `user.skipReason` in `postTransform`. The import's checks reject that user with your reason, and the run lists them.

A skipped user is a reject, and any reject stops the import unless `--allow-partial` is passed. Say so in your summary: with the user's yes, import with `--allow-partial`, and each skipped user is recorded in the run with your reason.

Don't filter rows out in `preTransform`: a removed row disappears without a trace, and nobody can tell later why the user is missing.

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
    profile: "publicMetadata", // shown in the app, edited only by the server
  },
  carries: {
    passwords: { level: "yes", note: "bcrypt hashes from the pw_bcrypt column." },
    mfa: { level: "no", note: "Not exported." },
    metadata: { level: "yes", note: "profile → public metadata." },
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
5. **Leave users out with `skipReason`,** never by removing rows. See [Leaving users out](#leaving-users-out).

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
| `skipReason`                                             | Leave this user out, with why. The checks report it; never sent to Clerk. |
| `passwordDropped`                                        | Set with no `password` when a digest has no supported hasher. |

Every user needs at least one identifier: email, phone, or username. The import's checks reject users without one.

`passwordHasher` must be one of: `argon2i`, `argon2id`, `awscognito`, `bcrypt`, `bcrypt_peppered`, `bcrypt_sha256_django`, `hmac_sha256_utf16_b64`, `ldap_ssha`, `md5`, `md5_phpass`, `md5_salted`, `pbkdf2_sha1`, `pbkdf2_sha256`, `pbkdf2_sha256_django`, `pbkdf2_sha512`, `pbkdf2_sha512_hex`, `scrypt_firebase`, `scrypt_werkzeug`, `sha256`, `sha256_salted`, `sha512_symfony`. An unrecognized value aborts the run before anything is sent.

## After writing one

1. `clerk migrate sources ./my-platform.ts` confirms it loads and shows the mapping and `carries`.
2. Check the output. Take one row of each kind (email-only, phone-only, banned, deleted, each hash format), run it through your mapping and `postTransform` (a few lines of `bun -e`, or `npx tsx -e` without Bun, that import the file), and read every field: identifiers and their verification, names, password and hasher, metadata, `banned`, `skipReason`.
3. Summarize the mapping for the user, verification rules included.
4. Follow [the import flow](../SKILL.md#step-3-dry-run) from the dry run: relay the checks, get a yes, then import with `--yes`.
