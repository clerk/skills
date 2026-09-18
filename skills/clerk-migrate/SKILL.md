---
name: clerk-migrate
description: >-
  Migrate users into Clerk from another auth provider, or between Clerk
  instances, using the `clerk migrate` command family. Use when the user says
  "migrate my users to Clerk", "import users from Auth0 / Supabase / Firebase /
  Auth.js / Better Auth / WorkOS", "export my users", "move users from
  development to production", or hands over a user export file (JSON or CSV)
  and asks what to do with it. Covers exporting from the source platform,
  identifying which transformer fits, writing one for a platform with no
  built-in, running the import, and undoing it.
allowed-tools: Bash, Read, Write, Grep, Glob
license: MIT
compatibility: >-
  Requires the `clerk` CLI binary, v3.4.0 or later (npm package `clerk`, or
  `bunx clerk@latest`). Needs a Clerk session from `clerk auth login`, or a
  Backend API secret key passed with `--secret-key`. No other dependency — do
  not install a migration tool, an SDK, or a database driver.
metadata:
  author: clerk
  version: 1.1.0
---

# Clerk Migrate

`clerk migrate` moves users into a Clerk instance: `clerk migrate import` reads an export from another auth provider, maps it onto Clerk's user schema, validates every record, and creates the users through the Backend API. `clerk migrate export` gets users *out* of the seven supported platforms, so there is a file to import in the first place.

> This skill targets clerk `latest`. The binary is the source of truth — run `clerk migrate <subcommand> --help` to confirm anything this skill claims, and prefer what `--help` says when they disagree.

There is nothing to install and nothing to clone. If you find yourself reaching for a `migration-tool` repo, `bun install`, or a hand-written import script, stop: that is the old way and it no longer applies.

Bare `clerk migrate` is a group name, not a command — it prints help. The direction is always spelled out: `migrate import` moves users **into** Clerk, `migrate export` gets them **out** of a source platform.

## Routing

Find the user's intent in the left column and go straight there.

| The user wants to…                                                                        | Go to                                                          |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Import a file they already have                                                           | [The import flow](#the-import-flow), below                     |
| Get their users out of Auth0, Supabase, Firebase, Auth.js, Better Auth, WorkOS, or Clerk  | [references/export.md](references/export.md)                   |
| Migrate from a platform with no built-in transformer                                      | [references/transformers.md](references/transformers.md)       |
| Move users from one Clerk instance to another (dev → prod)                                | [references/clerk-to-clerk.md](references/clerk-to-clerk.md)   |
| Know which platform a file came from                                                      | [Step 1: identify the platform](#step-1-identify-the-platform) |
| Undo a migration                                                                          | [Undoing a migration](#undoing-a-migration)                    |
| See or change what a run will pick up (transformer, file, Firebase parameters, log dir)   | [Settings](#settings)                                          |
| Read, convert, or clean up the logs                                                       | [Logs](#logs)                                                  |

Users often start mid-flow — "here's my Supabase dump" is an import, "I need to get my users out of Auth0" is an export that ends in an import. Export first, then come back here.

## Invoking the CLI

Bind the invocation once at the start of the session:

```sh
command -v clerk >/dev/null 2>&1 && clerk --version
```

If that prints v3.4.0 or later, use bare `clerk`. Otherwise fall back to a package runner matching the project's lockfile — `bunx clerk@latest`, `npx -y clerk@latest`, `pnpm dlx clerk@latest`, or `yarn dlx clerk@latest`. The published package is **`clerk`**, not `@clerk/cli`.

## Keys and targeting

**Do not create or edit a `.env` file, and do not ask the user to paste a secret key** unless everything below has failed. The CLI resolves a Backend API key on its own:

```sh
clerk auth login          # once, on the user's host shell — opens a browser
clerk doctor --json       # confirms login, link, keys; parse `remedy` on failure
```

Resolution order: `--secret-key` → `--app` + Platform API lookup → `CLERK_SECRET_KEY` in the environment → the keyless project's own key → the linked project from `clerk link`.

`clerk migrate import` checks for a destination **before** it asks anything else. A human who is signed out or unlinked gets the same sign-in-then-link flow `clerk link` runs; an agent gets an error naming whichever half is missing. Relay it — `clerk auth login` has to run on the user's host shell.

To point a command at a specific place, pass `--app <id>` and `--instance dev|prod|<instance_id>` rather than swapping keys around. That is what makes a dev → production migration a two-command job.

The **instance type comes from the key**: `sk_live_…` is production, anything else development. That choice drives the rate limits and the development-instance warning below, so a migration that "runs slowly" on a dev key is behaving correctly.

For anything else CLI-related — auth internals, sandbox caveats, `clerk api` — see the `clerk-cli` skill.

## The import flow

Follow these in order. Do not skip the summary or the confirmation.

### Step 1: identify the platform

Read a sample of the file — the first user object, or the CSV header row — and match it against the signature fields:

| Platform         | Signature fields                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Supabase**     | `encrypted_password`, `email_confirmed_at`, `raw_user_meta_data`, `instance_id`, `aud`, `is_sso_user`                                   |
| **Auth0**        | `user_id` in `provider\|id` form, `email_verified` (boolean), `phone_number`, `phone_verified`, `user_metadata`, `app_metadata`, `given_name`, `family_name` |
| **Firebase**     | `localId`, `passwordHash`, `passwordSalt`, `displayName`, `phoneNumber`, `disabled`                                                    |
| **Clerk**        | `primary_email_address`, `verified_email_addresses`, `password_digest`, `password_hasher`, `primary_phone_number`                       |
| **WorkOS**       | `id` starting `user_`, `email`, `email_verified` (boolean), `first_name`, `last_name`, `metadata`, sometimes `identities` — and no password, phone, or username field |
| **Better Auth**  | `user_id` (UUID), `email_verified` (boolean), `password_hash` with a bcrypt `$2` prefix, `phone_number`, `phone_number_verified`, `display_username` |
| **Auth.js**      | `email_verified`, `name`, `id`, `email` — minimal, and easy to confuse with a custom export                                            |

Three traps worth knowing:

- **A Firebase CSV export has no header row.** If a CSV opens with something like `user123,a@b.com,true,…` and no field names, that is Firebase. The transformer supplies the headers.
- **Auth0 and Better Auth both use `user_id`.** Auth0's contains a `|` (`auth0|abc123`); Better Auth's is a bare UUID.
- **WorkOS and Clerk both use `user_…` IDs.** A Clerk export carries `primary_email_address` and `password_digest`; a WorkOS export has a flat `email` and nothing password-shaped.

If nothing matches, the file is a custom export → [references/transformers.md](references/transformers.md).

Confirm the live platform list rather than trusting this page:

```sh
clerk migrate transformers list --json
```

### Step 2: summarize what will happen

Tell the user, in plain terms:

1. Which transformer you are going to use.
2. What it maps — especially which field decides whether an email or phone counts as **verified**, because that is the mapping that silently changes who can sign in. Per-platform detail is in [references/transformers.md](references/transformers.md#what-the-built-ins-map).
3. Anything the source cannot carry across — Auth0, Clerk and WorkOS exports contain **no password hashes**, so those users will have to reset their password (or, for WorkOS, sign in through SSO).

### Step 3: get confirmation, then run

**Agent mode does not stop to confirm, and there is no dry run.** In agent mode `clerk migrate import` prints the [Migration Readiness report](#the-migration-readiness-report) and then starts writing users immediately — the report arrives too late to act on, and the offer to fix flagged instance settings is skipped. The confirmation is *yours* to get, before you run anything.

Pick one of two paths:

- **Hand the first run to the human (recommended when the instance already has real users, or for any production import).** Give them the command to run in their own terminal — in Claude Code, typing `! <command>` runs it in the session:

  ```sh
  clerk migrate import --transformer supabase --file exports/supabase-export-20260817-1432.json
  ```

  Run by a human, it prints the readiness report, offers to change each flagged instance setting, and waits for a yes. Declining writes nothing to Clerk. Bare `clerk migrate import` with no flags also works for a human — it is a wizard that asks for the transformer and file.

- **Run it yourself** after the user has said yes in the conversation, having seen your Step 2 summary:

  ```sh
  clerk migrate import --transformer supabase --file exports/supabase-export-20260817-1432.json
  ```

  Leave `-y` off so the readiness report still prints, and relay it. `-y` suppresses the report entirely.

Bare `clerk migrate import` with no flags is a usage error in agent mode — always pass `--transformer` and `--file`. Firebase needs four extra flags; see [references/export.md](references/export.md#firebase). A platform with no built-in needs `--transformer-file` instead of `--transformer`.

### Step 4: report the result

1. How many users imported, and how many failed.
2. Validation failures, with the reason — these are users the file could not describe (no identifier, unparseable date, unknown hasher), not Clerk rejecting them.
3. Where the log is (`./logs/import-<timestamp>.log`, unless a different log directory is set — `clerk migrate logs list` prints it), and that `clerk migrate delete` undoes the run.

The command exits non-zero if any user failed, so check the exit code rather than eyeballing the output.

## The Migration Readiness report

Printed by `clerk migrate import` unless `-y` is passed. It cross-references the file against the destination instance's live settings and answers two questions: **who won't be imported**, and **who will arrive incomplete**.

- **Required in Clerk, missing from the file** (an email, phone or username the instance requires) — those users are **not imported**.
- **Password required, user has none** — imported without a password; they reset to sign in.
- **Present in the file, disabled in Clerk** — an attribute the instance has switched off is dropped; a social provider users signed up with is unavailable to them.

The outcome block counts each user once, into the worst outcome that applies, so ✗ / ⚠ / ✓ add up to the file. **Relay it after any field-mapping summary.** A user who sees "12 users will not be imported — no email, which this instance requires" before the import is a user who does not have to undo one.

In a human run the report is followed by a multiselect of fixes — "Make Email optional at sign-up", "Enable Discord sign-in" — applied as one config `PATCH`. Nothing is preselected: a flagged setting is not necessarily a wrong one, and the right fix may be the export instead.

If the instance settings cannot be read, the report degrades to coverage-only and flags nothing — "could not read" is not "switched off". Say which of the two you are looking at.

## Rate limits and the development-instance warning

| Instance                     | Requests per second |
| ---------------------------- | ------------------- |
| Production (`sk_live_…`)     | 100                 |
| Development (`sk_test_…`)    | 10                  |

Rate limiting, backoff and `429` retries are handled for you — a slow-looking run on a dev key is the limit, not a hang. `CLERK_MIGRATE_RATE_LIMIT` and `CLERK_MIGRATE_CONCURRENCY_LIMIT` override the defaults; do not set them unless the user asks.

**Development instances have a 100-user limit by default.** Before importing into one, the run reads the current user count and warns when the file would push it past 100. A human is asked whether to go ahead; `-y` and agent mode proceed on the warning. Users past the limit fail with `You have reached your limit of N users`. Clerk can raise a development instance's limit on request, and the CLI cannot see the raised value — so treat the warning as a question to put to the user, not an error. For a real user base, import into production.

## Undoing a migration

```sh
clerk migrate delete -y
```

Deletes the users the last `clerk migrate import` **in this directory** created, matched on the `external_id` stamped on each one. Nothing else in the instance is touched; IDs with no matching user are skipped and reported.

The record of which migration to undo lives in the CLI's own config, keyed by project — not in a file in the directory — so run it from the same directory as the import. `-y` is required in agent mode. Every attempt is logged to `logs/delete-<timestamp>.log`, with both the source ID and the Clerk ID.

## Settings

`clerk migrate settings` shows what a run in this directory would pick up, and **where each value came from** — flag, environment, `.env.clerk-migrate`, the app's `.env.local`/`.env`, or the CLI config. Reach for it when a run picks up a stale transformer, file, or Firebase parameter.

```sh
clerk migrate settings                                   # list (default), credentials redacted
clerk migrate settings list --json
clerk migrate settings set firebase-rounds 8
clerk migrate settings clear firebase-signer-key         # forget one
clerk migrate settings clear -y                          # forget all, credentials included
```

The eight settings are named after the `clerk migrate import` flag each stands in for: `transformer`, `file`, `skip-unsupported-providers`, `log-dir`, and the four `firebase-*` parameters. Non-secret ones live in the CLI config; the Firebase ones live in `.env.clerk-migrate`, which the CLI gitignores on first write. A bare `settings clear` refuses without `-y` in agent mode — confirm with the user before passing it.

`settings set` is a legitimate way to store the Firebase parameters, because it writes the migration's own gitignored file. It is still a secret — ask before writing it.

## Logs

```sh
clerk migrate logs                 # list, newest first (default)
clerk migrate logs list --json     # same data, machine-readable
clerk migrate logs convert --all   # NDJSON → JSON arrays, for spreadsheets
clerk migrate logs clean -y        # delete local .log files
```

Logs go to `./logs` unless `CLERK_MIGRATE_LOG_DIR` or the `log-dir` setting says otherwise; `logs list` prints the directory it read. The first interactive import, export or delete in a project asks where logs should go and remembers the answer; agent mode and `-y` use `./logs` without saving it.

Each file is named after the command that wrote it: `export-<timestamp>.log`, `import-<timestamp>.log`, `delete-<timestamp>.log`. (Older `migration-*` and `user-deletion-*` names from earlier builds still list as import and delete.)

Logs are NDJSON — one object per line, appended as the run proceeds, so a run killed part-way still leaves a valid record. Grep them directly (`grep -v '"status":"success"' logs/import-*.log`) and only convert when something downstream needs a JSON array.

`clerk migrate logs clean` deletes **local files**. `clerk migrate delete` deletes **users from Clerk**. Do not confuse them in front of a user.

## Safety rules

1. **Confirm before importing.** Agent mode will not ask on your behalf, and the readiness report prints only after the run has committed to writing.
2. **Check the target instance before writing.** Pass `--instance` explicitly for production; do not rely on the default.
3. **Name the source when exporting from Clerk.** In agent mode `clerk migrate export clerk` uses whatever instance resolves — usually the linked project, which is usually the *destination*. Always pass `--app`/`--instance` (or `--secret-key`) for the source.
4. **Never paste a secret key into chat or a file.** Use `clerk auth login`, or let the user set `CLERK_SECRET_KEY` themselves.
5. **Report failures honestly.** A partial import is normal and recoverable; a partial import reported as a success is not.
6. **Resume rather than re-run.** A run that died halfway continues with `--resume-after <last successful source userId>`, taken from the import log. An ID that is not in the file aborts the run rather than re-importing everyone.

## References

- [references/export.md](references/export.md) — getting users out of each platform: credentials, flags, field coverage, troubleshooting.
- [references/transformers.md](references/transformers.md) — what the seven built-ins map, and how to write a transformer for a platform that has none.
- [references/clerk-to-clerk.md](references/clerk-to-clerk.md) — development → production and instance-to-instance migrations.
