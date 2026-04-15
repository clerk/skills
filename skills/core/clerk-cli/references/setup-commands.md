# Setup Commands

Commands for authenticating, initializing projects, linking apps, and pulling environment variables.

## clerk auth

Manage authentication with the Clerk platform. Required before using most other commands.

### clerk auth login

Opens a browser for OAuth authentication. Stores credentials locally after successful login.

Aliases: `signup`, `signin`, `sign-in` — all equivalent to `login`.

```bash
clerk auth login --mode agent
```

No additional flags beyond global options.

> **Agent note:** This command is intentionally interactive — it launches a browser for OAuth. There is no `--key` or `--token` flag for headless auth.
>
> **For headless CI/CD:** Skip `clerk auth login` entirely. Instead set `CLERK_SECRET_KEY` env var or pass `--secret-key <key>` to commands that support it (e.g., `clerk api`).

> **Shortcut:** `clerk login` is a top-level alias that bypasses the `auth` subgroup.

### Auth resolution order

Commands that need a secret key resolve credentials in this order:

1. `--secret-key` flag (highest priority)
2. `CLERK_SECRET_KEY` environment variable
3. Linked app credentials (from `clerk link`)

Config commands (`config pull/schema/patch/put`) use the Platform API instead — they authenticate via OAuth session or `CLERK_PLATFORM_API_KEY` env var.

### clerk auth logout

Remove stored credentials from the local machine.

Aliases: `signout`, `sign-out` — all equivalent to `logout`.

```bash
clerk auth logout --mode agent
```

No additional flags beyond global options.

> **Shortcut:** `clerk logout` is a top-level alias that bypasses the `auth` subgroup.

---

## clerk init

Initialize Clerk in a project. Installs the appropriate SDK package, creates/updates environment files, and adds configuration stubs (middleware, providers).

### Flags

| Flag | Type | Description |
|------|------|-------------|
| `--framework <name>` | string | Framework to set up. Choices: `next`, `astro`, `nuxt`, `tanstack-start`, `react-router`, `vue`, `expo`, `react`, `javascript`, `express`, `fastify`. Skips auto-detection when provided. |
| `--pm <manager>` | string | Package manager. Choices: `bun`, `pnpm`, `yarn`, `npm`. Skips prompt/auto-detection. |
| `--name <project-name>` | string | Project name (used with `--starter` only, skips prompt). |
| `--starter` | boolean | Create a new project from a starter template instead of initializing in an existing project. |
| `--prompt` | boolean | Output a setup prompt for an AI agent instead of running setup. Does not modify any files. |
| `--no-skills` | boolean | Skip the optional agent skills install prompt. |
| `--app <id>` | string | Link to a specific Clerk application during init. |
| `-y, --yes` | boolean | Skip all confirmation prompts. |

### What it does

1. Auto-detects the framework from `package.json` (unless `--framework` is provided)
2. Installs the appropriate SDK package (e.g., `@clerk/nextjs` for Next.js)
3. Creates or updates `.env.local` with placeholder Clerk keys
4. Adds `ClerkProvider` wrapper and middleware stubs where applicable
5. Optionally prompts to install Clerk agent skills (skip with `--no-skills`)

If Clerk is already initialized (SDK installed, files scaffolded), the command prints "Clerk is already set up in this project." and exits without modifying files.

### Agent-mode examples

```bash
# Existing project — auto-detect framework
clerk init --mode agent -y

# Explicit framework and package manager
clerk init --framework next --pm bun --mode agent -y

# New project from starter template
clerk init --starter --framework next --pm bun --name "my-saas" --mode agent -y

# Link to specific app during init
clerk init --app app_abc123 --mode agent -y

# Skip agent skills prompt
clerk init --mode agent -y --no-skills
```

### The `--prompt` flag

Outputs a short instruction telling an agent to run `clerk init -y`. Does not install anything or modify files.

```bash
clerk init --prompt
```

Use this to pass a setup hint to another agent session.

### Starter templates

```bash
clerk init --starter --framework next --pm bun --mode agent --yes
```

### Headless CI (no browser auth)

```bash
export CLERK_SECRET_KEY=sk_test_xxx
clerk api /users --secret-key $CLERK_SECRET_KEY --mode agent
```

---

## clerk link

Associate the current project directory with a Clerk application. Other commands (like `clerk env pull`) use this association to resolve which app to target.

### Flags

| Flag | Type | Description |
|------|------|-------------|
| `--app <id>` | string | Application ID to link directly (skips interactive picker). |

### What it does

Writes the linked application ID to the project's local configuration. Subsequent commands automatically target this app without needing `--app` on every call.

### Agent-mode examples

```bash
# Link to a specific app (required in agent mode)
clerk link --app app_abc123 --mode agent
```

> **Agent note:** Without `--app`, the command launches an interactive picker that requires a TTY. **Always pass `--app <id>` in agent mode** — omitting it will cause the command to fail in non-interactive environments.

### Finding your app ID

```bash
# List apps to find the ID
clerk apps list --json --mode agent
```

The output includes `application_id` fields like `app_abc123` that can be passed to `--app`.

---

## clerk unlink

Remove the project-to-app association created by `clerk link`.

### Flags

| Flag | Type | Description |
|------|------|-------------|
| `--yes` | boolean | Skip confirmation prompt. |

### Agent-mode example

```bash
clerk unlink --yes --mode agent
```

> Always pass `--yes` in agent mode — the confirmation prompt requires interactive input.

---

## clerk env pull

Pull environment variables (publishable key, secret key, and framework-specific variables) from Clerk and write them to an env file.

### Flags

| Flag | Type | Description |
|------|------|-------------|
| `--app <id>` | string | Application ID to target. Works from any directory (does not require `clerk link`). |
| `--instance <id>` | string | Instance to target: `dev`, `prod`, or a full instance ID. Default: `dev`. |
| `--file <path>` | string | Target env file. Default: auto-detect (usually `.env.local`). |

### What it writes

Depending on the framework, the output file will contain:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_PUBLISHABLE_KEY` (or framework equivalent)
- `CLERK_SECRET_KEY`
- Any additional framework-specific variables

### Agent-mode examples

```bash
# Pull dev keys to .env.local (default)
clerk env pull --mode agent

# Pull production keys
clerk env pull --instance prod --mode agent

# Write to a custom file
clerk env pull --file .env --mode agent

# Pull from a specific app (no clerk link required)
clerk env pull --app app_abc123 --mode agent

# Pull production keys from a specific app to a custom file
clerk env pull --app app_abc123 --instance prod --file .env.production --mode agent
```

### Important notes

- This command does **not** accept `--secret-key`. It resolves credentials via the Clerk OAuth session (from `clerk auth login`) or a linked app (`--app`). There is no mechanism to derive publishable keys from a secret key alone.
- For CI without a linked project, use `clerk env pull --app <id>` after authenticating with `clerk auth login`, or set `CLERK_SECRET_KEY` directly in your CI environment.
- If the target file already exists, existing Clerk keys are updated in place. Non-Clerk variables in the file are preserved.
