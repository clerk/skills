---
name: clerk-cli
description: >
  Operate the Clerk platform from the terminal. Use when the user wants to run
  "clerk init", "clerk env pull", "clerk auth", "clerk api", "clerk doctor",
  "clerk config", "clerk apps", or any Clerk CLI command. Covers installation,
  agent-mode flags, and all command groups.
license: MIT
allowed-tools: Bash, Read, Grep, Skill
metadata:
  author: clerk
  version: 1.0.0
---

# Clerk CLI

> **Package**: `clerk` (npm/bun). Run `clerk --version` to check.

```bash
npm install -g clerk    # or: bun add -g clerk
```

## Agent Protocol

**Always pass `--mode agent`** — suppresses prompts, spinners, and color; returns structured output; fails fast.

**Pass `--yes`** on destructive commands: `unlink`, `config patch`, `config put`, mutating `api` calls, `update`.

## Command Overview

| Command | Description | Reference |
|---------|-------------|-----------|
| `clerk init` | Initialize Clerk in a project | [setup-commands.md](references/setup-commands.md) |
| `clerk auth login\|logout` | Authenticate via browser OAuth | [setup-commands.md](references/setup-commands.md) |
| `clerk link` | Link project to a Clerk app | [setup-commands.md](references/setup-commands.md) |
| `clerk unlink` | Remove project-to-app association | [setup-commands.md](references/setup-commands.md) |
| `clerk env pull` | Pull env vars to `.env.local` | [setup-commands.md](references/setup-commands.md) |
| `clerk apps list` | List Clerk applications | [management-commands.md](references/management-commands.md) |
| `clerk apps create` | Create a new Clerk application | [management-commands.md](references/management-commands.md) |
| `clerk config pull\|schema\|patch\|put` | Read or modify instance config | [management-commands.md](references/management-commands.md) |
| `clerk api` | Make authenticated API requests | [api-command.md](references/api-command.md) |
| `clerk doctor` | Check project integration health | [diagnostics.md](references/diagnostics.md) |
| `clerk whoami` | Show current authenticated user | [diagnostics.md](references/diagnostics.md) |
| `clerk open` | Open Clerk resources in browser | [diagnostics.md](references/diagnostics.md) |
| `clerk update` | Update the CLI | [diagnostics.md](references/diagnostics.md) |
| `clerk completion` | Generate shell autocompletion | [diagnostics.md](references/diagnostics.md) |

## Quick Start

```bash
clerk whoami --mode agent                        # 1. Verify auth
clerk init --mode agent --yes --no-skills        # 2. Init (auto-detects framework)
clerk env pull --mode agent                      # 3. Pull env vars
clerk doctor --json --mode agent                 # 4. Health check
```

For starter templates and headless CI patterns, see [setup-commands.md](references/setup-commands.md).

## Common Pitfalls

- **`config put` vs `config patch`**: `put` replaces the entire config — omitted keys revert to defaults. Use `patch` for partial updates.
- **`clerk link` in agent mode**: Always pass `--app <id>` — the interactive picker requires a TTY.
- **`clerk api ls`**: Reads a cached endpoint catalog, not the live API. Fetches the OpenAPI spec on first run or cache expiry.
- **Default instance is `dev`**: Pass `--instance prod` explicitly for production.

## When to Load References

- **Setup, auth, linking, env vars** → [setup-commands.md](references/setup-commands.md)
- **Apps, instance config** → [management-commands.md](references/management-commands.md)
- **Direct API calls** → [api-command.md](references/api-command.md)
- **Doctor, whoami, open, update** → [diagnostics.md](references/diagnostics.md)

## See Also

- `clerk-setup` - SDK-level installation patterns (manual alternative to `clerk init`)
- `clerk-backend-api` - Clerk Backend API schemas and endpoint reference (complement to `clerk api`)
