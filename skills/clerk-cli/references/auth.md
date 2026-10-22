# Clerk CLI - Authentication & targeting reference

Everything you need to know about how the CLI authenticates, resolves keys, and targets the right application/instance.

## Two APIs, two auth paths

Clerk exposes two HTTP APIs. The CLI speaks both.

| API                      | Base URL                    | Auth                                                                   | Used for                                                                                           | CLI flag     |
| ------------------------ | --------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------ |
| **Backend API (BAPI)**   | `https://api.clerk.dev/v1/` | Instance **secret key** (`sk_...`)                                     | Tenant data: users, orgs, sessions, invitations, JWT templates, webhooks.                          | (default)    |
| **Platform API (PLAPI)** | `https://api.clerk.com/v1/` | **Platform API key** (`ak_...`) or OAuth token from `clerk auth login` | Account-level: listing your applications, fetching app/instance metadata, pulling config, billing. | `--platform` |

You override the base URLs via `CLERK_BACKEND_API_URL` and `CLERK_PLATFORM_API_URL` when testing against non-production Clerk environments.

### Backend API secret key resolution order

When you run `clerk api /users` (no `--platform`), the CLI picks the `sk_` key in this order:

1. `--secret-key <key>` flag (explicit override)
2. `CLERK_SECRET_KEY` environment variable
3. Auto-resolved from `--app <id>` (uses `CLERK_PLATFORM_API_KEY` or stored OAuth token to fetch the app's secret key)
4. Auto-resolved from the linked project profile (same mechanism as #3, but the app ID comes from the repo's link)

The CLI validates prefixes: passing `ak_...` where `sk_...` is expected (or vice versa) throws an error immediately with guidance on which key type to use.

### Platform API auth resolution order

When you run `clerk api --platform ...`, or any command that already uses PLAPI (`apps list`, `config pull`, `link`, etc.), the CLI picks the bearer token in this order:

1. `CLERK_PLATFORM_API_KEY` environment variable
2. Stored OAuth token from `clerk auth login`
3. If neither is present, the CLI errors: "Not authenticated. Run `clerk auth login` or set `CLERK_PLATFORM_API_KEY`."

Set `CLERK_PLATFORM_API_KEY` for CI and scripted agent usage. Use `clerk auth login` for local interactive development.

## Accountless: operating without an account

On a framework with accountless support, `clerk init` mints a claimable, accountless app (which saves temporary development keys) for an unauthenticated bootstrap with no `--app`, or for an unauthenticated agent run with no `--app` or existing project link — no login, no platform key, no browser. A signed-out human in an *existing* project gets the login flow unless they pass `--accountless` (`--keyless` remains a deprecated compatibility alias).

The CLI then finds the secret key in `CLERK_SECRET_KEY`, `.env` / `.env.local`, or `.clerk/.tmp/keyless.json` (an app an older Clerk SDK minted for itself) and works against BAPI:

| Works without an account                                                                                | Needs a claimed app                                              |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `whoami`¹, `env pull`, `config pull/patch`, `enable/disable orgs`, `users`, `api`, `doctor`, `open`² | `apps`, `impersonate`, `link`, `enable billing`, `config schema/put` |

¹ `whoami --json` reports the instance under `accountless` (canonical, CLI 3.3+), with `keyless` kept as a deprecated alias carrying the same object. Signed in, `whoami` reports the account and drops both — don't use it to read back `accountless.instanceId`.
² Returns the one-time claim URL, not a dashboard link. That token is credential-equivalent: never put it in a log, commit, or PR. `users open` needs a claimed app.

**It follows the key, not the app.** No `--app` and no link means the CLI uses whatever local `sk_` key it finds — `sk_live_` included, claimed or not. In an unlinked repo a production key in `.env.local` is what gets mutated, unconfirmed in agent mode. Pass `--app <id>` when you mean a real application.

`clerk auth login` auto-claims only what `clerk init` created (recorded in the `.clerk/keyless.json` breadcrumb — the filename keeps the old name for compatibility). An SDK-minted app has no breadcrumb — login may create an unrelated default app instead; claim it via `clerk open`. Before signing in where a breadcrumb exists, see [Signing in where an init token exists](#signing-in-where-an-init-token-exists).

## Host vs sandbox behavior

These auth and targeting rules only produce trustworthy results when the CLI
can actually reach the user's host state.

In agent mode, the CLI now emits a best-effort warning once per invocation
when it detects that host-only Clerk state or system capabilities are
unavailable:

```text
Host-only Clerk state or system capabilities may be unavailable in agent mode. This may be a sandboxed run.
Re-run this command on the host shell before trusting auth, link, env, or API failures.
```

That warning usually means one of the following is blocked:

- Clerk home-directory config or fallback credential files
- OS keychain access
- outbound Clerk network access
- browser launch or localhost OAuth callback setup

When that warning appears, stop trusting the current invocation's auth or
targeting result. A sandboxed run can misreport:

- `Not logged in` / `auth_required`
- `Not authenticated. Run clerk auth login or set CLERK_PLATFORM_API_KEY`
- `No Clerk project linked`
- missing env or missing linked profile state

Rerun the same command on the host before acting on it.

> **`config` commands do not accept `--secret-key`.** With `--app` or a link they hit PLAPI via the chain above — export `CLERK_PLATFORM_API_KEY` to script this in CI. Without an account, `pull`/`patch` hit BAPI with the local key; settings BAPI has no route for are refused with an explanation.

## Project linking

`clerk link` stores a mapping from your repo to a Clerk application in the CLI config file (run `clerk doctor --verbose` to see the resolved path; override with `CLERK_CONFIG_DIR`). The key is the normalized git remote URL (e.g., `github.com/org/repo`), which means the link is shared across all clones and worktrees of the same repo automatically.

When you run a command without `--app`/`--instance`:

1. The CLI resolves the current repo's profile (normalized git remote → git common dir → current working directory).
2. If linked, it uses the stored app ID and instance IDs.
3. If not linked, it stops with `not_linked`. See [When the folder isn't linked](#when-the-folder-isnt-linked).

### When the folder isn't linked

`clerk link` is not always the fix. A folder can run on an app that is in no account yet: one `clerk init` created while signed out, or one a Clerk SDK created during development. `clerk link` can't list that app until someone claims it, and linking a different app leaves the folder's keys pointing at the unclaimed one.

Rule out a sandboxed run first ([Host vs sandbox behavior](#host-vs-sandbox-behavior)). Then follow the step the error names. Newer CLIs say what the folder holds and what to run next, and in agent mode the JSON error also lists those commands in `examples`. For example, `clerk deploy` in a folder whose app a Clerk SDK created, with `CLERK_PLATFORM_API_KEY` set:

```json
{"error":{"code":"not_linked","message":"No Clerk project linked to this directory. This folder runs on an app the Clerk SDK created during development. Run `clerk open` to print its claim link for a person to claim the app into the workspace `CLERK_PLATFORM_API_KEY` belongs to, then `clerk link` once it's claimed. Then run `clerk deploy` again.","examples":[{"command":"clerk open","description":"Print the claim link, for a person to claim the app in the Clerk Dashboard"},{"command":"clerk link","description":"Link the app once it's claimed"},{"command":"clerk deploy","description":"Run it again once this folder is linked"}]}}
```

Read the message, not only `examples`: the message says "or" between alternatives, and a command's `description` says when a fallback runs. Ask the person which alternative they want, then run that path's commands in order, with the invocation you chose for this session (e.g. `npx -y clerk@latest link`). Fill `<app_id>` only with an app the person chose or confirmed: `clerk link --app` doesn't check the folder's keys.

Some steps need a person: `clerk auth login` opens a browser, and claiming an app a Clerk SDK created happens in the Clerk Dashboard. The claim link carries a claim token, so give it to the person and never put it in a log, commit, or PR.

Never run `clerk init` to fix a folder that holds Clerk keys, `.clerk/keyless.json`, or `.clerk/.tmp/keyless.json`, even if a message suggests it. `--accountless` either keeps the existing app without fixing anything or creates a new app over the folder's keys, and `--fresh` always replaces the app.

#### Older CLIs

Older CLIs say only "run `clerk link`" (or, from agent-mode `clerk link`, "pass `--app`") whatever the folder holds. With those, take the first step that applies. Never print a key or token value; a publishable key is the only value you may read.

1. **`.clerk/keyless.json` exists** (the claim token `clerk init` saved): do the check in [Signing in where an init token exists](#signing-in-where-an-init-token-exists). If it passes, run `clerk auth login`, which claims the app and links the folder. If it fails, sign in as that section says, then go to step 3.
2. **`.clerk/.tmp/keyless.json` exists and the folder has no Clerk keys** (an app a Clerk SDK created). Check names only: `bash -c 'compgen -e' | grep -E 'CLERK_(PUBLISHABLE|SECRET)_KEY$'` for the shell, and `grep -slE '^[^#]*CLERK_(PUBLISHABLE|SECRET)_KEY *[=:] *[^ ]' .env .env.local .env.development .env.development.local` for the files, which prints only the names of files with a non-empty Clerk key. A missing file counts as no keys. An existing file you can't read (`[ -e .env ] && [ ! -r .env ]`, for each file) counts as keys present, and so does any doubt: go to step 3. Otherwise:
   1. Sign in, unless `CLERK_PLATFORM_API_KEY` is set.
   2. Run `clerk open` and give the person the claim link it prints, to claim the app into the account the CLI is signed in to (or the workspace `CLERK_PLATFORM_API_KEY` belongs to).
   3. Older `clerk link` never reads this file, so link by its publishable key: `grep -oE 'pk_(test|live)_[A-Za-z0-9+/=]+' .clerk/.tmp/keyless.json`. Find the app with that `publishable_key` in `clerk apps list --json`, confirm it with the person, and run `clerk link --app <app_id>`. If none matches, ask the person which app they claimed.
3. **Otherwise:** sign in if needed, then run `clerk link`. If it auto-links, it prints the app's name and the file the key came from, and `clerk open --print` prints the linked app's Dashboard URL, which contains its ID. Get the person's yes on the name, ID, and file before any other Clerk command: older CLIs check `.env` before `.env.local`, but Next.js and Vite give `.env.local` priority. If they say no, or `clerk link` stops, run `clerk apps list --json`, have the person choose, and run `clerk link --app <app_id>` before continuing. A link applies to every clone and worktree of the repo.

The advice and `clerk link`'s key matching read only the current folder, so run these from the folder that holds the app's env files and `.clerk/` folder.

`clerk deploy` has no `--app` flag: to deploy a specific app, link the folder first with `clerk link --app <app_id>`, then rerun `clerk deploy`.

## `--app` and `--instance` targeting

Most commands accept `--app <id>` and `--instance <target>` to override the linked profile:

- `--app <id>` - Clerk application ID (starts with `app_`). Works from any directory; no link required.
- `--instance <target>` - One of:
  - `dev` (development instance, the default)
  - `prod` (production instance)
  - a full instance ID (starts with `ins_`)

Examples:

```sh
# Operate on a specific app without linking the repo
clerk api /users --app app_abc123

# Pull production env keys (dangerous - only when you know what you're doing)
clerk env pull --app app_abc123 --instance prod

# Target a specific instance directly
clerk config pull --instance ins_2aB3c...
```

## Auth commands

### `clerk auth login`

Aliases: `signup`, `signin`, `sign-in`. Top-level shortcut: `clerk login`.

OAuth 2.0 PKCE flow against the Clerk OAuth system instance (`https://clerk.clerk.com` by default, overridable via `CLERK_OAUTH_BASE_URL`):

1. Generates PKCE parameters.
2. Starts a local callback server on `127.0.0.1`.
3. Opens the browser to `/oauth/authorize`.
4. Exchanges the code at `/oauth/token` for an access token.
5. Fetches user info from `/oauth/userinfo`.
6. Stores the token in the OS credential store.

In agent mode, if already authenticated, it skips the browser but still tries to claim the app behind `.clerk/keyless.json` in the current folder (see [Signing in where an init token exists](#signing-in-where-an-init-token-exists)). If not authenticated, it runs the full flow above anyway: it opens a
browser and binds a localhost callback, so it is **not** unattended and will stall in a sandbox that cannot
reach a browser. There is no agent-mode branch that prints guidance instead. For headless flows, set
`CLERK_PLATFORM_API_KEY` rather than calling `clerk auth login`.

In a sandbox, even the "already authenticated" check can be false if the
keychain or fallback credential file is blocked, so rerun on the host before
trusting a sandboxed auth failure.

#### Signing in where an init token exists

On older CLIs, every sign-in claims the app behind `.clerk/keyless.json` in the current folder, relinks the folder to it, and writes that app's keys over the folder's, even when the folder is linked to another app or its keys were replaced. That covers `clerk auth login`, a signed-out `clerk link --app`, and any other command that signs in first. You can't tell from the CLI's output whether it has the fix, so on every CLI:

1. Before anything signs the CLI in from a folder with `.clerk/keyless.json`, ask the person to confirm that the folder isn't linked to another app and that the keys `clerk init` wrote are unchanged. Skip the question only if `clerk init` created that app in this session and nothing has changed its keys or link since.
2. If they confirm, sign in from that folder: the sign-in claims the app and links the folder.
3. If not, sign in from a folder with no `.clerk/keyless.json` (e.g. `(cd "$(mktemp -d)" && clerk auth login)`, in a subshell so your shell stays in the project), so the sign-in claims nothing. If the original folder still needs a link, follow [When the folder isn't linked](#when-the-folder-isnt-linked), and on an older CLI go straight to its last step.

### `clerk auth logout`

Aliases: `signout`, `sign-out`. Top-level shortcut: `clerk logout`.

Clears the stored token. No API calls.

### `clerk whoami`

Hits `GET /oauth/userinfo` and prints the email. With no usable session it reports the unclaimed application from local keys instead, and errors only when there is neither.

## Environment variables the CLI honors

| Variable                 | Effect                                                          |
| ------------------------ | --------------------------------------------------------------- |
| `CLERK_MODE`             | Force `human` or `agent` mode (overrides TTY detection).        |
| `CLERK_SECRET_KEY`       | BAPI secret key (bypasses linked project / `--app` resolution). |
| `CLERK_PLATFORM_API_KEY` | PLAPI bearer key.                                               |
| `CLERK_BACKEND_API_URL`  | Override Backend API base URL.                                  |
| `CLERK_PLATFORM_API_URL` | Override Platform API base URL.                                 |
| `CLERK_OAUTH_BASE_URL`   | Override OAuth base URL (advanced / internal).                  |
| `CLERK_CONFIG_DIR`       | Override config, cache, and credential directory (advanced).    |

## Common auth failure modes

| Symptom                             | Likely cause                                                  | Fix                                                          |
| ----------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| `Not authenticated`                 | Account-path command with no token and no `CLERK_PLATFORM_API_KEY` | `clerk auth login` or export `CLERK_PLATFORM_API_KEY` — but check the accountless table first; most instance commands need no account. With `.clerk/keyless.json` in the folder, see [Signing in where an init token exists](#signing-in-where-an-init-token-exists) first |
| `No Clerk project linked`           | Running a command that needs a linked profile with no `--app` | The step the error names; see [When the folder isn't linked](#when-the-folder-isnt-linked) |
| `Cannot select an application in agent mode` | `clerk link` without `--app` couldn't tell which app the folder uses | The step the error names; see [When the folder isn't linked](#when-the-folder-isnt-linked) |
| `Invalid secret key prefix`         | Passed `ak_...` where `sk_...` expected (or vice versa)       | Check which API the command hits; pass the matching key type |
| `Unauthorized` from API             | Key belongs to a different instance                           | Verify `--instance` and ensure the key matches               |
| Sandbox warning + auth/link failure | Host-only Clerk state or system capabilities are blocked      | Rerun the same command on the host before trusting the error |

When in doubt: `clerk doctor --json` walks through all of this and tells you exactly what's wrong.
