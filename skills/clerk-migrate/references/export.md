# Exporting users

`clerk migrate export <platform>` pulls users out of a source platform and writes a file that `clerk migrate run --transformer <platform>` reads unedited. Same platform key on both sides, every time.

```sh
clerk migrate export                    # picker, human terminals only
clerk migrate export supabase --db-url "postgres://…"
```

Exports land at `./exports/<platform>-export.json` unless `--output` says otherwise. Every export also writes `./logs/export-<timestamp>.log`.

In agent mode the bare picker is not available — always pass a platform.

## What each platform needs

| Platform     | Credentials                                                     | Environment variables                                  | Passwords                       |
| ------------ | --------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------- |
| `clerk`      | Resolved by the CLI, or `--secret-key` / `--app` / `--instance`  | `CLERK_SECRET_KEY`                                     | **Not exportable**              |
| `auth0`      | `--domain`, `--client-id`, `--client-secret`                    | `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` | **Not exportable**            |
| `supabase`   | `--db-url`                                                      | `SUPABASE_DB_URL`                                      | bcrypt digests included         |
| `authjs`     | `--db-url`                                                      | `AUTHJS_DB_URL`                                        | none — Auth.js stores none      |
| `betterauth` | `--db-url`                                                      | `BETTERAUTH_DB_URL`                                    | bcrypt digests included         |
| `firebase`   | `--service-account <path>`                                      | none                                                   | scrypt digests + four parameters |

Resolution is flag → environment variable → prompt. In agent mode there is no prompt, so pass the flags. Ask the user for a credential; never guess one, and never write it into a `.env` file on their behalf.

## Reading the field coverage report

Every export ends with a coverage table:

```
Field coverage
  ● 1247/1247 have an email address
  ○ 89/1247 have a phone number
  ○ 0/1247 have a password (not exportable — see below)
```

`●` means every user has the field, `○` means some or none do. **Say something about the low rows.** "0/1247 have a password" is the difference between a migration users do not notice and one where every user is locked out until they reset — and it is far cheaper to say so now than after the import.

## Clerk

```sh
clerk migrate export clerk --instance dev --output exports/clerk-export.json
```

Pages the whole instance 500 users at a time. **Password digests, TOTP secrets and backup codes are never returned by the API** — only the `*_enabled` booleans. Migrated users must reset their password on the destination.

For the full dev → production flow, see [clerk-to-clerk.md](clerk-to-clerk.md).

## Auth0

```sh
clerk migrate export auth0 --domain my-tenant.us.auth0.com --client-id … --client-secret …
```

Needs a machine-to-machine application with the `read:users` scope: Auth0 Dashboard → Applications → APIs → Auth0 Management API → Machine to Machine Applications.

Two limits to state up front:

- **No password hashes.** The Management API does not return them; Auth0 releases them only through a support request. Either add a `passwordHash` field to each user before importing, or migrate without passwords.
- **1000 users maximum.** Auth0 caps offset pagination there. Past that the export stops and says so — use Auth0's bulk export job instead. Do not present a truncated export as the whole tenant.

## Supabase

```sh
clerk migrate export supabase --db-url "postgres://postgres:…@db.xxx.supabase.co:5432/postgres"
```

Reads the `auth.users` table directly rather than going through the Admin API, because `encrypted_password` exists only in the database. That is what lets bcrypt digests come across, so users keep their passwords.

Find the connection string in the Supabase dashboard under **Connect**:

- Direct: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` — needs the IPv4 add-on.
- Pooler: `postgres://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres` — works without it, and is the better default.

The export keeps `raw_app_meta_data`, which is what `clerk migrate run --skip-unsupported-providers` reads later to drop users whose only social provider is not enabled on the Clerk instance.

## Auth.js (NextAuth)

```sh
clerk migrate export authjs --db-url "mysql://user:…@127.0.0.1:3306/authjs"
```

Postgres, MySQL and SQLite all work. Auth.js has no single schema — Prisma capitalizes the table, Drizzle does not — so the export tries `User`, then `user`, then `users`, and reports which it found.

Auth.js core stores no passwords. Those users arrive with no credentials and will sign in through their OAuth provider or a fresh Clerk flow.

## Better Auth

```sh
clerk migrate export betterauth --db-url "./db.sqlite"
```

Plugin columns are detected from the live schema rather than assumed, because selecting a column that is not there fails the whole query. Username, admin (`banned`), phone-number and the rest come across when the plugin is installed.

Passwords come from a `LEFT JOIN` onto the credential `account` row — left, so a user who only ever signed in with OAuth is still exported.

## Firebase

```sh
clerk migrate export firebase --service-account ./service-account.json
```

Needs a service account key with the Firebase Authentication Admin role: Firebase console → Project settings → Service accounts → Generate new private key. The file is validated before any network call, so downloading the web app config by mistake fails immediately and names the right console page.

**Firebase's scrypt is a modified variant.** A digest is worthless without the project's four hash parameters, so the export reads them from the project and prints the exact import command with them filled in:

```sh
clerk migrate run --transformer firebase --file exports/firebase-export.json \
  --firebase-signer-key "…" --firebase-salt-separator "…" \
  --firebase-rounds 8 --firebase-mem-cost 14
```

Use that command as printed. All four are required as a set — a partial set produces a well-formed digest that verifies against nothing, so users import successfully and then cannot sign in.

Reading the config needs a broader role than listing users. If it is denied, the export still succeeds and points at **Authentication → Users → (⋮) → Password hash parameters**; ask the user to copy the four values from there.

`FIREBASE_AUTH_EMULATOR_HOST` is honoured, so this works against the local emulator too.

## Troubleshooting

| Symptom                                       | Cause and fix                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| "Connection closed" on a database export      | Unreachable host or a closed port. On Supabase, switch to the pooler string or enable the IPv4 add-on. |
| Credentials rejected                          | Check the user and password. If the password contains `@`, `#` or `/`, URL-encode it.                  |
| Table does not exist                          | Supabase: enable Auth and connect as `postgres`. Better Auth: run `npx @better-auth/cli migrate`. Auth.js: run the ORM's migrations. |
| Auth0 `401` / `403`                           | The M2M application is missing the `read:users` scope.                                                 |
| Firebase `INVALID_CREDENTIAL`                 | Wrong or stale service account key. Download a fresh one for the right project.                        |
| Export succeeded but almost every field is empty | Wrong table or wrong platform. Check the coverage report before importing, not after.                |

Connection strings are redacted in every message the CLI prints, including when the password itself contains an unencoded `@`. Keep them out of your own output too.

## Next step

Every export ends by printing the import command for the file it just wrote. Run that, then follow the import flow in [SKILL.md](../SKILL.md#the-import-flow).
