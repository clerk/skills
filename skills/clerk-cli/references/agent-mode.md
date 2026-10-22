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
| `clerk link` without `--app`                                     | Interactive picker / create UI                                   | Tries silent autolink from detected publishable keys; if no deterministic match exists, exits with a usage error telling the caller to pass `--app`                                                                                                                                                                                                                                                                                  |
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
| `clerk deploy`                                                   | Interactive production deploy wizard                             | Without `--domain`, a read-only handoff: emits deploy status JSON on stdout and exits `0` for linked projects. With `--domain <domain>`, creates the production instance (or resumes the existing one on that domain) without prompting, saves its id to the local profile, and emits the same JSON. Never prompts, writes OAuth credentials, triggers DNS checks, or polls.                                                                                                                                                                                                                                                                                       |
| `clerk deploy status`                                            | Verify production deploy state                                   | Read-only verification gate. Triggers one DNS check for active production domains, waits briefly, reads one live status snapshot, emits status JSON on stdout, exits `0` when complete and `1` when incomplete. It does not keep waiting or back off in agent mode unless `--wait` is passed. Use `--wait` when the user asks the agent to keep waiting for DNS, SSL, email DNS, or final Clerk-side readiness.                      |
| `clerk auth login` when already authenticated                    | Prompt to re-auth                                                | Silent no-op                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `clerk auth login` when **not** authenticated                    | Opens a browser, binds a localhost callback                      | Identical - it still opens a browser and binds a localhost callback. There is no guidance-only branch, so it stalls in a sandbox. Use `CLERK_PLATFORM_API_KEY` for headless flows |
| `clerk init`                                                     | Full interactive scaffold flow                                   | Runs non-interactively. Explicit `--app` or a linked profile uses the real-app auth/link/env flow; an authenticated agent on a supported framework creates a real app and links it. **An unauthenticated agent needs no account**: it mints an unclaimed accountless app with temporary dev keys — no login, no flag, no browser. `--accountless` forces the temporary-keys path over both a session and an existing link — the escape hatch when a stale link would otherwise trigger a browser login; `--login` forces the authenticated flow (usage error while signed out in agent mode). A framework without temporary-key support with no app target prints manual setup guidance. |
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

- Structured JSON on stderr: `{"error":{"code":"...","message":"...","docsUrl?":"...","errors?":[...]}}`.
- `code` is a machine-readable error code (e.g., `auth_required`, `api_error`, `unexpected_error`).
- `errors` array is present for API errors and mirrors the Clerk API error shape (`{code?, message?, meta?}`).
- `docsUrl` is present when the error has associated documentation.

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
| `clerk deploy` (agent mode)                   | Deploy handoff report with `complete`, `state`, domain status, OAuth status, and `nextAction` |
| `clerk deploy status` (agent mode)            | Deploy verification report with the same shape, plus exit `0` complete or `1` incomplete      |
| Any command (agent mode)                      | On error: `{"error":{"code","message","docsUrl?","errors?"}}` on stderr                       |

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

The same advice applies to linking in agent mode: `clerk link --app app_abc123` is deterministic and works non-interactively. If you omit `--app`, the command only succeeds when silent autolink can prove the target app from existing publishable keys.

### Deploy handoff and verification

Do not try to drive the interactive deploy wizard from an agent. Use the handoff and check commands instead.

```sh
# 1. Inspect current production deploy state without changing anything.
clerk deploy --mode agent

# 2. With no production instance yet, ask the user for a domain they own, then create it:
clerk deploy --mode agent --domain example.com

# 3. Add the records in `pendingDnsRecords` at the DNS provider, and save the
#    `oauth.setup` entries (see the oauth_pending row below).

# 4. Verify, and keep waiting when the user asks:
clerk deploy status --mode agent
clerk deploy status --mode agent --wait

# 5. Once `state` is `complete`, put the production keys on the host without
#    reading them. On Vercel, run the `command` of the `hostSetup` entry whose
#    `host` is `vercel`, copied verbatim. For another host, follow `nextAction`.
```

`clerk deploy --mode agent` without `--domain` is read-only. With `--domain`, it creates the production instance by cloning development when none exists, or resumes the existing one, then emits the same JSON. It exits `0` once its own work succeeded; `clerk deploy status` is the pass/fail gate. Two of its failures mean different things:

- `production_instance_exists`: the existing instance is on another domain. Ask the user whether to continue with that domain or change it in the Clerk Dashboard. Don't create again.
- `deploy_domain_unchecked`: an instance exists but Clerk hasn't returned its domain yet, so `--domain` couldn't be checked against it. Nothing was changed in Clerk. Wait, then run `clerk deploy status --mode agent`; don't rerun `clerk deploy --domain` until the report shows the domain.

A 404 on the production domain's status or DNS check fails with `deploy_instance_unresolved`, in `clerk deploy --domain` and in `clerk deploy status`: the instance exists and its status isn't readable yet, so wait and run `clerk deploy status` again. Unless that run just created the instance, the message adds: "If the production instance was deleted, `clerk deploy status` reports `not_started` once Clerk stops listing it; then run `clerk deploy --domain`." Other API failures keep Clerk's own error code. After a create, their message still says the instance exists and to run `clerk deploy status`.

The human wizard is the alternative when the user prefers to type values into a wizard, and the first choice for Apple's private key. Never try to run the human wizard through Claude's `! clerk deploy` shell escape or any non-interactive agent shell. The deploy wizard asks for domain, DNS export, OAuth, and verification inputs over stdin, so it needs a real human terminal. Tell the user to open a new terminal window in the project directory and run `clerk deploy` or `clerk deploy --mode human` there. After they finish, return to agent mode and run `clerk deploy status --mode agent`.

`clerk deploy status --mode agent` is the gate. It is also read-only with respect to deploy configuration, but for an active production domain it triggers one Clerk DNS check, waits briefly, reads a live status/config snapshot, then reports DNS, SSL, email DNS, aggregate domain readiness, and OAuth completeness. By default it does not keep waiting or exponentially back off in agent mode. If the check is incomplete and the user asks the agent to continue waiting, run `clerk deploy status --mode agent --wait` instead of manually sleeping and retrying. `--wait` uses the shared poll loop: one immediate status read, then up to 5 exponential-backoff retries until aggregate domain status is complete. It emits the same status JSON. It exits:

| Exit | Meaning                                                                              |
| ---- | ------------------------------------------------------------------------------------ |
| `0`  | Deploy is complete and verified.                                                     |
| `1`  | The check ran successfully, but deploy is incomplete. Read `state` and `nextAction`. |
| else | A real CLI error occurred. Read the standard agent error envelope on stderr.         |

Deploy-specific agent errors still use the standard envelope and may include typed codes such as `plan_insufficient`, `provider_domain_not_allowed`, `home_url_taken`, or `form_param_invalid`. Other typed codes include `production_instance_exists` (the existing production instance is on another domain), `deploy_domain_unchecked` (Clerk has not returned the existing instance's domain yet, so nothing was changed), and `deploy_instance_unresolved` (the instance exists but its status is not readable yet).

While domain setup remains (`domain_provisioning` and `domain_pending`), `nextAction` includes the full Clerk Dashboard domains URL so agents can send the user directly to the same page the human CLI prints. Always show that URL to the user, and ask whether they want you to open it. At `complete` it links the production instance's Dashboard page instead. `oauth_pending` carries no Domains URL; native Apple guidance may link to the Native Applications page. The report's `urls` field holds both URLs for reading programmatically.

The deploy report has this shape:

```json
{
  "complete": false,
  "state": "domain_pending",
  "domain": "example.com",
  "productionInstanceId": "ins_...",
  "domainStatus": { "dns": "complete", "ssl": "pending", "mail": "complete" },
  "pendingDnsRecords": [{ "type": "CNAME", "host": "clerk.example.com", "value": "...", "required": true }],
  "oauth": { "complete": true, "configured": ["google"], "pending": [], "unsupported": [], "setup": [] },
  "hostSetup": [],
  "nextAction": "SSL still provisioning for example.com. Re-run `clerk deploy status` in a few minutes, DNS propagation can take time. Ask the user to visit the Clerk Dashboard domains page, or offer to open it: https://dashboard.clerk.com/apps/app_.../instances/ins_.../domains"
}
```

`oauth.setup` has one entry per pending provider, each with `fields` (each with `key`, `label`, `required`, `secret`, `options` when the value must be one of a fixed set, and `fileContents: true` when its value is a file's contents), `redirectUri`, `authorizedOrigins`, `docsUrl`, `payload`, and `command`. Apple has no entry while `nativeAppleReadinessIssue` is present: that field appears only for an iOS app using native-only Sign in with Apple that isn't ready in production, and `nextAction` carries its fix. `urls` holds the production instance's Dashboard pages, or `null` before one exists. `hostSetup` holds the commands that put the production keys on a host without you reading them: at `complete`, one entry per host the CLI has a recipe for (today Vercel), each with `host`, `label`, `shells` (`bash`, `zsh`), and `command`; `[]` in every other state.

`complete` is `true` only when the aggregate domain status is complete and all supported OAuth providers enabled in development have production credentials. The `domainStatus` object is a component summary; DNS, SSL, and email DNS can all read `complete` while `state` remains `domain_pending` if Clerk-side finalization is still pending.

State precedence:

| State                 | What to do                                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `not_started`         | Ask the user which domain they own for production (not a `*.vercel.app` or other hosting-provider URL), then run `clerk deploy --mode agent --domain <domain>`. It creates the production instance and prints the report with the DNS records to add. If `clerk deploy --domain` just succeeded, Clerk may not list the instance yet: rerun it with the same domain instead of asking the user for a new one. |
| `domain_provisioning` | Wait briefly, then run `clerk deploy status --mode agent`. Don't rerun `clerk deploy --domain`: until Clerk returns the domain, it can't check the domain against the existing instance, so it fails with `deploy_domain_unchecked`.                          |
| `domain_pending`      | Surface `pendingDnsRecords` when present. Re-run `clerk deploy status --mode agent` after DNS, SSL, or email DNS propagation. |
| `oauth_pending`       | Have the user create each provider's OAuth app with its entry's `redirectUri` and `authorizedOrigins`. For each entry whose `fields` have no `fileContents: true`, create a file outside the project with `mktemp` (it prints the path, and only your user can read the file), write the entry's `payload` into it with a shell command rather than a file tool (`printf '%s' '<payload>' > <path>`), as it is, placeholders included, and ask the user to replace each `<placeholder>` with the real value; don't ask for the values or read the file. Dry-run each entry's `command` on its file with `--dry-run` (the diff and response it prints show secrets as `[REDACTED]`; don't add `--verbose`, whose output can include raw error bodies). Then confirm once with the user before saving the credentials to production, covering every provider, not once per provider. Run each `command` on its file's path inside the cleanup wrapper below the table: the wrapper keeps the command's exit status, so a failed save still fails, and it removes the file whether or not the save succeeds. If the dry run or the save fails with `usage_error` (exit 2) and a message starting "Nothing was saved:", the user hasn't replaced the placeholders it names yet, and nothing was written to Clerk. Ask them to fill in those fields, without asking for the values. After a dry run the file is still there, so they edit it and you dry-run again. After a save the wrapper has already removed the file, so create a new one the same way and have them fill it in again. Verify with `clerk deploy status --mode agent`. An entry with a `fileContents: true` item in its `fields` (Apple's private key) never goes through a file: save the other `oauth.setup` entries first, if there are any, then send the user to `clerk deploy` in a terminal for it, since the wizard reads the key from its file. When Apple's is the only entry, skip the file steps and send the user straight to the wizard. If `nativeAppleReadinessIssue` is present, Apple has no `oauth.setup` entry; follow `nextAction` for Apple instead. |
| `complete`            | Clerk's side is done. If the production keys aren't on the host yet, put them there: on Vercel, run the `command` of the `hostSetup` entry whose `host` is `vercel` in bash or zsh, copied verbatim from the field; on any other host, follow `nextAction`. It pipes `clerk env pull --instance <productionInstanceId> --print` into Vercel's CLI without showing the keys. If it exits 3, a key is already set as a production Vercel variable that also targets another environment (Preview, Development, or a custom one): ask the user before replacing it, because `--force` may rewrite that shared variable and put the production secret key in those deployments. If they agree, run the same command again with its `allow_shared=0` changed to `allow_shared=1`; the consent applies to that one run. If it exits 1 before uploading, read its error: a failed `clerk env pull` or a failed `vercel env ls` stops it at once with that command's own error on stderr (for Vercel not logged in or the project not linked, have the user run `vercel login` or `vercel link`), and only a listing that succeeded but isn't recognizable prints "Couldn't read the variable list from vercel env ls", in which case the user should check the project's variables. Redeploy only after it exits 0, then have the user sign up on the domain to confirm. |

For each OAuth save that uses a temporary file, use this cleanup wrapper with the entry's `command` (replacing its `<file>` with the temporary file path) and the same path as `<path>`:

```sh
( rc=0; <command> || rc=$?; rm -f "<path>"; exit "$rc" )
```

Unsupported OAuth providers do not block `complete`, because the wizard cannot configure them automatically. They are still surfaced in `oauth.unsupported` so you can warn the user to review them in the Clerk Dashboard.

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
| `Project linked`        | `clerk link`                                 |
| `Application reachable` | `clerk link`                                 |
| `Instance IDs`          | `clerk link`                                 |
| `Environment variables` | `clerk env pull`                             |
| `CLI version`           | (no auto-fix; run `clerk update`)            |
| `Shell completion`      | (no auto-fix; see `clerk completion --help`) |

All three remediation commands are themselves interactive by default: `auth login` opens a browser, `link` prompts for an app when `--app` is omitted, and `env pull` writes a file. In agent mode, prefer `clerk link --app <id>` over bare `clerk link`, since the bare form only works when silent autolink can resolve the target app without a picker.

## What NOT to do in agent mode

- **Don't ignore the sandbox warning.** If the CLI says host-only Clerk state or system capabilities may be unavailable, rerun the same command on the host before trusting the result.
- **Don't run `clerk auth login` just to bootstrap or configure a project** - it is not required. `clerk init` and most instance commands work with no account at all; see [auth.md](auth.md#accountless-operating-without-an-account) for the current list of which commands those are and which stay account-only. Log in only to claim the app, link a real app, or use account-only commands.
- **Don't assume an unclaimed app means a throwaway app.** The CLI follows the local `sk_` key, `sk_live_` included — in an unlinked repo holding a production key, `enable orgs` / `config patch` mutate production unconfirmed. Pass `--app <id>` when you mean a real app.
- **Don't assume `clerk auth login` is fully unattended from an agent** - it opens a browser and waits for a callback. Prefer `CLERK_PLATFORM_API_KEY` for headless automation. `clerk init --app <id>` or init in an already linked project may still invoke the normal login fallback when a real app target is explicit.
- **Don't call `clerk link` without `--app` and assume the agent can pick for you** - it only succeeds when silent autolink can determine the app from detected keys.
- **Don't run `clerk unlink` in agent mode without `--yes`** - it exits with a usage error instead of prompting.
- **Don't run `clerk config put` without `--dry-run` first** - it's a full replacement and is destructive.
- **Don't skip `--yes` on mutations and expect them to work** - agent mode disables prompts, so commands that require confirmation will error.
- **Don't read secret keys into your context or logs** - `clerk env pull --instance <id> --print` writes the production secret key to stdout so it can be piped straight into a hosting provider's CLI. Pipe it, and never print, read, or paste its output. For Vercel, run the `command` of the `complete` report's `hostSetup` entry for Vercel, copied verbatim, in bash or zsh: it reads the keys and `vercel env ls` before changing anything, stops with exit 1 if it can't read that list, stops with exit 3 if a production key is shared with another environment (ask the user, and rerun with `allow_shared=1` only once they agree), replaces production values with `--force` otherwise, and exits non-zero if the pull or any upload fails; redeploy only after it exits 0. For a host without a CLI, ask the user to run `clerk env pull --instance <id> --print` in a separate terminal, not through your session (a shell escape such as Claude Code's `!` would put the keys in your transcript), and add the lines themselves; on macOS, `clerk env pull --instance <id> --print | pbcopy` copies them without showing them. OAuth client secrets go into a file the user fills in, never into chat or onto the command line. `clerk config patch` and `config put` show secrets as `[REDACTED]` in what they print, but `--verbose` output can include raw error bodies, so don't use `--verbose` around secrets.
