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
  version: 1.0.0
---

# Clerk Migrate

`clerk migrate export` gets users out of a source platform into a run. `clerk migrate import` maps that export onto Clerk's user schema, checks every user against the destination instance, and creates them through the Backend API. `clerk migrate runs` shows what each run did, and `clerk migrate undo` deletes the users an import created.

```
clerk migrate export <source> [-o <path>.json] [-y] [--json]
clerk migrate import <file|export-run-id> [--source <key|path>] [--dry-run] [--allow-partial] [--new-run]
                     [--require-password] [--skip-legal-checks] [--reserve-unverified] [--yes] [--json]
clerk migrate runs [run-id] [--json]
clerk migrate undo <run-id> [--dry-run] [--yes] [--include-signed-in] [--json]
clerk migrate sources [source] [--json]
clerk migrate help
```

Every subcommand except `sources` takes `--runs-dir <path>`, which overrides the `CLERK_MIGRATE_DIR` environment variable. `import`, `undo` and `export clerk` also take `--secret-key`, `--app` and `--instance`. Bare `clerk migrate` prints help.

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
| See what a run did, or why users failed                                                  | [references/runs.md](references/runs.md)                       |
| Undo an import                                                                           | [Re-running, runs, and undo](#re-running-runs-and-undo)        |

"Here's my Supabase dump" is an import. "I need to get my users out of Auth0" is an export that ends in an import.

## The rules

Every `clerk migrate` command follows these five rules. Rely on them.

1. **Consent.** `import` and `undo` write only after `--yes` or a yes at the prompt. Without either (agent mode, a non-TTY, or `--json`), they print a preview and exit `2` with the exact command to run. In agent mode that command is in the stderr JSON, `error.examples[].command`; with `--json`, stdout also carries the preview with `"consent": "required"`. A suggested command may hold a `--secret-key <key>` placeholder: never fill in a real key yourself.
2. **`--dry-run` checks against the real instance and writes nothing.** It exits `2` when the real run would be refused, and `0` otherwise.
3. **One place for state.** Every export, import and undo is a run folder. The folder is `--runs-dir`, else `CLERK_MIGRATE_DIR`, else `<project root>/.clerk/migrate/<run-id>/`, where the project root is the linked directory, else the git toplevel, else the current directory. The CLI adds `.clerk/` to `.gitignore` before writing to the default location, because run files hold user data. Dry runs and refused imports write no run.
4. **Target first.** `import`, `undo` and `export` print the environment, app and instance they target, and where the key came from. With `--json` the same data is in the `target` field.
5. **`--json` everywhere.** Every subcommand takes it, and it means no prompts. `--json` on any `migrate` subcommand also forces agent mode.

Exit codes: `0` success, `1` some users failed or any runtime, API or auth error, `2` a usage error or a refusal, `130` interrupted. **`0` does not mean every user arrived**: skips under `--allow-partial` and users the run did not send still exit `0`. Read `result.failed`, `result.skipped`, `result.notSent` and `result.pending` from `import --json`, or `state` from `clerk migrate runs <run-id> --json`.

## Invoking the CLI

Check the binary once per session:

```sh
command -v clerk >/dev/null 2>&1 && clerk migrate sources --json >/dev/null && echo ok
```

If that prints `ok`, use bare `clerk`. Otherwise fall back to a package runner matching the project's lockfile: `bunx clerk@latest`, `npx -y clerk@latest`, `pnpm dlx clerk@latest`, or `yarn dlx clerk@latest`. The published package is **`clerk`**, not `@clerk/cli`.

## Keys and targeting

**Do not create or edit a `.env` file, and do not ask the user to paste a secret key** unless everything below has failed. The CLI resolves a Backend API key on its own, from flags, the process environment, the linked project, or (in an unlinked keyless project) the project's `.env`, `.env.local` and `.clerk/.tmp/keyless.json`:

```sh
clerk auth login          # once, on the user's host shell; opens a browser
clerk doctor --json       # confirms login, link, keys; parse `remedy` on failure
```

Resolution order: `--secret-key` → `--app` + Platform API lookup → `CLERK_SECRET_KEY` in the environment → the keyless project's own key → the linked project from `clerk link`.

Pass `--app <id>` and `--instance dev|prod|<instance_id>` to point a command somewhere specific. A dev → production migration needs no key swapping.

`--instance` switches instances only when the key comes from a linked project or `--app`. A key from `--secret-key` or an exported `CLERK_SECRET_KEY` names its own instance, and a `--instance` that disagrees with it exits `2`. In an unlinked keyless project, any `--instance` exits `2`: link the project or pass `--app`.

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
| `firebase`     | `localId`, `passwordHash`, `salt` (JSON) or `passwordSalt` (CSV), `displayName`, `phoneNumber`, `disabled`                              |
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

A built-in `--source` that contradicts an envelope's `source` exits `2`. A path to a source you wrote replaces the envelope's source: see Step 2.

### Step 2: summarize what will happen

Tell the user, in plain terms:

1. Which source applies, and which instance the import targets.
2. Which field decides whether an email or phone counts as **verified**. That mapping changes who can sign in. Per-source detail: [references/sources.md](references/sources.md#what-the-built-ins-carry).
3. What the source cannot carry. Clerk (API export), Auth0 and WorkOS exports hold **no password hashes**, so those users reset their password. **Social sign-ins are never copied**: the user enables the same providers in Clerk, and Clerk links a returning user by verified email ([account linking](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/account-linking)).
4. Sign-in identifiers outside the mapped fields: phone or username keys in metadata, a name field holding usernames or phone numbers, placeholder emails such as `<digits>@phone.local` that hide a phone. A built-in source imports these as metadata or a first name, and the dry run doesn't flag them. Ask the user whether to import them as real identifiers. That takes a [custom source](references/sources.md#writing-a-source), and the dry run then offers the instance changes it needs: phone or username sign-in, email made optional, extended special characters for usernames with a dot. Apply each only with the user's yes.

   To map an export run with a source you wrote, pass the run ID and the path: `clerk migrate import <export-run-id> --source ./my-source.ts`. It replaces the built-in source and keeps the link to the export run. Its `preTransform` does not run on an envelope.
5. Two choices the CLI makes only with the user's yes. Ask about each one that applies, and pass the flag only on a yes:
   - **`--reserve-unverified`.** Users with an email or phone the source never verified. By default Clerk attaches those unverified. Reserved, they work for sign-in and are locked to the user, and they count toward a required email or phone. A reserved address another user already holds rejects the whole user. A continued run keeps the choice its first attempt recorded.
   - **`--skip-legal-checks`.** When the instance requires legal consent, users with no `legal_accepted_at` are rejected. The flag imports them without it.

   An agent run never asks, so it imports unverified and rejects users without legal acceptance unless you pass the flag.
6. What the import adds: every created user gets `private_metadata.clerkMigrateRun`, set to the run ID. It replaces any value the source carried under that key, and it stays on the user.

### Step 3: dry run

```sh
clerk migrate import <export-run-id> --dry-run
clerk migrate import users.json --source auth0 --dry-run      # a file from anywhere else
```

The dry run prints the target, then the checks, and writes nothing. Relay the checks in full. Read [references/checks.md](references/checks.md) to explain each reject reason and the `clerk config patch` fixes it offers.

If any user is rejected, the real import refuses unless `--allow-partial` is passed. Put the choice to the user: fix the export, change the instance with the printed `clerk config patch` command, or import the rest with `--allow-partial`. Never run a `clerk config patch` without the user's yes.

### Step 4: get consent, then import

Pick one path:

- **Hand the command to the human.** Recommended when the instance already has real users, and for any production import. Ask them to run it in their own terminal: the CLI prompts only on a TTY, so a command run through an agent's shell exits `2` instead. Run by a human without `--yes`, the import prints the checks and asks `Import N users?` (or `Create N users and skip M users?`), and asks about reserved and legal consent where they apply. Declining writes nothing.

  ```sh
  clerk migrate import <export-run-id>
  ```

- **Run it yourself** after the user has said yes to your Step 2 summary and the dry-run checks. Relay the checks, then end your turn and wait for the answer. Never run `--yes` in the same turn as the dry run; a yes given before the user saw the checks doesn't count:

  ```sh
  clerk migrate import <export-run-id> --yes
  ```

If you run the import without `--yes`, it prints the checks and exits `2` with the exact command. Show that output to the user and ask before re-running with `--yes`. An exit `2` there is the consent gate, not a failure.

Firebase exports carry the project's hash parameters when the export could read them, so the import needs no `--firebase-*` flags. See [references/export.md](references/export.md#firebase) for files from `firebase auth:export`.

### Step 5: report the result

```sh
clerk migrate runs <run-id>
```

Spot-check 2 or 3 created users, taking their `sourceId` from `created` lines in the run's `users.ndjson`:

```sh
clerk users list --external-id <source-id> --json
```

Compare their identifiers, verification and metadata placement with what you told the user in Step 2.

Report:

1. How many users were created, failed, and skipped. `runs <id>` shows the error breakdown and the users that failed or were skipped.
2. The run ID, and that `clerk migrate undo <run-id>` reverses it.
3. Any user who arrived without something: a dropped password, a field the instance does not store.
4. Every mismatch the spot-check found.

Check the exit code and the counts: `1` means some users failed, and a `0` can still be partial. Report a partial import as partial.

## Re-running, runs, and undo

Running the same import again continues it: an interrupted or `partial` run picks up where it stopped, and a `complete` one prints "Already imported in run …" and exits `0`. `--new-run` forces a fresh run.

```sh
clerk migrate runs                        # every run, newest first
clerk migrate runs <run-id>               # one run: counts, errors, the users that did not make it
clerk migrate undo <run-id> --dry-run     # preview: how many, and how many signed in since
clerk migrate undo <run-id> --yes
```

`undo` deletes only users that run created. Show the user the preview and get a yes before passing `--yes`. If any imported user has signed in since, `--yes` alone exits `2` and deletes nothing: those are accounts people have used, so pass `--include-signed-in` only after the user says yes to deleting them too.

After a complete import, the CLI names the run folders it no longer needs (the export holds user data) with the `rm -rf` for each. Relay it; do not delete them without asking.

Matching, refusals, run files and every undo case: [references/runs.md](references/runs.md).

## Safety rules

1. **Dry-run first, then get a yes.** Relay the checks and the target before any write.
2. **Check the target.** The first lines of output name the instance. Pass `--instance prod` explicitly for production.
3. **Name the source instance when exporting from Clerk.** The linked project is usually the *destination*, so in agent mode `clerk migrate export clerk` refuses with exit `2` until `--secret-key`, `--app`/`--instance` or `CLERK_SECRET_KEY` names the source.
4. **Never paste a secret key into chat or a file.** Use `clerk auth login`, or let the user set `CLERK_SECRET_KEY` themselves.
5. **Report failures honestly.** A partial import is normal and recoverable. Re-run the same command to continue it.
6. **Never pass a consent flag on your own.** `--yes`, `--include-signed-in`, `--reserve-unverified`, `--skip-legal-checks` and `--allow-partial` each need the user's yes.

## References

- [references/export.md](references/export.md): getting users out of each platform: credentials, flags, the envelope, field coverage, troubleshooting.
- [references/checks.md](references/checks.md): what the import checks, each reject reason, and `--allow-partial`.
- [references/sources.md](references/sources.md): what the seven built-ins carry, and how to write a source for a platform with none.
- [references/runs.md](references/runs.md): re-running, run files, statuses, and every undo case.
- [references/clerk-to-clerk.md](references/clerk-to-clerk.md): development → production and instance-to-instance migrations.
