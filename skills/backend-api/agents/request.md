# API Request

## Input

Agent input: the tokens following the `request` command from the router.
Examples: `GET /users`, `POST /invitations`, `get user john_doe`, `DELETE /users/user_abc123`

## Setup

Read `references/api-specs.md` for spec resolution, caching, scope enforcement, and script usage rules. Follow those rules throughout this agent.

**Skip spec loading for `help` mode.**

## Options

Extract these flags from the input:
- `--admin` — bypass scope restrictions for write/delete
- `-v [date]`, `--version [date]`, or `version [date]` — use a specific spec version
- `--no-cache` — fetch latest spec from GitHub and update cache

## Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| `help` | Input is empty, or is only `help` / `-h` / `--help` | Print command help, stop |
| `execute` | Specific endpoint (e.g. `GET /users`) or natural language action | Look up endpoint, execute request |

---

### Step 0: Help

**Mode:** `help` only — **Skip** for `execute`.

Print the following verbatim:

```
Usage: /clerk-backend-api request <method> <path> [options]

Examples:
  /clerk-backend-api request GET /users              — fetch all users
  /clerk-backend-api request get user john_doe       — natural language works too
  /clerk-backend-api request POST /invitations       — create an invitation
  /clerk-backend-api request DELETE /users/user_123  — delete a user

Options:
  --admin                              — bypass scope restrictions for write/delete
  -v, --version [date], version [date] — use a specific spec version
  --no-cache                           — fetch latest spec from GitHub, update cache
  --help, -h, help                     — show this help
```

Stop here.

---

### Step 1: Resolve endpoint

**Mode:** `execute` only.

For natural language input, identify the matching endpoint by searching the tags in context. Fetch tag endpoints if needed to resolve the exact path and method.

Extract the full endpoint definition using the extract-endpoint-detail script from the reference doc.

---

### Step 2: Execute request

**Mode:** `execute` only.

Use the endpoint definition from step 1 to build the request:

1. Identify required and optional parameters from the spec.
2. Ask the user for any required path/query/body parameters.
3. Check scope enforcement rules from the reference doc for write operations.
4. Execute using the execute-request script from the reference doc.
5. Share the response with the user.
