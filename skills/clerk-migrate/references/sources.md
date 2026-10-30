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
| `clerk`      | partial   | partial | partial  |
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

The mapping that matters most is **how each platform records verification**. Clerk creates primary identifiers already verified, so an unconfirmed address sent there is silently promoted. Sources route unverified values to `unverifiedEmailAddresses` / `unverifiedPhoneNumbers` instead. With `--reserve-unverified` (and the user's yes), the import creates those as reserved instead: usable for sign-in, and locked to the user.

| Source       | `userId` from | Verification signal                           | Style     | Password                                         |
| ------------ | ------------- | --------------------------------------------- | --------- | ------------------------------------------------ |
| `clerk`      | `id`          | Already split into verified/unverified arrays | n/a       | `password_digest` + `password_hasher` (Dashboard export only) |
| `auth0`      | `user_id`     | `email_verified`, `phone_verified`            | boolean   | `passwordHash`, bcrypt (support request only)    |
| `supabase`   | `id`          | `email_confirmed_at`, `phone_confirmed_at`    | timestamp | `encrypted_password`, bcrypt or argon2           |
| `authjs`     | `id`          | `email_verified` (`0`, `"0"`, the epoch and non-date text are unverified) | timestamp | none                                             |
| `betterauth` | `user_id`     | `email_verified`, `phone_number_verified`     | boolean   | `password_hash`, detected per user               |
| `firebase`   | `localId`     | `emailVerified`. Phones import verified, and `--reserve-unverified` skips them: Firebase has no phone flag, since a user confirms a number by SMS and an admin vouches for one they set | boolean   | `passwordHash` + `salt` (`passwordSalt` in CSV), `scrypt_firebase` |
| `workos`     | `id`          | `email_verified`                              | boolean   | none                                             |

- **Boolean style** treats `true`, `1`, and the strings `true`, `1`, `yes`, `y` and `t` in any case as verified. `false` and its string forms (what a CSV export or `psql` produces) are not.
- **Timestamp style** treats any number, and any string other than `""`, `null`, `nil`, `undefined` or `\N` (in any case), as verified. Only `authjs` also checks that the string is a date.

The import's checks count only verified (or reserved) identifiers toward a required one, so a user whose only email is unverified is rejected when the instance requires an email.

### Metadata

Where each built-in source puts metadata:

- Auth0 `user_metadata` → `unsafeMetadata`; `app_metadata` → `privateMetadata`
- Supabase `raw_user_meta_data` → `unsafeMetadata`; `raw_app_meta_data` is not carried
- WorkOS `metadata` → `privateMetadata`, with WorkOS's `external_id` as `workosExternalId`
- Clerk keeps all three blocks in place from `export clerk`, and moves the app's own `external_id` to `privateMetadata.clerkExternalId`. A Dashboard CSV carries no metadata.

Every import also writes `private_metadata.clerkMigrateRun`, the run ID, onto each user it creates. It replaces any value the export had under that key, and it stays on the user. `undo` uses it.

### Better Auth passwords

Better Auth hashes with its own scrypt by default and lets an app swap in bcrypt or argon2, so the source detects the hasher per user:

| Stored value                | Sent as                                           |
| --------------------------- | ------------------------------------------------- |
| `<32 hex>:<128 hex>`        | `scrypt_werkzeug` (N, r and p written inline)     |
| `$2a$`, `$2b$` or `$2y$`    | `bcrypt`                                          |
| `$argon2id$` or `$argon2i$` | `argon2id` or `argon2i`                           |
| anything else               | dropped                                           |

Only a well-formed digest counts: a bcrypt cost outside 4 to 15, or an argon2 digest outside the limits Clerk verifies, is dropped too.

A dropped password does not reject the user: they import without it and their run line carries `passwordDropped: true`.

Better Auth normalizes a password to NFKC before hashing it, and Clerk hashes it as typed. A password whose NFKC form differs (full-width characters, some ligatures) will not verify, and that user resets it. Mention this when the user base is likely to have non-ASCII passwords.

### Other per-source notes

`clerk migrate sources <key>` prints each source's caveats in full. The ones that change what you tell the user:

- **`clerk`** carries the most, because both ends share a schema: every identifier list, username, names, metadata, and account state (`created_at`, `legal_accepted_at`, `banned`, organization and self-delete permissions). Passwords and MFA come across from a Dashboard export only, which carries no metadata, bans or legal acceptance.
- **Bans.** Auth0 `blocked`, Firebase `disabled`, a Supabase `banned_until` in the future, and a Better Auth ban that has not expired all import as `banned`.
- **Users left out.** Supabase's deleted and anonymous users, Better Auth's anonymous users, and Firebase users with no email or phone are skipped with a reason. They don't stop the import, and they need no `--allow-partial`.
- **Single name fields** are split into first and last name: `name` (`authjs`, `betterauth`, and `auth0` without `given_name`/`family_name`), Firebase's `displayName`, and Supabase's name in user metadata.
- **`workos`** has no phone or username. The `identities` array from `--with-identities` is informational only.
- **`firebase`** combines `passwordHash`, the salt and the project's four hash parameters into one digest.

## Writing a source

Do this when the file matches no signature in SKILL.md's Step 1 table. Ask first: a custom source is a file the user keeps in their project.

### Ask these six questions before writing anything

First, sort every column that could hold a sign-in identifier (`login`, `email`, `user`, `handle`, `contact`) by the shape of its values: an `@` means email, digits and phone punctuation mean phone, anything else is a username. For phone-shaped values, also count how many start with `0` and how many have 11 or more digits. Put the counts in your questions. A column with more than one shape is a mixed identifier column. Route each value by its shape ([Common export shapes](#common-export-shapes)), and don't send the whole column to one field.

Ask all six in one turn, every time, even when the file seems to answer one. For each, say what the data shows and ask the user to confirm it.

1. **Email verification.** Which field records it? Look in the data first: a boolean, a timestamp (`confirmed_at` set means verified), a status, or a bitmask. Ask about every email field, secondary ones included. Default to unverified only when the data has no signal at all.
2. **Phone verification.** The same, if there are phone numbers. Also ask which country national-format numbers belong to.
3. **Password hasher.** What produced the digest? See [Password hashes](#password-hashes). A wrong guess imports credentials that verify against nothing.
4. **Shape.** Is the JSON wrapped (`{ "users": [...] }`)? Does the CSV have a header row?
5. **Metadata.** Which fields go to `publicMetadata`, `privateMetadata` or `unsafeMetadata`? See [Metadata](#metadata).
6. **Account state.** Which fields mark a user banned, disabled, locked or suspended, and which mark a deleted user? Check status strings, flag arrays and bitmasks, and ask about every flag or bit whose meaning the data doesn't show.
   - Any state that stops a user signing in imports as `banned: true`: banned, disabled, suspended, locked, even a temporary lock. The import can't create a locked user, and an admin can unban later.
   - Use `skipReason` only for users the data marks as gone (deleted, anonymized), or a group the user names by a field that says nothing about sign-in (test accounts, staff). A state that stops sign-in imports banned even when the user calls those accounts deleted or gone, because the data records a lock, not a deletion. List that conflict in your summary. See [Leaving users out](#leaving-users-out).

### Check every answer against the file

Before you act on an answer, compare it with the data. When they disagree, say what you see and ask once whether to follow the data:

- told "argon2id", but every digest starts with `$2b$`: the hashes are bcrypt
- told "they're all US numbers", but a `region` column holds `GB` and `DE`: use the region
- told "everyone is verified", but `emailConfirmed` is `false` for some users: those stay unverified
- told to drop some users, but nothing in the data marks them: ask which field does

When the file carries an explicit signal (a hash prefix, a verified flag, a region column, a status value), the data wins, even if the user repeats their answer after seeing the conflict. Follow the user only where the file is silent. A field with no flag of its own is silent: if `emailConfirmed` covers only the primary email and the user says every email is verified, the secondary emails go in verified. The user also wins when they name something that happened outside the system, which the file had no way to record: if support confirmed a number by phone, it goes in verified even though its flag says it isn't. Don't stop the migration over a disagreement, and list each conflict and how you settled it in your summary. When two of the user's answers disagree with each other, follow Safety rule 7 in SKILL.md.

When the user can't answer ("I don't know", "use your judgement"), choose the mapping that keeps every user able to sign in. A handle field becomes `username`, and the dry run then offers username sign-in (and extended special characters for a handle with a dot), each still needing the user's yes. Say in your summary which answers came from the data alone.

### Metadata

Each Clerk metadata field has a different audience:

| Field | Read by | Written by | Put here |
| --- | --- | --- | --- |
| `publicMetadata` | the browser and the server | the server | display settings, plan names, roles |
| `privateMetadata` | the server only | the server | CRM and billing IDs, internal notes, risk scores |
| `unsafeMetadata` | the browser and the server | the user | preferences the user changes themselves |

Unwrap containers, not values. Don't keep an object named after the provider or the export column: `{ gatekeep: { attrs: { plan } } }` goes in as `{ plan }`. Don't store a packed string as-is. Parse it first: a JSON string becomes its keys, and `k=v;k=v` becomes one key per pair. Then place each key on its own. Keep each key's name from the export: `billing.stripe_id` goes in as `stripe_id`, not `stripeId`. Rename one only when the user asks. A value that is structured in its own right, such as `address: { city, zip }`, stays nested. The customer's app reads metadata by path and by name, so list every key you moved in your summary.

Never drop a metadata field you can't place. When unsure, use `privateMetadata`: nothing leaks from there, and the user can move it later. A field the export calls `internal`, `admin` or `app` belongs in `privateMetadata`.

CRM IDs, billing IDs, internal notes and risk scores stay in `privateMetadata` even when the user asks for the field that holds them to be public, because everything in `publicMetadata` reaches every signed-in browser. Put the rest of that field where the user asked, keep those keys private, and say so in your summary.

### Password hashes

Work out the format from the digests, then set `passwordHasher`. "As-is" means the digest goes in unchanged. The [`createUser()` reference](https://clerk.com/docs/reference/backend/user/create-user) documents each hasher's digest format. The dry run rejects a malformed `bcrypt`, `argon2i`/`argon2id`, `scrypt_werkzeug` or `scrypt_firebase` digest. Clerk refuses other hashers' bad digests when it creates the user, with the reason.

| The digest looks like | `passwordHasher` |
| --- | --- |
| `$2a$…`, `$2b$…`, `$2y$…` (cost 4 to 15, 60 characters) | `bcrypt`, as-is |
| bcrypt over the password with an app-wide pepper appended | `bcrypt_peppered`: append `$<pepper>` to the bcrypt digest |
| `bcrypt_sha256$$2b$…` (Django) | `bcrypt_sha256_django`, as-is |
| `$argon2id$v=19$m=…,t=…,p=…$…`, `$argon2i$…` | `argon2id`, `argon2i`, as-is |
| `pbkdf2_sha256$<iterations>$<salt>$<base64 key>` | `pbkdf2_sha256_django` or `pbkdf2_sha256`: see below |
| `pbkdf2:sha256:<iterations>:<salt>:<base64 key>`, or other separators | the same: rebuild it as `pbkdf2_sha256$…` first |
| `pbkdf2:sha256:<iterations>$<salt>$<hex key>` (Werkzeug, Flask) | `pbkdf2_sha256_django`: the salt is text. Convert the hex key to base64 and rebuild it as `pbkdf2_sha256$…` |
| `$pbkdf2-sha256$<iterations>$<salt>$<key>` (passlib, Python) | `pbkdf2_sha256`: passlib hashes the salt's decoded bytes. Salt and key are in passlib's base64: swap `.` for `+` and pad each with `=` to a multiple of 4, then rebuild it as `pbkdf2_sha256$…` |
| `pbkdf2_sha1$<iterations>$<salt>$<base64 key>` (Django) | `pbkdf2_sha1`: rebuild it as `pbkdf2_sha1$<iterations>$<hex salt>$<hex key>$20`. Hex-encode the salt's text, and convert the key from base64 to hex. `20` is the key length in bytes |
| `$pbkdf2$<iterations>$<salt>$<key>` (passlib) | `pbkdf2_sha1`: decode salt and key from passlib's base64 (as above), then rebuild it as `pbkdf2_sha1$<iterations>$<hex salt>$<hex key>$20` |
| PBKDF2-SHA512 with a text salt | `pbkdf2_sha512`: `pbkdf2_sha512$<iterations>$<salt>$<hex key>`, the salt as stored |
| PBKDF2-SHA512 with a random-bytes salt; `$pbkdf2-sha512$…` (passlib) | `pbkdf2_sha512_hex`: `pbkdf2_sha512_hex$<iterations>$<hex salt>$<hex key>`. Decode passlib's base64 (as above) first |
| `$P$…` (WordPress, phpass), `$S$…` (Drupal 7) | `phpass`, as-is |
| `$H$…` (phpBB) | `phpass`: the same algorithm as `$P$`. Replace `$H$` with `$P$` |
| `U$P$…` (Drupal 7, users carried over from Drupal 6) | `md5_phpass`: remove the leading `U` |
| `{SSHA}…` (LDAP) | `ldap_ssha`, as-is |
| `scrypt:<N>:<r>:<p>$<salt>$<hex key>` (Werkzeug, Flask) | `scrypt_werkzeug`, as-is |
| Firebase scrypt | `scrypt_firebase`: use the built-in `firebase` source, which builds the digest |
| 32 hex characters, no salt | `md5`, as-is. Ask first: a salt stored in another column makes a salted hash look the same |
| 64 hex characters, no salt | `sha256`, as-is. Ask first, as for `md5` |
| hex MD5 or SHA-256 of the password with a salt appended | `md5_salted`, `sha256_salted`: `<hex hash>$<salt>`, the salt as stored. A salt prepended to the password has no hasher |
| Symfony's legacy SHA-512 encoder (`password{salt}`, base64 digest) | `sha512_symfony`: `sha512_symfony$<iterations>$<salt>$<base64 digest>`. The salt may hold only letters, digits, `.` and `/` |
| HMAC-SHA256 over the UTF-16LE password, keyed by UTF-16LE text (.NET `Encoding.Unicode`) | `hmac_sha256_utf16_b64`: `hmac_sha256_utf16_b64$<base64 digest>$<key>` |
| AWS Cognito (no digest is exportable) | `awscognito`: `awscognito#<user pool ID>#<app client ID>#<username>`. Clerk checks the password against Cognito at the user's first sign-in. Clerk has to enable this for the instance first: ask the user to contact Clerk support |

- **Strip wrapper prefixes.** `bcrypt:$2b$10$…` goes in as `$2b$10$…`.
- **PBKDF2-SHA256: pick the hasher by how the old system used the salt.** Both hashers take the same string, `pbkdf2_sha256$<iterations>$<salt>$<base64 key>`, and differ only in how they read the salt. A wrong pick still imports, then fails at every sign-in, and the import's checks can't catch it.
  - The salt was hashed as the text it is (Django, and most apps that store a readable salt): use `pbkdf2_sha256_django`, with the salt exactly as stored.
  - The salt is base64 of the random bytes that were hashed: use `pbkdf2_sha256`, with the salt still in base64.
  - Ask the user when the export doesn't say. A salt that isn't valid base64 can only be text.
  - If the user can't tell, read the salts. When no salt in the export contains `+`, `/`, `=`, `-` or `_`, they're text: use `pbkdf2_sha256_django`. Random base64, standard or URL-safe, across a dozen or more salts would almost certainly include one of those characters. Drop the passwords only when the salts still leave it open, such as a handful of users, or some salts with any of those characters.
- **PBKDF2-SHA256 keys are base64.** Convert a hex key to base64.
- **Rebuild split formats.** An export that keeps a digest in parts (iterations, salt, key) goes into Clerk as the one string its row shows.
- **Detect the hasher per user.** One export can mix formats.
- **Not in the table:** the CLI accepts only the hashers it knows, and the `Unknown password hasher` reject lists every one. For a name in that list but not in this table, read its digest format in the [`createUser()` reference](https://clerk.com/docs/reference/backend/user/create-user) and ask the user how the old system built its digests. Use it only when they can describe the format.
- **Still no match:** leave the password out, set `passwordDropped: true`, and tell the user those users will reset their password. Don't guess a hasher.

### Common export shapes

- **Phones** go into Clerk as E.164 (`+447911123456`). Strip spaces, dashes and brackets, and add the country code. A number with no leading `0` and 11 to 15 digits already has its country code and is only missing the `+`: `44-7817-149359` is `+447817149359`, and `1-416-555-0104` is `+14165550104`. A number with 10 digits or fewer (`212-555-0100`) is national and needs its country. A region column, or the user's answer, wins over digit counts. A national number (`07911 123456`) needs its country: use a region column if there is one, and never assume `+1`. Drop the trunk prefix where the country uses one (the leading `0` in the UK, Germany or France), but not in Italy, where the `0` stays (`06 1234 5678` is `+390612345678`).
- **Names.** `"First Last"` splits on the first space. `"Last, First"` splits on the comma. A single word is a first name.
- **One column, mixed identifiers** (a `login` holding an email, a phone or a username): classify each value. An `@` means email; digits and phone punctuation mean phone; anything else is a username.
- **Several emails or phones per user:** keep them all, and put the one the export marks as primary first. The CLI makes the first verified email or phone the primary and adds the rest to the user.
- **Unix timestamps:** 10 digits are seconds, 13 are milliseconds. Convert them to an ISO string for `createdAt`.

### Leaving users out

To leave a user out (deleted, anonymous, a test account), set `user.skipReason` in `postTransform`. The dry run lists these users apart from the rejects, as skipped with your reason. They never stop the import and need no `--allow-partial`. The run records each as `skipped` with `code: "source_skip"`. On their own they leave the run `complete`, so a re-run says "Already imported".

Say in your summary how many users the source skips and why. That's information for the user, not a choice they have to make.

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
    // Runs before the CLI normalizes values, so a CSV's "true" is still a
    // string here. Route unverified emails away from the primary field, then
    // drop the scratch field, or the dry run lists it as "Clerk won't store".
    const verified = [true, 1, "true", "1"].includes(user.emailVerified);
    if (!verified && user.email) {
      user.unverifiedEmailAddresses = user.email;
      delete user.email;
    }
    delete user.emailVerified;
  },
};
```

A `transformer` target that isn't a Clerk field, like `email_ok: "emailVerified"` above, is only a rename. `clerk migrate sources ./my-platform.ts` marks it "not a Clerk field: Clerk won't store it unless postTransform moves it". That's expected for a scratch field that `postTransform` reads and deletes.

`carries` has three keys, `passwords`, `mfa` and `metadata`, each `{ level: "yes" | "no" | "partial", note }`. `clerk migrate sources ./my-platform.ts` shows it back.

Two optional fields: `defaults`, merged into every row before mapping (a row's own value wins), and `caveats`, an array of strings that `clerk migrate sources` prints.

Check it, then dry-run:

```sh
clerk migrate sources ./my-platform.ts
clerk migrate import users.json --source ./my-platform.ts --dry-run
```

TypeScript works (Bun's transpiler is part of the runtime), and so does plain `.js`. The run records the source's key and a hash of the file, so an edited source counts as a different source. A re-run with it, while an import of the same file into the same instance with the earlier version is not undone, exits `2`: undo that run, or pass `--new-run`. The hash covers only the source file, not local files it imports.

To map a `clerk migrate export` run, pass the run ID with your source: `clerk migrate import <export-run-id> --source ./my-platform.ts`. It replaces the export's built-in source and keeps the link to the export run.

### Common mistakes

1. **Nothing from the CLI.** The file cannot import the CLI's helpers; a compiled binary has nothing to import from. Node builtins and the project's own files are fine.
2. **Something must map to `userId`.** The CLI refuses a source without it. Without `external_id`, a migration cannot be re-run or undone.
3. **Declare `carries`.** The CLI refuses a source without it.
4. **Do not edit a registry.** There is no source tree to register in.
5. **Leave users out with `skipReason`,** never by removing rows. See [Leaving users out](#leaving-users-out).
6. **`postTransform` is synchronous.** Do any async work (reading another file, a lookup) in `preTransform`, which may be `async`, and return the rows with the results added as `data`. `preTransform` doesn't run on an envelope, so a source for an export run can't do async work.

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

Return `{ filePath }` to leave the file alone, `{ filePath, data }` to supply the parsed users directly, or `{ filePath, csvHeaders }` to name the columns of a CSV with no header row. `preTransform` does not run on a `clerk migrate export` envelope.

### Hook signatures

| Hook            | Signature                                     | Notes                                                         |
| --------------- | --------------------------------------------- | ------------------------------------------------------------- |
| `preTransform`  | `(filePath, fileType) => { filePath, data?, csvHeaders? }` | May be `async`. Runs before field mapping.       |
| `postTransform` | `(user, context) => void`                     | Mutates one mapped user in place, before values are normalized; the return value is ignored. **Must be synchronous**: an `async` hook, or one that returns a promise, stops the import. Columns the `transformer` doesn't name arrive under their own names. `context.firebaseHashConfig` is set only for an envelope from `export firebase` or `--source firebase`. |

`description` is optional and defaults to `Custom source`.

### Load errors

The CLI validates the file before using it and names the problem, as `<file> is not a valid source: <problem>`. Each message below is the part to look for:

| Message                                          | What to fix                                                  |
| ------------------------------------------------ | ------------------------------------------------------------ |
| `No source file at …`                            | Wrong path; it resolves against the current directory.       |
| `… is a directory, not a source file`            | Point at the file itself.                                    |
| `has no default export. Found named export …`    | Use `export default`, not a named export.                    |
| `the default export is …, not an object`         | Export the source object itself.                             |
| `Could not load …`                               | A syntax error, or an import that fails to resolve.          |
| `` `key` must be a non-empty string `` (or `label`) | Set both.                                                 |
| `` `transformer` must be an object… ``           | The field map is missing or not an object.                   |
| `` `transformer.<field>` must map to a Clerk field name `` | Each value must be a Clerk field name string.      |
| `` no source field maps to `userId` ``           | Add the mapping.                                             |
| `` `carries` must say what the source brings across `` | Add `carries` with all three keys.                     |
| `` `carries.<kind>` must be { level: … } ``     | Give each of `passwords`, `mfa` and `metadata` a `level` (`yes`, `no` or `partial`) and a `note`. |
| `` `key` is "clerk", which is already a built-in source `` | Pick a different `key`.                                      |
| `` `postTransform` must be a function when present `` | A hook was set to something that is not a function.    |
| `` `defaults` must be an object when present ``  | Make `defaults` an object.                                   |
| `` `caveats` must be an array of strings… ``     | Make `caveats` an array of strings.                          |
| `` `description` must be a string when present `` | Make `description` a string.                                |

These stop the import while it maps users:

| Message | What to fix |
| --- | --- |
| `` The "<key>" source's postTransform returned a promise. It must be synchronous… `` | Drop `async` and any `await` from `postTransform`. Move the async work into `preTransform`. |
| `` The "<key>" source's postTransform failed on row N: … `` | The hook threw on that row. Run that row through the hook by hand (see step 2 of [After writing one](#after-writing-one)) and fix the case it misses. |

Both exit `2` and link the CLI's Custom sources docs. A `CliError` the hook throws itself passes through with its own message and code.

## Schema fields to map onto

Validation drops anything not in this schema, and the dry run lists it as `Clerk won't store: …`, so target these names exactly.

| Field                                                    | Notes                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| `userId`                                                 | **Required.** Becomes `external_id`.                         |
| `email`, `emailAddresses`, `unverifiedEmailAddresses`    | String or array. Primary, additional, unverified.            |
| `phone`, `phoneNumbers`, `unverifiedPhoneNumbers`        | Same shape, for phone numbers.                               |
| `username`, `firstName`, `lastName`                      | Strings.                                                     |
| `password`, `passwordHasher`                             | The hasher is required whenever a password is present.       |
| `totpSecret`, `backupCodes`                              | Two-factor state. `backupCodesEnabled` is accepted but not sent. |
| `unsafeMetadata`, `publicMetadata`, `privateMetadata`    | Objects. `unsafe` is client-**writable**; never trust it.    |
| `createdAt`, `legalAcceptedAt`                           | Date strings. `createdAt` preserves original signup dates.   |
| `banned`, `banEndsAt`, `createOrganizationEnabled`, `createOrganizationsLimit`, `deleteSelfEnabled`, `bypassClientTrust`, `skipLegalChecks`, `skipPasswordChecks` | Account state, passed through to the API. `banEndsAt` is not sent: Clerk bans don't expire. |
| `skipReason`                                             | Leave this user out, with why. The checks report it; never sent to Clerk. |
| `socialProviders`                                        | Array of the social providers the user signs in with. Accepted, but never sent to Clerk. |
| `passwordDropped`                                        | Set with no `password` when a digest has no supported hasher. |

The check in [After writing one](#after-writing-one) lists these names. Change both together.

Every user needs at least one identifier: email, phone, or username. The import's checks reject users without one.

`passwordHasher` must be one of the hashers in [Password hashes](#password-hashes). An unrecognized value rejects that user as `invalid: Unknown password hasher "…"`, and the message lists every accepted name.

## After writing one

1. `clerk migrate sources ./my-platform.ts` confirms it loads and shows the mapping and `carries`.
2. Check the output. Take one row of each kind (email-only, phone-only, banned, deleted, each hash format), run it through your mapping and `postTransform` (a few lines of `bun -e`, or `npx tsx -e` without Bun, that import the file), and read every field: identifiers and their verification, names, password and hasher, metadata, `banned`, `skipReason`. Then run every row through the check below. It must print nothing. Build each user as the CLI does: rename the keys your `transformer` names, keep every other column under its own name, drop `""` and `null`, then call `postTransform`. A key Clerk doesn't know (`phoneNumber`, `firstname`, `emailAddress`) is dropped with its value, and the import doesn't stop for it: the dry run only lists it under `Clerk won't store`. Rename it to the Clerk field, or move it in `postTransform`. An email without `@` or a phone that isn't E.164 means a column holds more than one kind of identifier, or a phone still needs its country code (see [Common export shapes](#common-export-shapes)). Do this even when step 1 ran: it's the only check when the CLI isn't available.

   ```js
   const FIELDS = new Set(["userId", "email", "emailAddresses", "unverifiedEmailAddresses", "phone", "phoneNumbers",
     "unverifiedPhoneNumbers", "username", "firstName", "lastName", "password", "passwordHasher", "totpSecret",
     "backupCodes", "backupCodesEnabled", "unsafeMetadata", "publicMetadata", "privateMetadata", "createdAt",
     "legalAcceptedAt", "banned", "banEndsAt", "createOrganizationEnabled", "createOrganizationsLimit",
     "deleteSelfEnabled", "bypassClientTrust", "skipLegalChecks", "skipPasswordChecks", "skipReason", "passwordDropped",
     "socialProviders"]);
   const list = (v) => (v == null ? [] : [v].flat());
   for (const u of users) { // users: every row after your mapping and postTransform
     for (const k of Object.keys(u)) if (!FIELDS.has(k)) console.log(u.userId, "unknown key", k);
     for (const e of [u.email, u.emailAddresses, u.unverifiedEmailAddresses].flatMap(list))
       if (!String(e).includes("@")) console.log(u.userId, "email without @", e);
     for (const p of [u.phone, u.phoneNumbers, u.unverifiedPhoneNumbers].flatMap(list))
       if (!/^\+\d{7,15}$/.test(p)) console.log(u.userId, "phone not E.164", p);
     if (!u.skipReason && ![u.email, u.emailAddresses, u.unverifiedEmailAddresses, u.phone, u.phoneNumbers,
       u.unverifiedPhoneNumbers, u.username].flatMap(list).length) console.log(u.userId, "no identifier");
   }
   ```
3. Summarize the mapping for the user, verification rules included.
4. Follow [the import flow](../SKILL.md#step-3-dry-run) from the dry run: relay the checks, get a yes, then import with `--yes`.
