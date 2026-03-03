---
name: clerk-backend-api
description: "Clerk backend REST API"
argument-hint: "<command> [subcommand] [options]"
allowed-tools: Bash, Read, Grep, Write, Glob, WebFetch
---

## User input

Full User Prompt: $ARGUMENTS
Command: $0 

## Output style

**CRITICAL:** Do not narrate internal reasoning to the user as it relates to command routing, mode resolution, or options parsing. Do not say things like "Command is X, remaining tokens are Y" or "Let me read the agent file." Silently route to the correct agent and present only the agent's output.

## Command routing

Use `Command` in [User input](#user-input) to determine which agent to spawn:
If the value of `Command` does not match a known command, infer the goal from the `Full User Prompt` and suggest the right command.

| Command | Agent | Agent file location |
|---|---|---|
| _(empty)_, `help`, `-h`, `--help` | Global help | _(none — print help below)_ |
| `docs` | API Docs | `agents/docs.md` |
| `request` | API Request | `agents/request.md` |
| `types` | Type Generator | `agents/types.md` |

---

## Global help

Print the following verbatim:

```
Usage: /clerk-backend-api <command> [subcommand] [options]

Commands:
  docs      Browse and inspect Clerk Backend API endpoints
  request   Execute Clerk Backend API requests
  types     Generate TypeScript types from your Clerk dashboard

Docs examples:
  /clerk-backend-api docs                      — list all API tags
  /clerk-backend-api docs Users                — browse endpoints for Users
  /clerk-backend-api docs GET /users           — inspect endpoint schema
  /clerk-backend-api docs GET /users -v 2025-11-10

Request examples:
  /clerk-backend-api request GET /users        — fetch all users
  /clerk-backend-api request POST /invitations — create an invitation

Type generation examples:
  /clerk-backend-api types sync                — generate all types and constants
  /clerk-backend-api types sync plans          — generate only plan constants
  /clerk-backend-api types sync roles permissions --dry-run

Global options:
  -o, --out [dir]                               — output directory (default: <project_root>/.clerk/)
  --help, -h, help                             — show this help

Run /clerk-backend-api <command> --help for command-specific help.
```

Stop here.

---

## Global options

Extract these flags from the full user prompt before routing:
- `-o, --out [dir]` — output directory. See `references/api-specs.md` for resolution rules.

## Delegation

Once the command is resolved:

1. Extract global options (`-o`/`--out`) from the input and resolve them per `references/api-specs.md`.
2. Read the corresponding agent file using the Read tool.
3. Follow all instructions in the agent file. **The [Output style](#output-style) rule above remains in effect throughout — it applies to you and all agent instructions you follow.**
4. Pass the **remaining tokens** (everything after the command name, minus global options) as the agent's input.
5. Pass the resolved `<outdir>` to the agent.

Do NOT fetch API spec context (`scripts/openapi/api-specs-context.sh`) at the router level. Each agent decides whether and when to fetch it.
