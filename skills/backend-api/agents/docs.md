# API Docs

## Input

Agent input: the tokens following the `docs` command from the router.
Examples: _(empty)_, `Users`, `GET /users`, `GET /users -v 2025-11-10`

## Setup

Read `references/api-specs.md` for spec resolution, caching, and script usage rules. Follow those rules throughout this agent.

**Skip spec loading for `help` mode.**

## Options

Extract these flags from the input:
- `-v [date]`, `--version [date]`, or `version [date]` — use a specific spec version
- `--no-cache` — fetch latest spec from GitHub and update cache

## Modes

Determine the active mode from the remaining input (after flags are removed):

| Mode | Trigger | Behavior |
|------|---------|----------|
| `help` | Input is only `help` / `-h` / `--help` | Print command help, stop |
| `browse-tags` | Input is empty | List all tags |
| `browse-endpoints` | Input is a tag name (e.g. `Users`) | List endpoints for that tag |
| `detail` | Input is a specific endpoint (e.g. `GET /users`) | Show endpoint schema |

---

### Step 0: Help

**Mode:** `help` only — **Skip** for all other modes.

Print the following verbatim:

```
Usage: /clerk-backend-api docs [endpoint | tag] [options]

Browse:
  /clerk-backend-api docs                             — list all tags
  /clerk-backend-api docs Users                       — browse endpoints for the Users tag
  /clerk-backend-api docs Users -v 2025-11-10         — browse using a different version
  /clerk-backend-api docs version 2025-11-10          — list tags for a different version

Inspect:
  /clerk-backend-api docs GET /users                  — show endpoint schema
  /clerk-backend-api docs GET /users -v 2025-11-10    — show schema for a different version

Options:
  -v, --version [date], version [date]   — use a specific spec version
  --no-cache                             — fetch latest spec from GitHub, update cache
  --help, -h, help                       — show this help
```

Stop here.

---

### Step 1: Browse tags

**Mode:** `browse-tags` only — **Skip** for all other modes.

If using a non-latest version, fetch tags for that version using the extract-tags script from the reference doc. Otherwise, use the **TAGS** already from the spec context.

Share tags in a table and prompt the user to select a query.

---

### Step 2: Browse tag endpoints

**Mode:** `browse-endpoints` only — **Skip** for all other modes.

Fetch all endpoints for the identified tag using the extract-tag-endpoints script from the reference doc.

Share the results (endpoints, schemas, parameters) with the user.

---

### Step 3: Endpoint detail

**Mode:** `detail` only — **Skip** for all other modes.

For natural language input, first identify the matching endpoint by searching the tags in context. Fetch tag endpoints if needed to resolve the exact path and method.

Extract the full endpoint definition using the extract-endpoint-detail script from the reference doc.

Share the endpoint definition and schemas with the user.
