# Diagnostics & Utility Commands

Commands for checking integration health, verifying authentication, and managing the CLI itself.

## clerk doctor

Run health checks on the current project's Clerk integration. Validates CLI version, auth status, linked app, environment variables, SDK version, and middleware configuration.

### Flags

| Flag | Type | Description |
|------|------|-------------|
| `--verbose` | boolean | Show detailed output for each check. |
| `--json` | boolean | Output results as JSON. |
| `--spotlight` | boolean | Only show warnings and failures (suppress passing checks). |
| `--fix` | boolean | Attempt to auto-fix detected issues. |

### What it checks

- CLI version — is it up to date?
- Auth status — is the user logged in? Is the token valid?
- Linked app — is the project linked? Is the application reachable? Are instance IDs current?
- Environment variables — are `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` present and correctly formatted?
- CLI configuration — is the config file valid?
- Shell completion — is autocompletion installed?

### Exit codes

- `0` — all checks pass (or only warnings)
- `1` — at least one check failed

### `--fix` scope

Auto-fix runs one of three repair actions depending on the failing check:

| Fix action | Triggered by |
|------------|-------------|
| Re-run `clerk auth login` | Not logged in, invalid/expired token, missing CLI config |
| Re-run `clerk link` | Project not linked, app unreachable (404), stale instance IDs |
| Re-run `clerk env pull` | Missing environment variables |

It cannot fix CLI version warnings, shell completion issues, or problems requiring code changes (e.g., middleware misconfiguration). Use `--spotlight` first to review failures before applying `--fix`.

### Agent-mode examples

```bash
# Machine-readable health check
clerk doctor --json --mode agent

# Only show problems
clerk doctor --spotlight --mode agent

# Auto-fix issues and report results
clerk doctor --fix --json --mode agent

# Detailed output for debugging
clerk doctor --verbose --mode agent
```

### JSON output shape

```json
{
  "checks": [
    {
      "name": "clerk-version",
      "status": "pass",
      "message": "Clerk CLI is up to date"
    },
    {
      "name": "env-vars",
      "status": "fail",
      "message": "CLERK_SECRET_KEY is missing from .env.local"
    }
  ],
  "overall": "fail"
}
```

Each check has a `status` of `pass`, `warn`, or `fail`. The `overall` field reflects the worst status across all checks.

### Using doctor in CI

```bash
# Fail the pipeline if any check fails
clerk doctor --json --mode agent
# Exit code 1 triggers CI failure automatically
```

---

## clerk whoami

Show the email address of the currently authenticated Clerk account.

```bash
clerk whoami --mode agent
```

No additional flags beyond global options. Output is plain text (the email address). Returns exit code `1` if not authenticated.

Use this to verify auth status before running other commands:

```bash
clerk whoami --mode agent && clerk env pull --mode agent
```

---

## clerk open

Open Clerk resources in the default browser. Currently, `dashboard` is the only subcommand. Run `clerk open --help --mode agent` to check for additional subcommands in your CLI version.

### clerk open dashboard

Open the linked application's dashboard, optionally navigating to a specific subpath.

| Argument | Type | Description |
|----------|------|-------------|
| `[subpath]` | string | Optional dashboard page: `users`, `api-keys`, `settings`, etc. |

| Flag | Type | Description |
|------|------|-------------|
| `--print` | boolean | Print the URL without opening the browser. |

```bash
# Open the dashboard (human mode)
clerk open dashboard

# Print the URL only (agent-safe — no browser launch)
clerk open dashboard --print --mode agent

# Open a specific dashboard page
clerk open dashboard users --print --mode agent
clerk open dashboard api-keys --print --mode agent
clerk open dashboard settings --print --mode agent
```

> **Agent note:** Always use `--print` in agent mode. Without it, the command attempts to open a browser, which fails in headless environments and may hang indefinitely.

---

## clerk update

Update the CLI binary to the latest version.

### Flags

| Flag | Type | Description |
|------|------|-------------|
| `--channel <tag>` | string | npm dist-tag to update to. Common values: `latest` (default), `canary`. Any valid dist-tag is accepted. |
| `-y, --yes` | boolean | Skip confirmation prompt. |

```bash
# Update to latest stable
clerk update --yes --mode agent

# Update to canary
clerk update --channel canary --yes --mode agent
```

> Always pass `--yes` in agent mode to skip the confirmation prompt.

---

## clerk completion

Generate shell autocompletion scripts. This is a developer workstation setup command — not typically used by agents.

| Argument | Type | Description |
|----------|------|-------------|
| `[shell]` | string | Shell type. Choices: `bash`, `zsh`, `fish`, `powershell`. |

### Installation by shell

| Shell | One-time setup |
|-------|----------------|
| **Bash** | `clerk completion bash > /etc/bash_completion.d/clerk` |
| **Zsh** | `mkdir -p ~/.zfunc && clerk completion zsh > ~/.zfunc/_clerk`, then add to `~/.zshrc`: `fpath=(~/.zfunc $fpath); autoload -Uz compinit && compinit` |
| **Fish** | `clerk completion fish > ~/.config/fish/completions/clerk.fish` |
| **PowerShell** | `clerk completion powershell >> $PROFILE` |

For temporary use in the current session:

```bash
eval "$(clerk completion bash)"   # Bash
eval "$(clerk completion zsh)"    # Zsh
```
