# Exporting users

`clerk migrate export <platform>` pulls users out of a source platform and writes a file that `clerk migrate import --transformer <platform>` reads unedited. Same platform key on both sides, every time.

```sh
clerk migrate export                    # picker, human terminals only
clerk migrate export supabase --db-url "postgres://…"
```

In agent mode the bare picker is a usage error that lists the platforms — always pass one.

## Where the file goes

Every export proposes `./exports/<platform>-export-<YYYYMMDD-HHmm>.json` (local time, to the minute, so a second export never overwrites the first). What happens to that proposal depends on how the command runs:

| Run                      | Behavior                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| Human, no `--output`     | Asked before anything is fetched, with the proposal prefilled — Enter takes it                       |
| Agent mode, no `--output`| Takes the proposal silently, with or without `-y`                                                    |
| `-y` outside agent mode  | **Fails**, naming `--output` and printing the full command with the proposed path, to run again      |
| `--output <path>`        | Writes there, resolved against the current directory                                                 |

Passing `--output` yourself is the least surprising choice. Every export also writes `logs/export-<timestamp>.log`, and ends by printing the exact `clerk migrate import` command for the file it wrote.

## What each platform needs

| Platform     | Credentials                                                     | Environment variables                                    | Passwords                        |
| ------------ | --------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------- |
| `clerk`      | Resolved by the CLI, or `--secret-key` / `--app` / `--instance`  | `CLERK_SECRET_KEY`                                       | **Not exportable**               |
| `auth0`      | `--domain`, `--client-id`, `--client-secret`                    | `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` | **Not exportable**               |
| `workos`     | `--api-key` (the `sk_…` secret key)                             | `WORKOS_API_KEY`                                         | **Not exportable**               |
| `supabase`   | `--db-url`                                                      | `SUPABASE_DB_URL`                                        | bcrypt digests included          |
| `authjs`     | `--db-url`                                                      | `AUTHJS_DB_URL`                                          | none — Auth.js stores none       |
| `betterauth` | `--db-url`                                                      | `BETTERAUTH_DB_URL`                                      | bcrypt digests included          |
| `firebase`   | `--service-account <path>`                                      | none                                                     | scrypt digests + four parameters |

Resolution is flag → environment variable (or `.env.clerk-migrate`, `.env.local`, `.env`) → a masked prompt. In agent mode there is no prompt, so pass the flags; a missing credential exits naming every missing one at once. Ask the user for a credential; never guess one, and never write it into a `.env` file on their behalf.

**A rejected credential is asked for again — for humans only.** A connection string, Firebase key, or Auth0 secret that the far end rejects re-prompts in an interactive run, and the rest of the export continues. Agent mode, a non-TTY, and `-y` fail outright instead. If an export fails on a credential, relay the error and ask the user for a corrected value.

## Reading the field coverage report

Every export ends with a coverage table:

```
Field coverage
  ✓ 1247/1247 have an email address
  ! 89/1247 have a phone number
  ✗ 0/1247 have a password (not exportable — see below)
```

`✓` means every user has the field, `!` some, `✗` none. **Say something about the `!` and `✗` rows.** "0/1247 have a password" is the difference between a migration users do not notice and one where every user is locked out until they reset — and it is far cheaper to say so now than after the import.

Three platforms never export passwords — **Clerk, Auth0 and WorkOS** — and all three say so on every run.

## Clerk

```sh
clerk migrate export clerk --app app_source123 --instance dev --output exports/clerk-export.json
```

Pages the whole instance 500 users at a time. **Password digests, TOTP secrets and backup codes are never returned by the API** — only the `*_enabled` booleans. Migrated users must reset their password on the destination.

**Name the source instance.** `--secret-key`, `--app`, `--instance` or an exported `CLERK_SECRET_KEY` are taken as-is. Without one, a human gets a picker of every instance on their account; an **agent gets whatever resolves** — usually the linked project, which is usually the migration's destination. Exporting the destination and importing it back into itself is the failure this rule prevents.

For the full dev → production flow, see [clerk-to-clerk.md](clerk-to-clerk.md).

## Auth0

```sh
clerk migrate export auth0 --domain my-tenant.us.auth0.com --client-id … --client-secret …
```

Needs a machine-to-machine application with the `read:users` scope: Auth0 Dashboard → Applications → APIs → Auth0 Management API → Machine to Machine Applications.

Two limits to state up front:

- **No password hashes.** The Management API does not return them; Auth0 releases them only through a support request. Either add a `passwordHash` field to each user before importing, or migrate without passwords.
- **1000 users maximum.** Auth0 pages this endpoint only through the first 1000. Past that the export stops and says so — use Auth0's bulk export job instead. Do not present a truncated export as the whole tenant.

## WorkOS

```sh
clerk migrate export workos --api-key sk_…
clerk migrate export workos --api-key sk_… --with-identities
```

Needs the secret API key — the one starting `sk_`, from the WorkOS dashboard under **API Keys**. WorkOS is API-only, so there is no `--db-url` option. Pagination is cursor-based, so unlike Auth0 there is no user ceiling.

- **No passwords, no TOTP.** WorkOS accepts password hashes on import and never returns them, and returns TOTP secrets only at enrolment. There is no support-request escape hatch. Every password user resets or signs in through SSO. The coverage table always shows `✗ 0/N have a password (WorkOS returns none)`.
- **`--with-identities` is off by default, and it is not free.** WorkOS has no bulk endpoint for OAuth identities, so it is one extra request per user — 1,000 users means roughly 1,010 requests. Nothing it returns can be imported; it buys an **OAuth providers** block under the coverage table and an `identities` array in the export file. Useful for deciding which social connections to enable in Clerk. Ask before passing it on a large tenant. A human run asks once, defaulting to no.

```
OAuth providers
  GoogleOAuth        2 users
  MicrosoftOAuth     1 user
  no OAuth provider  2 users
  not readable       1 user
```

`not readable` is a lookup that failed, not a user with no providers — report it as such. Provider counts can sum past the user count, since one user can hold two.

Non-interactive runs print progress to stderr every 10 pages and, with `--with-identities`, every 500 users — a long silence is not a hang.

## Supabase

```sh
clerk migrate export supabase --db-url "postgres://postgres:…@db.xxx.supabase.co:5432/postgres"
```

Reads the `auth.users` table directly rather than going through the Admin API, because `encrypted_password` exists only in the database. That is what lets bcrypt digests come across, so users keep their passwords.

Find the connection string in the Supabase dashboard under **Connect**:

- Direct: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` — needs the IPv4 add-on.
- Pooler: `postgres://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres` — works without it, and is the better default.

The export keeps `raw_app_meta_data`, which is what `clerk migrate import --skip-unsupported-providers` reads later to drop users whose only social provider is not enabled on the Clerk instance.

## Auth.js (NextAuth)

```sh
clerk migrate export authjs --db-url "mysql://user:…@127.0.0.1:3306/authjs"
```

Postgres, MySQL, SQLite and libsql/Turso all work. Auth.js has no single schema — Prisma capitalizes the table, Drizzle does not — so the export tries `User`, then `user`, then `users`, and reports which it found.

Auth.js core stores no passwords. Those users arrive with no credentials and will sign in through their OAuth provider or a fresh Clerk flow.

## Better Auth

```sh
clerk migrate export betterauth --db-url "./db.sqlite"
clerk migrate export betterauth --db-url "libsql://app-org.turso.io?authToken=…"   # or set TURSO_AUTH_TOKEN
```

Plugin columns are detected from the live schema rather than assumed, because selecting a column that is not there fails the whole query. Username, admin (`banned`), phone-number and the rest come across when the plugin is installed.

Passwords come from a `LEFT JOIN` onto the credential `account` row — left, so a user who only ever signed in with OAuth is still exported.

## Connection strings (`supabase`, `authjs`, `betterauth`)

`--db-url` accepts `postgres://`, `mysql://`, `libsql://` (Turso) and a SQLite file path. A libsql token comes from `?authToken=` on the URL, or from `TURSO_AUTH_TOKEN` / `LIBSQL_AUTH_TOKEN`. A password pasted in raw with `@`, `#` or `/` in it is percent-encoded for you when the string would not otherwise parse; an already-encoded one is left alone.

Connection strings are redacted in every message the CLI prints (`postgres://***@host/db`), including when the password itself contains an unencoded `@`. Keep them out of your own output too.

## Firebase

```sh
clerk migrate export firebase --service-account ./service-account.json
```

Needs a service account key with the Firebase Authentication Admin role: Firebase console → Project settings → Service accounts → Generate new private key. Without `--service-account`, a human is prompted — the answer can be a path **or the key's JSON pasted whole**, so a key kept in a password manager never has to touch disk. Agent mode names the flag instead. The key is validated before any network call, so downloading the web app config by mistake fails immediately and names the right console page.

**Firebase's scrypt is a modified variant.** A digest is worthless without the project's four hash parameters, so the export reads them from the project and prints the exact import command with them filled in — on **one line**, so it pastes cleanly:

```sh
clerk migrate import -y --transformer firebase --file exports/firebase-export-20260817-1432.json --firebase-signer-key "…" --firebase-salt-separator "…" --firebase-rounds 8 --firebase-mem-cost 14
```

Use that command, but **drop the `-y`** on the first run so the readiness report prints (see [SKILL.md](../SKILL.md#step-3-get-confirmation-then-run)). All four parameters are required as a set — a partial set produces a well-formed digest that verifies against nothing, so users import successfully and then cannot sign in.

To avoid re-passing them, the user can store them with `clerk migrate settings set firebase-signer-key …` (and the other three), which writes the gitignored `.env.clerk-migrate`. The CLI also reads `CLERK_FIREBASE_*` variables and Firebase's own names (`FIREBASE_BASE64_SIGNER_KEY`, `BASE64_SIGNER_KEY`, `ROUNDS`, `MEM_COST`, …). `clerk migrate settings` shows which source won.

Reading the config needs a broader role than listing users. If it is denied, the export still succeeds and points at **Authentication → Users → (⋮) → Password hash parameters**; ask the user to copy the four values from there.

`FIREBASE_AUTH_EMULATOR_HOST` is honoured, so this works against the local emulator too.

## Troubleshooting

| Symptom                                       | Cause and fix                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| "Connection closed" on a database export      | Unreachable host or a closed port. On Supabase, switch to the pooler string or enable the IPv4 add-on. |
| Credentials rejected                          | Check the user and password. If the password contains `@`, `#` or `/`, URL-encode it.                  |
| Table does not exist                          | Supabase: enable Auth and connect as `postgres`. Better Auth: run `npx @better-auth/cli migrate`. Auth.js: run the ORM's migrations. |
| Auth0 `401` / `403`                           | The M2M application is missing the `read:users` scope.                                                 |
| WorkOS key rejected                           | Use the secret API key starting `sk_`, from the right WorkOS environment.                              |
| Firebase `INVALID_CREDENTIAL`                 | Wrong or stale service account key. Download a fresh one for the right project.                        |
| `-y` export fails asking for `--output`       | Expected: `-y` will not choose a file path for you. Pass `--output`.                                   |
| Export succeeded but almost every field is empty | Wrong table or wrong platform. Check the coverage report before importing, not after.                |

## Next step

Every export ends by printing the import command for the file it just wrote. Follow the import flow in [SKILL.md](../SKILL.md#the-import-flow) — do not paste the printed command straight into agent mode without the user's go-ahead.
