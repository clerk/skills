# Clerk CLI - Agent mode reference

The Clerk CLI has a first-class "agent" mode that's designed for non-interactive and AI-driven use. Read this before writing scripts or letting an LLM drive the CLI.

## Sandbox warning semantics

Agent mode and sandboxing are related but not identical:

- **Agent mode** controls non-interactive behavior.
- **Sandboxing** controls whether the CLI can actually reach host-only Clerk
  state and host system capabilities.

In agent mode, the CLI now performs a **best-effort warn-once check** at the
host-sensitive integration boundaries. The first time an invocation hits a
blocked host capability, it emits:

```text
Host-only Clerk state or system capabilities may be unavailable in agent mode. This may be a sandboxed run.
Re-run this command on the host shell before trusting auth, link, env, or API failures.
```

Treat that warning as authoritative. The command may still continue and return
an ordinary Clerk error, but any auth/link/env/config/API/browser/OAuth
failure from that invocation should be treated as suspect until rerun on the
host.

The warning can be triggered by:

- home-directory Clerk config / credential file access
- OS keychain access
- outbound Clerk network requests
- browser launch
- localhost callback server binding for OAuth

If your harness does not obviously look non-interactive, force agent behavior
with `--mode agent` or `CLERK_MODE=agent` so the CLI's non-interactive and
sandbox-warning paths apply deterministically.

## How agent mode is detected

Priority (first match wins):

1. `--mode agent` flag on the command line
2. `CLERK_MODE=agent` environment variable
3. Stdout is not a TTY (piped, redirected, or running under an agent harness)

Force human mode with `--mode human` or `CLERK_MODE=human`. Typical AI-agent invocations automatically land in agent mode because stdout is piped.

## What changes in agent mode

| Behavior                                                         | Human mode                                                       | Agent mode                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Interactive pickers (`link` without `--app`, `api` with no args) | Show a TUI picker                                                | Print structured guidance and exit, or auto-resolve                                                                                                                                                                                                                                                                                                                                                                                  |
| `clerk link --app <id>`                                          | Links directly                                                   | Links directly                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `clerk link` without `--app`                                     | Interactive picker / create UI                                   | Tries silent autolink from detected publishable keys; if no deterministic match exists, exits with a usage error. The next step depends on what the folder holds: see [auth.md](auth.md#when-the-folder-isnt-linked)                                                                                                                                                                                                              |
| `unlink` confirmation                                            | Prompt y/n                                                       | Requires `--yes`; exits with a usage error without it |
| All other mutation confirmations (`config patch` / `put`, `api -X POST/PATCH/DELETE`, `users create`, `enable` / `disable`) | Prompt y/n | **Silently skipped - the mutation executes.** These gates are `isHuman() && !options.yes`, so agent mode bypasses them entirely: `--yes` is neither required nor meaningful, and nothing errors. `--dry-run` is the only safety net                                                                                                                                                                                                                                                                                                                                                                                                     |
| `clerk doctor --fix`                                             | Interactively offers fixes                                       | **Ignored**; output the `remedy` field and let the caller act                                                                                                                                                                                                                                                                                                                                                                        |
| `clerk apps list` default output                                 | Table                                                            | JSON (when piped)                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `clerk apps create <name>` output                                | Human-readable summary                                           | JSON (auto-detected, same as `apps list`); `--json` also works explicitly                                                                                                                                                                                                                                                                                                                                                            |
| `clerk users list` / `clerk users create` default output         | Table / human-readable                                           | JSON (auto-detected when piped); `--json` also works explicitly                                                                                                                                                                                                                                                                                                                                                                      |
| `clerk users` (no subcommand)                                    | Interactive action picker                                        | Prints the action list and exits with a usage error (code `2`) - pass `list` / `create` / `open`                                                                                                                                                                                                                                                                                                                                     |
| `clerk users open [user-id]`                                     | Picks a user interactively, opens browser                        | Requires `user-id`; prints `{url, appId, appName, instanceId, instanceLabel, userId, opened: false}` and does not open a browser                                                                                                                                                                                                                                                                                                     |
| `clerk open [subpath]`                                           | Opens the browser to the URL                                     | Does not open a browser. Prints a JSON descriptor (`{url, appId, appName, instanceId, instanceLabel, subpath, opened: false}`) on stdout so the agent can surface it                                                                                                                                                                                                                                                                 |
| `clerk impersonate [user]`                                       | Picker when `[user]` omitted; confirms; prints URL + revoke hint | Requires the `[user]` positional (usage error `2` without it). Ambiguous search terms exit `2` listing candidate user IDs - retry with a `user_...` ID. Never opens a browser. Prints one JSON object `{url, id, userId, actor, appId, appLabel, instanceId, instanceLabel, expiresInSeconds}` on stdout - capture `id`; it is the only chance to record the revoke handle                                                           |
| `clerk webhooks listen --forward-to <url>`                       | Banner + one formatted line per delivery                         | NDJSON on stdout: one `{type:"ready", relay_url, forward_to}` line, then one `event` line per delivery (feed lines to `webhooks verify --delivery`), plus `{type:"reconnecting"}` if the relay drops. Long-running - run it in the background                                                                                                                                                                                        |
| `clerk deploy`                                                   | Interactive production deploy wizard                             | Without `--domain`, prints the report on stdout and exits `0` for linked projects. With `--domain <domain>`, creates the production instance (or resumes the existing one on that domain) and prints the report. Never prompts, writes OAuth credentials, triggers DNS checks, or polls.                                                                                                                                                                                                                                                                                       |
| `clerk deploy status`                                            | Verify production deploy state                                   | Read-only verification gate. Triggers one DNS check for active production domains, waits briefly, reads one live status snapshot, prints the report on stdout, exits `0` when complete and `1` when incomplete. It does not keep waiting or back off in agent mode unless `--wait` is passed. Use `--wait` when the user asks the agent to keep waiting for DNS, SSL, email DNS, or final Clerk-side readiness.                      |
| `clerk auth login` when already authenticated                    | Prompt to re-auth (newer CLIs, with an init token: ask whether to claim it into the account or workspace it names) | Skips the browser, but tries to claim the app behind `.clerk/keyless.json` in this folder |
| `clerk auth login` when **not** authenticated                    | Opens a browser, binds a localhost callback                      | Identical - it still opens a browser and binds a localhost callback. There is no guidance-only branch, so it stalls in a sandbox. Use `CLERK_PLATFORM_API_KEY` for headless flows |
| `clerk init`                                                     | Full interactive scaffold flow                                   | Runs non-interactively. Explicit `--app` or a linked profile uses the real-app auth/link/env flow, but `--app` that would replace an existing application link stops with a usage error unless `--relink` is passed. With `--json`, it also emits an `input-required` status. Inside a Git repository, the link is shared by every project in it. On a framework with accountless support, an authenticated agent creates a real app and links it. Without `--app` or an existing link, an unauthenticated agent on a framework with accountless support mints an unclaimed app with temporary dev keys — no login, no flag, no browser. On those frameworks, `--accountless` forces the temporary-keys path over both a session and an existing link — the escape hatch when a stale link would otherwise trigger a browser login; `--login` forces the authenticated flow (usage error while signed out in agent mode). Non-native frameworks without temporary-key support print manual setup guidance when no app is selected. iOS and macOS apps (`--starter` included) require a real Clerk application and reject `--accountless`; with `--json`, they report setup as JSON statuses. Follow the [iOS setup prompt](https://clerk.com/docs/ios/getting-started/quickstart.md). |
| Color / spinners                                                 | Enabled                                                          | Disabled                                                                                                                                                                                                                                                                                                                                                                                                                             |

In addition, sandboxed agent-mode invocations may emit the warning above once
per CLI invocation when a host-sensitive operation is blocked.

**Rule of thumb:** always pass `--yes` for mutations and `--json` for structured output where available. Pass `--app` / `--instance` when you intentionally target a real app. Bootstrapping without authentication needs no flag at all — temporary development keys are the default; `--accountless` forces that path over both a signed-in session and an existing linked profile. `--keyless` is a deprecated compatibility alias and should not be used in new instructions.

## Passing options as JSON: `--input-json`

Every command accepts `--input-json <json|@file|->`. Keys convert from camelCase/snake_case to kebab-case and expand into flags before Commander parses argv - so anything a command accepts as a flag can come from JSON instead.

```sh
clerk init --input-json '{"framework":"next","yes":true}'
clerk config pull --input-json '{"keys":["auth_email","session"]}'  # arrays → repeated flags
clerk init --input-json @init-opts.json                             # read JSON from a file
clerk init --input-json -                                           # read JSON from stdin
echo '{"framework":"next","yes":true}' | clerk init --input-json -  # same, over a pipe
```

Stdin is read **only** with the explicit `-` marker (`--input-json -`). Bare piped stdin is never consumed, so shell loops and self-reading commands (`cat body.json | clerk api …`) are untouched.

Positional arguments (e.g. the `<name>` in `clerk apps create <name>`) cannot come from JSON - only flag-style options can.

| JSON             | Expansion                               |
| ---------------- | --------------------------------------- |
| `"str"` / number | `--flag <value>`                        |
| `true`           | `--flag`                                |
| `false` / `null` | omitted                                 |
| `["a","b"]`      | `--flag a --flag b` (empty arrays omit) |
| `{…}` (nested)   | rejected - `invalid_json`, exit `2`     |

**Placement.** Put `--input-json` after the leaf subcommand. Before it, flags land on the root program, so only `--mode` / `--verbose` work there - subcommand flags (`--json`, `--app`, etc.) error as unknown. Explicit flags after `--input-json` override its values (last-flag-wins).

Errors use the standard agent-mode format: bad JSON → `invalid_json`, missing `@file` → `file_not_found`, unknown expanded flags → Commander's `unknown option`. All exit `2`.

## Exit codes

| Code | Meaning                                                                      |
| ---- | ---------------------------------------------------------------------------- |
| `0`  | Success                                                                      |
| `1`  | Runtime error (auth failure, API error, file I/O, etc.)                      |
| `2`  | Usage or validation error (bad flags, malformed JSON body, unknown endpoint) |

`clerk doctor` exits `1` when any check fails (warnings alone still exit `0`).

## Error output format

**Human mode:**

- Single-line error message on stderr.
- Stack traces hidden unless `--verbose` is passed.
- API errors include the first message from the response body, prefixed with a human context string (e.g., `Failed to fetch config: unauthorized`).

**Agent mode:**

- Structured JSON on stderr: `{"error":{"code":"...","message":"...","docsUrl?":"...","errors?":[...],"examples?":[...]}}`.
- `code` is a machine-readable error code (e.g., `auth_required`, `api_error`, `unexpected_error`).
- `errors` array is present for API errors and mirrors the Clerk API error shape (`{code?, message?, meta?}`).
- `docsUrl` is present when the error has associated documentation.
- `examples` is present when the error names commands to run next, such as a `not_linked` error on newer CLIs: `[{command, description}]`. The message says which commands are alternatives; see [auth.md](auth.md#when-the-folder-isnt-linked).

**Both modes:**

- User-aborted commands exit cleanly with no error output.
- When handling errors programmatically, read stderr, check the exit code, and re-run with `--verbose` to get a trace if you need to debug.

## Structured outputs you can rely on

| Command                                       | Structured output                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `clerk doctor --json`                         | `[{name, status, message, detail?, remedy?, fix?}]`                                           |
| `clerk apps list --json`                      | Array of application objects                                                                  |
| `clerk apps create --json`                    | Single application object                                                                     |
| `clerk users list` (agent mode or `--json`)   | `{data: [...users], hasMore}` envelope (BAPI user shape inside `data`)                        |
| `clerk users create` (agent mode or `--json`) | Single user object (raw BAPI shape)                                                           |
| `clerk users open` (agent mode)               | `{url, appId, appName, instanceId, instanceLabel, userId, opened: false}`                     |
| `clerk api <path>`                            | Raw API JSON (Backend or Platform) on stdout                                                  |
| `clerk api <path> --include`                  | Response headers on stderr, body on stdout                                                    |
| `clerk config pull`                           | Instance config JSON                                                                          |
| `clerk config schema`                         | JSON Schema                                                                                   |
| `clerk open [subpath]`                        | `{url, appId, appName, instanceId, instanceLabel, subpath, opened: false}` (agent mode)       |
| `clerk open --print`                          | Plain dashboard URL on stdout                                                                 |
| `clerk deploy` (agent mode)                   | The deploy report: `complete`, `state`, domain status, OAuth status, and `nextAction`         |
| `clerk deploy status` (agent mode)            | The same report, plus exit `0` complete or `1` incomplete                                     |
| Any command (agent mode)                      | On error: `{"error":{"code","message","docsUrl?","errors?","examples?"}}` on stderr           |

For commands without an explicit `--json` flag, `clerk api` is your escape hatch: hit the underlying endpoint directly.

## Patterns for agent-driven use

### Diagnose before acting

```sh
clerk doctor --json --spotlight
```

Parse the output, then for each failing check read `remedy` and act. Never call `--fix` from an agent - it's interactive.

In agent mode, `doctor` also includes a **`Host execution`** check when it can
detect that Clerk's host-side state is not writable. If that check warns, stop
trusting auth/link/env/API failures from the same sandboxed run and rerun the
relevant command on the host.

### Preview every mutation

```sh
# Dry run first
clerk api /users/user_abc123 -X DELETE --dry-run
# If the preview is what you expected, run it with --yes
clerk api /users/user_abc123 -X DELETE --yes
```

### Target explicitly

```sh
# Don't rely on the linked profile for critical operations
clerk api /users --app app_abc123 --instance prod
```

The same advice applies to linking in agent mode: `clerk link --app app_abc123` is deterministic and works non-interactively, for an app the person named that's already in the account. If you omit `--app`, the command succeeds only when silent autolink can prove the target app from existing publishable keys, or, on newer CLIs, when it claims the app `clerk init` created in this folder.

### Deploy to production

`clerk deploy --mode agent` prints a JSON report on the production deploy. With `--domain`, it first creates the production instance by cloning development, or resumes the existing one. `clerk deploy status --mode agent` checks progress and prints the same report. The report's `nextAction` says what to do next.

```sh
# 1. Print the report without changing anything.
clerk deploy --mode agent

# 2. With no production instance yet, ask the user for a domain they own, then create it:
clerk deploy --mode agent --domain example.com

# 3. Verify, and keep waiting when the user asks:
clerk deploy status --mode agent
clerk deploy status --mode agent --wait
```

For `not_linked`, follow [When the folder isn't linked](auth.md#when-the-folder-isnt-linked). `clerk deploy` has no `--app` flag: to deploy a specific app, link the folder first with `clerk link --app <app_id>`.

`clerk deploy --mode agent` exits `0` once its own work succeeds, even when production isn't complete yet. With `--domain`, it can fail with these errors:

- `usage_error` (exit 2): the domain is malformed or a hosting provider's, such as `*.vercel.app`. The CLI doesn't catch every hosting domain, so confirm the user can change the domain's DNS before running `clerk deploy --domain`.
- `provider_domain_not_allowed`: Clerk rejected the domain as a hosting provider's. Ask the user for a domain they own and can add DNS records to.
- `home_url_taken`: another instance already uses that domain. Ask the user for another.
- `plan_insufficient`: the plan doesn't cover features enabled in development, and nothing was created. The user upgrades their plan in the Clerk Dashboard or turns off the features the message lists.
- `production_instance_exists`: the production instance is on another domain, which the message names. Ask the user whether to continue with that domain (run `clerk deploy status --mode agent`) or change it in the Clerk Dashboard. Don't retry with another `--domain`.
- `deploy_domain_unchecked`: Clerk hasn't returned the existing instance's domain yet, and nothing was changed in Clerk. Wait, then run `clerk deploy status --mode agent`. Don't rerun `clerk deploy --domain` until the report shows the domain.
- `deploy_instance_unresolved`: the instance exists, but Clerk can't return it or its status yet. Wait and run `clerk deploy status --mode agent`. If it keeps failing, stop and tell the user.

Any other error from Clerk arrives in the same error envelope, so follow its message.

The user can run the wizard instead, with `clerk deploy` in a separate terminal, from the project directory. It reads answers from stdin, so never run it through your session, including Claude Code's `!` shell escape. After the user finishes, run `clerk deploy status --mode agent`.

`clerk deploy status --mode agent` exits:

| Exit | Meaning                                                                                                                                  |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `0`  | Deploy is complete and verified.                                                                                                         |
| `1`  | Incomplete deploy or runtime failure. A deploy report on stdout describes incompleteness. An error envelope on stderr describes failure. |
| `2`  | Usage or validation error. Read the error envelope on stderr.                                                                            |

When `nextAction` includes a Clerk Dashboard URL, show it to the user and offer to open it. `urls.domains` is the instance's Domains page and `urls.instance` its Dashboard home.

The report has this shape:

```json
{
  "complete": false,
  "state": "domain_pending",
  "domain": "example.com",
  "productionInstanceId": "ins_...",
  "domainStatus": { "dns": "pending", "ssl": "pending", "mail": "complete" },
  "pendingDnsRecords": [{ "type": "CNAME", "host": "clerk.example.com", "value": "...", "required": true }],
  "oauth": { "complete": true, "configured": ["google"], "pending": [], "unsupported": [], "setup": [] },
  "urls": { "domains": "https://dashboard.clerk.com/apps/app_.../instances/ins_.../domains", "instance": "https://dashboard.clerk.com/apps/app_.../instances/ins_..." },
  "hostSetup": [],
  "nextAction": "DNS records not found yet for example.com. Add the records in `pendingDnsRecords` at the domain's DNS provider if you haven't already, then re-run `clerk deploy status --wait`. Propagation usually takes minutes. Ask the user to visit the Clerk Dashboard domains page, or offer to open it: https://dashboard.clerk.com/apps/app_.../instances/ins_.../domains"
}
```

The example leaves these fields empty or out:

- `oauth.setup`: one entry per provider missing production credentials, with `redirectUri`, `authorizedOrigins`, `note` (a warning to pass on to the user, or `null`), `payload`, `command`, and `fields`, where `fileContents: true` marks a value that is a file's contents.
- `oauth.unsupported`: providers the CLI can't configure. They don't block `complete`, so tell the user to configure them in the Clerk Dashboard.
- `nativeAppleReadinessIssue`: present when Sign in with Apple is native-only and not ready in production. `nextAction` gives the fix, and Apple has no `oauth.setup` entry until then.
- `hostSetup`: at `complete`, the command that copies the production keys to Vercel. Vercel only, and `[]` in every other state.

Run the `oauth.setup` and `hostSetup` commands as given; don't replace a quoted path with `clerk`. On Windows these commands and the `env pull --print` command the user runs call plain `clerk` (in the `hostSetup` command, inside `keys=$(...)`). If `clerk` isn't installed, replace that call with the package-runner form from [Invoking the CLI](../SKILL.md#invoking-the-cli) and keep the rest of the command.

`complete` is `true` only when the domain is complete and every supported OAuth provider enabled in development has production credentials. Read `state`, not `domainStatus`: its DNS, SSL, and email DNS can all be `complete` while Clerk is still finishing.

What to do in each state:

| State                 | What to do                                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `not_started`         | Ask the user for a domain they own and can add DNS records to, then run `clerk deploy --mode agent --domain <domain>`. If that just succeeded, rerun it with the same domain: Clerk may not list the instance yet. |
| `domain_provisioning` | Wait, then run `clerk deploy status --mode agent`.                                                                            |
| `domain_pending`      | Have the user add `pendingDnsRecords` at their DNS provider, and meanwhile save any `oauth.setup` entries as in [Save OAuth credentials](#save-oauth-credentials). Rerun `clerk deploy status --mode agent` after propagation. |
| `oauth_pending`       | Save the `oauth.setup` entries as in [Save OAuth credentials](#save-oauth-credentials), then run `clerk deploy status --mode agent`. |
| `complete`            | Follow [Copy the production keys to the host](#copy-the-production-keys-to-the-host), and for an iOS or macOS app also follow `nextAction`'s `clerk doctor` step, which checks the Release build. |

#### Save OAuth credentials

Follow these steps rather than the shorter ones in `nextAction`, which leave out the dry run and the confirmation. Steps 2 to 6 need bash or zsh. In any other shell, after step 1, fix any `nativeAppleReadinessIssue` as `nextAction` says, then have the user run `clerk deploy` in a separate terminal, from the project directory, to enter every provider's credentials. Then go to step 8.

1. Have the user create each provider's OAuth app with its entry's `redirectUri` and `authorizedOrigins`, and pass on its `note` when there is one.
2. For each entry with no field marked `fileContents: true`, create a file outside the project with `mktemp` (it prints the path, and only your user can read the file). Write the entry's `payload` into it with a shell command rather than a file tool (`printf '%s' '<payload>' > <path>`), placeholders included. Ask the user to replace each `<placeholder>` with the real value. Don't ask for the values or read the file.
3. Dry-run each entry's `command` on its file with `--dry-run` added. Its output shows the values of secret-named keys as `[REDACTED]`. Don't add `--verbose`, whose output can include raw error bodies.
4. If a dry run fails with exit 2, read the error. "Nothing was saved:" names a field that still holds its `<placeholder>` or `[REDACTED]`. `invalid_json` means the file's JSON broke while the user edited it. Ask the user to fix the file, then dry-run again.
5. Confirm once with the user before saving the credentials to production, covering every provider. If they decline, or you stop before saving, remove each file with `rm -f "<path>"`.
6. Save each entry by running its `command` in this wrapper, with the file's path in place of `<file>` and `<path>`. The wrapper keeps the command's exit status and removes the file whether or not the save succeeds:

   ```sh
   ( rc=0; <command> || rc=$?; rm -f "<path>"; exit "$rc" )
   ```

   If a save fails, the file is already gone: create a new one as in step 2 and have the user fill it in again.
7. For an entry with a field marked `fileContents: true` (Apple's private key), skip steps 2 to 6 and have the user run `clerk deploy` in a separate terminal, from the project directory. The wizard reads the key from its file and skips providers already saved, so save the other entries first.
8. Verify with `clerk deploy status --mode agent`.

#### Copy the production keys to the host

On Vercel, you usually run the report's `hostSetup` command. On any other host, the user copies the keys.

On Vercel:

1. If `vercel` isn't installed, or you can't run bash or zsh, follow the instructions for any other host. Otherwise, run `vercel whoami` yourself (it doesn't start a login just because you're logged out). If it prints "Logged out.", have the user run `vercel login` in their own terminal, then check again.
2. The `hostSetup` command writes to the Vercel project this directory is linked to. Ask the user to confirm that project serves this app in production. If it doesn't, follow the instructions for any other host.
3. Run the `hostSetup` entry's `command` in bash or zsh. It pipes the keys into Vercel's CLI without showing them. If `vercel whoami` or the `hostSetup` command doesn't exit, Vercel is waiting for a browser login it started: stop it, have the user run the command that hung in their own terminal, from the project directory, and finish the login it opens, then rerun.
4. If the `hostSetup` command exits 3, a key is already set as a production Vercel variable that also targets another environment (Preview, Development, or a custom one). Ask the user before replacing it, because `--force` may rewrite that shared variable and put the production secret key in those deployments. If they agree, run the same command again with its `allow_shared=0` changed to `allow_shared=1`. The consent applies to that one run.
5. If it exits 1, read its stderr:
   - A message starting "Couldn't read the variable list" or "vercel env ls printed escape codes" means the command couldn't read the output of `vercel env ls` and stopped before uploading anything. Don't rerun it or change its `allow_shared`. Tell the user, have them check the project's variables in Vercel, and follow the instructions for any other host.
   - Any other message is the error of the `env pull`, `vercel env ls`, or `vercel env add` command that failed. Fix the cause, such as having the user run `vercel login` or `vercel link`, then rerun the command: a failed upload can leave earlier keys already replaced and later ones not uploaded.

On any other host, have the user run the `env pull --instance <productionInstanceId> --print` command from `nextAction`, copied as given, in a separate terminal from the project directory, never through your session. They add the printed lines to the host's production environment. Don't pipe the keys into the host's CLI yourself, even though `nextAction` suggests it: some host CLIs print the values they set. On macOS, the `| pbcopy` form in `nextAction` copies the lines without showing them.

Then, on every host:

1. The report's commands copy only the publishable and secret keys. Have the user also add the other Clerk variables their app needs from their env file, such as `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, to the host's production environment. Don't open the env file yourself, because it also holds the development secret key, and don't ask the user to share the values.
2. Once the keys and the other Clerk variables are on the host (on Vercel, once the `hostSetup` command exits 0), have the user redeploy, then sign up on the domain to confirm.

### Use the catalog, not hard-coded paths

```sh
clerk api ls users            # discover available user endpoints
clerk api ls --platform apps   # platform-side endpoints
```

### Surface doctor remedies to the user

When `clerk doctor --json` reports a failure, show the user the `name`, `message`, and `remedy` - don't just silently try to fix it, because the underlying fix (e.g., `clerk auth login`) usually requires human interaction.

`clerk doctor --fix` is disabled in agent mode, so you cannot rely on it. If a caller wants to attempt remediation anyway, map the failing check to the command that would fix it in human mode. Each check exposes this mapping via the optional `fix.label` field on the JSON result:

| Failing check           | Manual remediation                           |
| ----------------------- | -------------------------------------------- |
| `Logged in`             | `clerk auth login`                           |
| `Authentication valid`  | `clerk auth login`                           |
| `CLI configuration`     | `clerk auth login`                           |
| `Project linked`        | The step in `remedy`; if it only says `clerk link`, see [auth.md](auth.md#when-the-folder-isnt-linked) |
| `Application reachable` | `clerk link`                                 |
| `Instance IDs`          | `clerk link`                                 |
| `Environment variables` | `clerk env pull`                             |
| `CLI version`           | (no auto-fix; run `clerk update`)            |
| `Shell completion`      | (no auto-fix; see `clerk completion --help`) |

All three remediation commands are themselves interactive by default: `auth login` opens a browser, `link` prompts for an app when `--app` is omitted, and `env pull` writes a file. In agent mode, use `clerk link --app <id>` for an app the person named that's already in the account; for a folder that isn't linked, follow [When the folder isn't linked](auth.md#when-the-folder-isnt-linked). Before `clerk auth login` in a folder with `.clerk/keyless.json`, see [Older CLIs](auth.md#older-clis).

## What NOT to do in agent mode

- **Don't ignore the sandbox warning.** If the CLI says host-only Clerk state or system capabilities may be unavailable, rerun the same command on the host before trusting the result.
- **Don't run `clerk auth login` just to bootstrap or configure a project** - it is not required. `clerk init` and most instance commands work with no account at all; see [auth.md](auth.md#accountless-operating-without-an-account) for the current list of which commands those are and which stay account-only. Log in only to claim an app `clerk init` created, link a real app, or use account-only commands. Logging in can't claim an app a Clerk SDK created: a person claims it by running `clerk open` in their own terminal.
- **Don't assume an unclaimed app means a throwaway app.** The CLI follows the local `sk_` key, `sk_live_` included — in an unlinked repo holding a production key, `enable orgs` / `config patch` mutate production unconfirmed. Pass `--app <id>` when you mean a real app.
- **Don't assume `clerk auth login` is fully unattended from an agent** - it opens a browser and waits for a callback. Prefer `CLERK_PLATFORM_API_KEY` for headless automation. `clerk init --app <id>` or init in an already linked project may still invoke the normal login fallback when a real app target is explicit.
- **Don't call `clerk link` without `--app` and assume the agent can pick for you** - it only succeeds when silent autolink can determine the app from detected keys, or, on newer CLIs, when it claims the app `clerk init` created.
- **Don't run `clerk unlink` in agent mode without `--yes`** - it exits with a usage error instead of prompting.
- **Don't run `clerk config put` without `--dry-run` first** - it's a full replacement and is destructive.
- **Don't skip `--yes` on mutations and expect them to work** - agent mode disables prompts, so commands that require confirmation will error.
- **Don't read secrets into your context or logs** - never read or print `env pull --print` output or a filled-in OAuth credentials file, never copy `[REDACTED]` from `config patch` or `config put` output back into a payload, and don't add `--verbose` around secrets.
