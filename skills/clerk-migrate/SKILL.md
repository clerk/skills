---
name: clerk-migrate
description: >-
  Migrate users into Clerk from another auth provider, or between Clerk
  instances, using the `clerk migrate` command family. Use when the user says
  "migrate my users to Clerk", "import users from Auth0 / Supabase / Firebase /
  Auth.js / Better Auth", "export my users", "move users from development to
  production", or hands over a user export file (JSON or CSV) and asks what to
  do with it. Covers exporting from the source platform, identifying which
  transformer fits, writing one for a platform with no built-in, running the
  import, and undoing it.
allowed-tools: Bash, Read, Write, Grep, Glob
license: MIT
compatibility: >-
  Requires the `clerk` CLI binary (npm package `clerk`, or `bunx clerk@latest`).
  Needs a Clerk session from `clerk auth login`, or a Backend API secret key
  passed with `--secret-key`. No other dependency — do not install a migration
  tool, an SDK, or a database driver.
metadata:
  author: clerk
  version: 1.0.0
---

# Clerk Migrate

`clerk migrate` moves users into a Clerk instance: it reads an export from another auth provider, maps it onto Clerk's user schema, validates every record, and creates the users through the Backend API. It also exports users *out* of the six supported platforms, so there is a file to import in the first place.

> This skill targets clerk `latest`. The binary is the source of truth — run `clerk migrate <subcommand> --help` to confirm anything this skill claims, and prefer what `--help` says when they disagree.

There is nothing to install and nothing to clone. If you find yourself reaching for a `migration-tool` repo, `bun install`, or a hand-written import script, stop: that is the old way and it no longer applies.

## Routing

Find the user's intent in the left column and go straight there.

| The user wants to…                                             | Go to                                                            |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| Import a file they already have                                | [The import flow](#the-import-flow), below                       |
| Get their users out of Auth0, Supabase, Firebase, Auth.js, Better Auth, or Clerk | [references/export.md](references/export.md)    |
| Migrate from a platform with no built-in transformer            | [references/transformers.md](references/transformers.md)         |
| Move users from one Clerk instance to another (dev → prod)      | [references/clerk-to-clerk.md](references/clerk-to-clerk.md)      |
| Know which platform a file came from                            | [Step 1: identify the platform](#step-1-identify-the-platform)   |
| Undo a migration                                                | [Undoing a migration](#undoing-a-migration)                      |
| Read, convert, or clean up the logs                            | [Logs](#logs)                                                    |
| Migrate but the platform is not in the list                    | [references/transformers.md](references/transformers.md)         |

Users often start mid-flow — "here's my Supabase dump" is an import, "I need to get my users out of Auth0" is an export that ends in an import. Export first, then come back here.

## Invoking the CLI

Bind the invocation once at the start of the session:

```sh
command -v clerk >/dev/null 2>&1 && clerk --version
```

If that prints a version you trust, use bare `clerk`. Otherwise fall back to a package runner matching the project's lockfile — `bunx clerk@latest`, `npx -y clerk@latest`, `pnpm dlx clerk@latest`, or `yarn dlx clerk@latest`. The published package is **`clerk`**, not `@clerk/cli`.

## Keys and targeting

**Do not create or edit a `.env` file, and do not ask the user to paste a secret key** unless everything below has failed. The CLI resolves a Backend API key on its own:

```sh
clerk auth login          # once, on the user's host shell — opens a browser
clerk doctor --json       # confirms login, link, keys; parse `remedy` on failure
```

Resolution order: `--secret-key` → `--app` + Platform API lookup → `CLERK_SECRET_KEY` in the environment → the keyless project's own key → the linked project from `clerk link`.

To point a command at a specific place, pass `--app <id>` and `--instance dev|prod|<instance_id>` rather than swapping keys around. That is what makes a dev → production migration a two-command job.

The **instance type comes from the key**: `sk_live_…` is production, anything else development. That choice drives the rate limits and the development-instance cap below, so a migration that "runs slowly" on a dev key is behaving correctly.

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
| **Better Auth**  | `user_id` (UUID), `email_verified` (boolean), `password_hash` with a bcrypt `$2` prefix, `phone_number`, `phone_number_verified`, `display_username` |
| **Auth.js**      | `email_verified`, `name`, `id`, `email` — minimal, and easy to confuse with a custom export                                            |

Two traps worth knowing:

- **A Firebase CSV export has no header row.** If a CSV opens with something like `user123,a@b.com,true,…` and no field names, that is Firebase. The transformer supplies the headers.
- **Auth0 and Better Auth both use `user_id`.** Auth0's contains a `|` (`auth0|abc123`); Better Auth's is a bare UUID.

If nothing matches, the file is a custom export → [references/transformers.md](references/transformers.md).

Confirm the live platform list rather than trusting this page:

```sh
clerk migrate transformers list --json
```

### Step 2: summarize what will happen

Tell the user, in plain terms:

1. Which transformer you are going to use.
2. What it maps — especially which field decides whether an email or phone counts as **verified**, because that is the mapping that silently changes who can sign in. Per-platform detail is in [references/transformers.md](references/transformers.md#what-the-built-ins-map).
3. Anything the source cannot carry across — Auth0 and Clerk exports contain **no password hashes**, so those users will have to reset their password.

### Step 3: get confirmation, then run

**Agent mode does not stop to confirm.** `clerk migrate run` only prompts when a human is at the terminal, so an agent invoking it starts writing users immediately. The confirmation is *yours* to ask for, in conversation, before you run anything.

```sh
clerk migrate run --transformer supabase --file exports/supabase-export.json
```

Run it **without `-y`**. Without that flag the command prints the [Migration Readiness report](#the-migration-readiness-report) before importing — that report is the thing to relay back to the user. Pass `-y` only when the user has already seen a readiness report for this file and instance.

Firebase needs four extra flags; see [references/export.md](references/export.md#firebase). A platform with no built-in needs `--transformer-file` instead of `--transformer`.

### Step 4: report the result

1. How many users imported, and how many failed.
2. Validation failures, with the reason — these are users the file could not describe (no identifier, unparseable date, unknown hasher), not Clerk rejecting them.
3. Where the log is (`./logs/migration-<timestamp>.log`), and that `clerk migrate delete` undoes the run.

The command exits non-zero if any user failed, so check the exit code rather than eyeballing the output.

## The Migration Readiness report

Printed by `clerk migrate run` unless `-y` is passed. It cross-references the file against the destination instance's live settings and flags the two failure modes that otherwise surface halfway through an import:

- **Required in Clerk, missing from the file** — those users fail one at a time, after earlier users already exist.
- **Present in the file, disabled in Clerk** — a social provider users actually signed up with, or an identifier type the instance has switched off.

**Always surface this report after any field-mapping summary.** A user who sees "12 users lack an email, which Clerk requires" before the import is a user who does not have to undo one.

If the instance settings cannot be read, the report degrades to coverage-only and flags nothing — "could not read" is not "switched off". Say which of the two you are looking at.

## Rate limits and caps

| Instance                     | Requests per second |
| ---------------------------- | ------------------- |
| Production (`sk_live_…`)     | 100                 |
| Development (`sk_test_…`)    | 10                  |

Rate limiting, backoff and `429` retries are handled for you — a slow-looking run on a dev key is the limit, not a hang.

**A development instance refuses more than 500 users.** The run fails before sending anything, so a large migration needs a production key. That is a Clerk limit, not a tool limit; do not try to work around it by batching the file.

## Undoing a migration

```sh
clerk migrate delete -y
```

Deletes the users the last `clerk migrate run` **in this directory** created, matched on the `external_id` stamped on each one. Nothing else in the instance is touched.

It reads `./.settings` to know which migration to undo, so run it from the same directory as the import. `-y` is required in agent mode. Every attempt is logged to `./logs/user-deletion-<timestamp>.log`.

## Logs

```sh
clerk migrate logs                 # list, newest first
clerk migrate logs convert --all   # NDJSON → JSON arrays, for spreadsheets
clerk migrate logs clean -y        # delete local log files
```

Logs are NDJSON — one object per line, appended as the run proceeds, so a run killed part-way still leaves a valid record. Grep them directly (`grep '"status":"success"' logs/migration-*.log | wc -l`) and only convert when something downstream needs a JSON array.

`clerk migrate logs clean` deletes **local files**. `clerk migrate delete` deletes **users from Clerk**. Do not confuse them in front of a user.

## Safety rules

1. **Confirm before importing.** Agent mode will not ask on your behalf.
2. **Check the target instance before writing.** Pass `--instance` explicitly for production; do not rely on the default.
3. **Never paste a secret key into chat or a file.** Use `clerk auth login`, or let the user set `CLERK_SECRET_KEY` themselves.
4. **Report failures honestly.** A partial import is normal and recoverable; a partial import reported as a success is not.
5. **Resume rather than re-run.** A run that died halfway continues with `--resume-after <last successful userId>`, taken from the log. Re-running from the top duplicates work and burns rate limit.

## References

- [references/export.md](references/export.md) — getting users out of each platform: credentials, flags, field coverage, troubleshooting.
- [references/transformers.md](references/transformers.md) — what the six built-ins map, and how to write a transformer for a platform that has none.
- [references/clerk-to-clerk.md](references/clerk-to-clerk.md) — development → production and instance-to-instance migrations.
