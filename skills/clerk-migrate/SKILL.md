---
name: clerk-migrate
description: >-
  Migrate users into Clerk from another auth provider, or between Clerk
  instances, using the `clerk migrate` command family. Use when the user says
  "migrate my users to Clerk", "import users from Auth0 / Supabase / Firebase /
  Auth.js / Better Auth / WorkOS", "export my users", "move users from
  development to production", "undo the import", or hands over a user export
  file (JSON or CSV) and asks what to do with it. Covers exporting from the
  source platform, choosing a source, writing one for a platform with no
  built-in, checking and running the import, inspecting runs, and undoing one.
  Don't use for adding Clerk to an app (use clerk-setup) or for general CLI
  tasks (use clerk-cli).
allowed-tools: Bash, Read, Write, Grep, Glob
license: MIT
compatibility: >-
  Requires the `clerk` CLI binary (npm package `clerk`, or `bunx clerk@latest`)
  with the `clerk migrate` command family. Needs a Clerk session from
  `clerk auth login`, or a Backend API secret key passed with `--secret-key`.
  No other dependency: do not install an SDK or a database driver.
metadata:
  author: clerk
  version: 2.0.0
---

# Clerk Migrate

`clerk migrate export` gets users out of a source platform into a run. `clerk migrate import` maps that export onto Clerk's user schema, checks every user against the destination instance, and creates them through the Backend API. `clerk migrate runs` shows what each run did, and `clerk migrate undo` deletes the users an import created.

```
clerk migrate export <source> [-o <path>] [--json]
clerk migrate import <file|export-run-id> [--source <key|path>] [--dry-run] [--allow-partial] [--new-run] [--yes] [--json]
clerk migrate runs [run-id] [--json]
clerk migrate undo <run-id> [--dry-run] [--yes] [--json]
clerk migrate sources [source] [--json]
clerk migrate help
```

Every subcommand takes `--runs-dir <path>`, which overrides the `CLERK_MIGRATE_DIR` environment variable. `import`, `undo` and `export clerk` also take `--secret-key`, `--app` and `--instance`. Bare `clerk migrate` prints help.

> The binary is the source of truth. Run `clerk migrate <subcommand> --help` to confirm anything this skill claims, and prefer `--help` when they disagree.

Install nothing and clone nothing.

## Routing

| The user wants to…                                                                       | Go to                                                          |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Get their users out of Auth0, Supabase, Firebase, Auth.js, Better Auth, WorkOS, or Clerk | [references/export.md](references/export.md), then the import flow |
| Import a file they already have                                                          | [The import flow](#the-import-flow)                            |
| Know which platform a file came from                                                     | [Step 1: identify the source](#step-1-identify-the-source)     |
| Migrate from a platform with no built-in source                                          | [references/sources.md](references/sources.md#writing-a-source) |
| Move users from one Clerk instance to another (dev → prod)                               | [references/clerk-to-clerk.md](references/clerk-to-clerk.md)   |
| See what a run did, or why users failed                                                  | [Runs](#runs)                                                  |
| Undo an import                                                                           | [Undoing an import](#undoing-an-import)                        |

"Here's my Supabase dump" is an import. "I need to get my users out of Auth0" is an export that ends in an import.

## The rules

Every `clerk migrate` command follows these five rules. Rely on them.

1. **Consent.** `import` and `undo` write only after `--yes` or a yes at the prompt. Without either (agent mode, a non-TTY, or `--json`), they print a preview and exit `2` with the exact command to run.
2. **`--dry-run` checks against the real instance and writes nothing.** It exits `2` when the real run would be refused, and `0` otherwise.
3. **One place for state.** Every export, import and undo is a run in `<project root>/.clerk/migrate/<run-id>/`. The CLI adds `.clerk/` to `.gitignore` before writing there, because run files hold user data.
4. **Target first.** Every command prints the environment, app and instance it targets, and where the key came from, before anything else.
5. **`--json` everywhere.** Every subcommand takes it, and it means no prompts. `--json` on any `migrate` subcommand also forces agent mode. Exit codes: `0` all good, `1` some users failed, `2` a usage error or a refusal.

## Invoking the CLI

Check the binary once per session:

```sh
command -v clerk >/dev/null 2>&1 && clerk migrate sources --json >/dev/null && echo ok
```

If that prints `ok`, use bare `clerk`. Otherwise fall back to a package runner matching the project's lockfile: `bunx clerk@latest`, `npx -y clerk@latest`, `pnpm dlx clerk@latest`, or `yarn dlx clerk@latest`. The published package is **`clerk`**, not `@clerk/cli`.

## Keys and targeting

**Do not create or edit a `.env` file, and do not ask the user to paste a secret key** unless everything below has failed. The CLI reads credentials from flags and the process environment only, and resolves a Backend API key on its own:

```sh
clerk auth login          # once, on the user's host shell; opens a browser
clerk doctor --json       # confirms login, link, keys; parse `remedy` on failure
```

Resolution order: `--secret-key` → `--app` + Platform API lookup → `CLERK_SECRET_KEY` in the environment → the keyless project's own key → the linked project from `clerk link`.

Pass `--app <id>` and `--instance dev|prod|<instance_id>` to point a command somewhere specific. A dev → production migration needs no key swapping.

The key sets the **instance type**: `sk_live_…` is production, anything else development. The type sets the rate limit (100 req/s production, 10 req/s development) and the development-instance 100-user check. A slow run on a dev key is the rate limit at work.

For auth internals, sandbox caveats, or `clerk api`, see the `clerk-cli` skill.

## The import flow

Follow these steps in order. Do not skip the dry run or the user's confirmation.

### Step 1: identify the source

A file `clerk migrate export` wrote is an envelope, `{ "clerkMigrate": 1, "source": …, "users": [...] }`. It names its own source: pass the export run ID (or the file) and skip to Step 2.

Any other file (a bare JSON array, a CSV, Firebase's own `{ "users": [...] }`) needs `--source`. Read the first user object or the CSV header row and match it:

| Source         | Signature fields                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase`     | `encrypted_password`, `email_confirmed_at`, `raw_user_meta_data`, `instance_id`, `aud`, `is_sso_user`                                   |
| `auth0`        | `user_id` in `provider\|id` form, `email_verified` (boolean), `phone_number`, `phone_verified`, `user_metadata`, `app_metadata`, `given_name`, `family_name` |
| `firebase`     | `localId`, `passwordHash`, `passwordSalt`, `displayName`, `phoneNumber`, `disabled`                                                    |
| `clerk`        | `primary_email_address`, `verified_email_addresses`, `password_digest`, `password_hasher`, `primary_phone_number`                       |
| `workos`       | `id` starting `user_`, `email`, `email_verified` (boolean), `first_name`, `last_name`, `metadata`, sometimes `identities`; no password, phone, or username |
| `betterauth`   | `user_id` (UUID), `email_verified` (boolean), `password_hash`, `phone_number`, `phone_number_verified`, `display_username`              |
| `authjs`       | `email_verified`, `name`, `id`, `email`; minimal, and easy to confuse with a custom export                                             |

Three traps:

- **A Firebase CSV export has no header row.** A CSV that opens with `user123,a@b.com,true,…` is Firebase. The source supplies the headers.
- **Auth0 and Better Auth both use `user_id`.** Auth0's contains a `|` (`auth0|abc123`). Better Auth's is a bare UUID.
- **WorkOS and Clerk both use `user_…` IDs.** A Clerk export carries `primary_email_address` and `password_digest`. A WorkOS export has a flat `email` and nothing password-shaped.

If nothing matches, the user needs a custom source: [references/sources.md](references/sources.md#writing-a-source).

Confirm the live list, and read what a source carries:

```sh
clerk migrate sources --json
clerk migrate sources supabase     # export command, what comes across, where each field lands, caveats
```

A `--source` that contradicts an envelope's `source` exits `2`.

### Step 2: summarize what will happen

Tell the user, in plain terms:

1. Which source applies, and which instance the import targets.
2. Which field decides whether an email or phone counts as **verified**. That mapping changes who can sign in. Per-source detail: [references/sources.md](references/sources.md#what-the-built-ins-carry).
3. What the source cannot carry. Clerk (API export), Auth0 and WorkOS exports hold **no password hashes**, so those users reset their password. **Social sign-ins are never copied**: the user enables the same providers in Clerk, and Clerk links a returning user by verified email ([account linking](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/account-linking)).

### Step 3: dry run

```sh
clerk migrate import <export-run-id> --dry-run
clerk migrate import users.json --source auth0 --dry-run      # a file from anywhere else
```

The dry run prints the target, then the checks, and writes nothing. Relay the checks in full. Read [references/checks.md](references/checks.md) to explain each reject reason and the `clerk config patch` fixes it offers.

If any user is rejected, the real import refuses unless `--allow-partial` is passed. Put the choice to the user: fix the export, change the instance with the printed `clerk config patch` command, or import the rest with `--allow-partial`. Never run a `clerk config patch` without the user's yes.

### Step 4: get consent, then import

Pick one path:

- **Hand the command to the human.** Recommended when the instance already has real users, and for any production import. In Claude Code, typing `! <command>` runs it in the session. Run by a human without `--yes`, the import prints the checks and asks `Import N users?`. Declining writes nothing.

  ```sh
  clerk migrate import <export-run-id>
  ```

- **Run it yourself** after the user has said yes to your Step 2 summary and the dry-run checks. Relay the checks, then end your turn and wait for the answer. Never run `--yes` in the same turn as the dry run; a yes given before the user saw the checks doesn't count:

  ```sh
  clerk migrate import <export-run-id> --yes
  ```

If you run the import without `--yes`, it prints the checks and exits `2` with the exact command. Show that output to the user and ask before re-running with `--yes`. An exit `2` there is the consent gate, not a failure.

Firebase exports carry the project's hash parameters, so the import needs no `--firebase-*` flags. See [references/export.md](references/export.md#firebase) for files from `firebase auth:export`.

### Step 5: report the result

```sh
clerk migrate runs <run-id>
```

Report:

1. How many users were created, failed, and skipped. `runs <id>` shows the error breakdown and the users that failed or were skipped.
2. The run ID, and that `clerk migrate undo <run-id>` reverses it.
3. Any user who arrived without something: a dropped password, a field the instance does not store.

Check the exit code: `1` means some users failed. Report a partial import as partial.

## Re-running

Running the same import again continues it. The CLI matches on the file's sha256, the source, and the instance ID:

| Latest matching run | Re-running does                                                          |
| ------------------- | ------------------------------------------------------------------------ |
| none                | starts a new run                                                         |
| interrupted         | continues the same run, skipping the users it created                    |
| `partial`           | continues the same run, retrying the users that failed or were skipped   |
| `complete`          | nothing; prints "Already imported in run …" and exits `0`                |
| `undone`            | starts a new run                                                         |

`--new-run` skips the lookup and forces a fresh run. A run another live process holds exits `2`.

After a complete import, the CLI names the run folders it no longer needs (the export holds user data) with the `rm -rf` for each. Relay it; do not delete them without asking.

## Runs

```sh
clerk migrate runs                        # every run, newest first
clerk migrate runs 20260929-141502-a1b2   # one run in full
clerk migrate runs --json
```

Each run folder holds `run.json` (kind, status, target, source, file and its sha256, counts) and `users.ndjson`, one line per user outcome: `sourceId`, `clerkId`, `status` (`created`, `failed`, `skipped`, `deleted`, `exported`) and `reason`, `error`, `code` or `passwordDropped` when present. The last line for each `sourceId` wins. Grep it directly:

```sh
grep '"status":"failed"' .clerk/migrate/<run-id>/users.ndjson
```

A run is `partial` when any user failed or was skipped, `complete` otherwise, and `interrupted` when its process died before recording a finish time. A run records the instance ID from `GET /v1/instance`; if that call fails, it records `key_<hash>` instead.

## Undoing an import

```sh
clerk migrate undo <run-id> --dry-run    # preview: how many, and how many signed in since
clerk migrate undo <run-id> --yes
```

`undo` deletes only the users that run created, by the Clerk ID recorded for each. It never searches the instance, so users the import did not create stay untouched. Show the user the preview, including how many imported users have signed in since, and get a yes before passing `--yes`.

It refuses with exit `2`, and deletes nothing, when:

- the key addresses a different instance than the run imported into
- the run is not an import (an export or an undo run)
- the run is already undone

A partial undo exits `1`. Running `undo` again retries the users that failed, in the same undo run. The import is marked `undone` only when every user is deleted.

## Safety rules

1. **Dry-run first, then get a yes.** Relay the checks and the target before any write.
2. **Check the target.** The first lines of output name the instance. Pass `--instance prod` explicitly for production.
3. **Name the source instance when exporting from Clerk.** In agent mode `clerk migrate export clerk` uses whatever resolves, usually the linked project, which is usually the *destination*. Pass `--app`/`--instance` or `--secret-key` for the source.
4. **Never paste a secret key into chat or a file.** Use `clerk auth login`, or let the user set `CLERK_SECRET_KEY` themselves.
5. **Report failures honestly.** A partial import is normal and recoverable. Re-run the same command to continue it.

## References

- [references/export.md](references/export.md): getting users out of each platform: credentials, flags, the envelope, field coverage, troubleshooting.
- [references/checks.md](references/checks.md): what the import checks, each reject reason, and `--allow-partial`.
- [references/sources.md](references/sources.md): what the seven built-ins carry, and how to write a source for a platform with none.
- [references/clerk-to-clerk.md](references/clerk-to-clerk.md): development → production and instance-to-instance migrations.
