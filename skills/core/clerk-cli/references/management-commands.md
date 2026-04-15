# Management Commands

Commands for managing Clerk applications and instance configuration.

## clerk apps

Manage Clerk applications from the terminal.

### clerk apps list

List all Clerk applications associated with the authenticated account.

| Flag | Type | Description |
|------|------|-------------|
| `--json` | boolean | Output as JSON. |

```bash
# Human-readable table
clerk apps list --mode agent

# Machine-readable JSON
clerk apps list --json --mode agent
```

JSON output shape (top-level array):

```json
[
  {
    "application_id": "app_abc123",
    "name": "My App",
    "instances": [...]
  }
]
```

Use the `application_id` field from this output with `--app` flags on other commands. An empty account returns `[]`.

### clerk apps create

Create a new Clerk application.

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<name>` | string | Yes | Application name (positional argument). |

| Flag | Type | Description |
|------|------|-------------|
| `--json` | boolean | Output as JSON. |

```bash
# Create an app
clerk apps create "My SaaS App" --mode agent

# Create and capture the ID
clerk apps create "My SaaS App" --json --mode agent
```

> **Agent note:** `clerk apps create` does not prompt for confirmation. Always use `--json` in agent mode to capture the new app ID programmatically.

JSON output shape:

```json
{
  "application_id": "app_xyz789",
  "name": "My SaaS App"
}
```

---

## clerk config

Read and modify instance configuration. An "instance" is a Clerk environment (development or production) within an application.

Config values are JSON objects organized by key (e.g., `social_login`, `password_settings`, `session_settings`). Use `config schema` to discover available keys and their shapes.

### Shared flags (all config subcommands)

| Flag | Type | Description |
|------|------|-------------|
| `--app <id>` | string | Application ID to target. Works from any directory. |
| `--instance <id>` | string | Instance to target: `dev`, `prod`, or a full instance ID. **Default: `dev`.** |

> **Note:** Config commands do **not** accept `--secret-key`. They authenticate via the Platform API using your OAuth session (from `clerk auth login`) or `CLERK_PLATFORM_API_KEY` env var.

### clerk config pull

Read the current instance configuration.

| Flag | Type | Description |
|------|------|-------------|
| `--output <file>` | string | Write config to a file instead of stdout. |
| `--keys <keys...>` | string[] | Retrieve only specific config keys. |

```bash
# Print entire dev config to stdout
clerk config pull --mode agent

# Pull production config to a file
clerk config pull --instance prod --output prod-config.json --mode agent

# Pull a single config key
clerk config pull --keys social_login --mode agent

# Pull multiple specific keys
clerk config pull --keys social_login password_settings --mode agent
```

Use `config pull` to snapshot configuration before making changes. This enables safe rollback if a patch or put goes wrong.

### clerk config schema

Retrieve the JSON schema describing available config keys and their allowed values.

| Flag | Type | Description |
|------|------|-------------|
| `--output <file>` | string | Write schema to a file instead of stdout. |
| `--keys <keys...>` | string[] | Schema for specific config keys only. |

```bash
# Full schema — discover all available config keys
clerk config schema --mode agent

# Schema for a specific key — understand its shape before patching
clerk config schema --keys social_login --mode agent

# Save to file for reference
clerk config schema --output schema.json --mode agent
```

**Always run `config schema` before patching** to understand the expected shape and allowed values for config keys.

### clerk config patch (PARTIAL UPDATE)

Merge changes into the existing instance configuration. Only the keys provided in the payload are modified — all other keys remain unchanged.

| Flag | Type | Description |
|------|------|-------------|
| `--file <path>` | string | Read config JSON from a file. One of `--file` or `--json` required. |
| `--json <string>` | string | Pass config JSON inline. One of `--file` or `--json` required. |
| `--dry-run` | boolean | Preview the change without applying it. |
| `--yes` | boolean | Skip confirmation prompt. |
| `--destructive` | boolean | Allow destructive changes that delete resources (e.g., session templates, custom OAuth providers). |

```bash
# Inline JSON patch
clerk config patch --json '{"social_login":{"enabled":true}}' --yes --mode agent

# Patch from file
clerk config patch --file config-changes.json --yes --mode agent

# Preview before applying
clerk config patch --file config-changes.json --dry-run --mode agent

# Patch production
clerk config patch --instance prod --file config-changes.json --yes --mode agent

# Allow destructive changes
clerk config patch --file config-changes.json --yes --destructive --mode agent
```

> **`patch` vs `put`:** `patch` merges with existing config. Keys not in the payload are untouched. **Prefer `patch` over `put` for targeted changes.**

> **`--destructive` flag:** Required when the patch would delete resources (custom OAuth providers, session templates). Without this flag, the operation resets affected resources to defaults instead of deleting them. When in doubt, use `--dry-run` first.

### clerk config put (FULL REPLACE)

Replace the **entire** instance configuration. Any config keys not included in the payload revert to their default values.

| Flag | Type | Description |
|------|------|-------------|
| `--file <path>` | string | Read config JSON from a file. One of `--file` or `--json` required. |
| `--json <string>` | string | Pass config JSON inline. One of `--file` or `--json` required. |
| `--dry-run` | boolean | Preview the replacement without applying it. |
| `--yes` | boolean | Skip confirmation prompt. |
| `--destructive` | boolean | Allow destructive changes that delete resources. |

> **CAUTION:** `put` replaces the entire config. Omitted keys revert to defaults. Always pull the current config first, edit it, then put it back.

### Safe `put` workflow

```bash
# 1. Snapshot current config
clerk config pull --output current.json --mode agent

# 2. Edit current.json (make your changes)

# 3. Preview the replacement
clerk config put --file current.json --dry-run --mode agent

# 4. Apply (only after reviewing the dry-run output)
clerk config put --file current.json --yes --mode agent
```

### Production config workflow

```bash
# 1. Pull production config
clerk config pull --instance prod --output prod.json --mode agent

# 2. Edit prod.json

# 3. Preview
clerk config patch --instance prod --file prod.json --dry-run --mode agent

# 4. Apply
clerk config patch --instance prod --file prod.json --yes --mode agent
```

### Common config keys

Use `clerk config schema --mode agent` for the full list. Common keys include:

| Key | Description |
|-----|-------------|
| `social_login` | Social provider configuration (Google, GitHub, etc.) |
| `password_settings` | Password policies and requirements |
| `session_settings` | Session lifetime, token configuration |
| `sign_up_settings` | Sign-up form configuration |
| `sign_in_settings` | Sign-in methods and strategies |
| `email_settings` | Email verification, templates |
| `organization_settings` | Organization features and permissions |
