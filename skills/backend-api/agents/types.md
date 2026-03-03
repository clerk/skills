# Type Generator

## Input

Agent input: the tokens following the `types` command from the router.
Examples: `sync`, `sync plans permissions`, `sync --dry-run`, `sync roles --overwrite`, `help`

## Rules

- Always read template files fresh using the Read tool — do not rely on prior conversation context.
- Always read `references/type-generation.md` before generating output.
- Do NOT read reference files or templates ahead of when they are needed. Only read a file at the step that requires it.

## Options

Extract these flags from the input:
- `-c [cat]`, `--category [cat]` — filter to specific category (repeatable)
- `--overwrite` — skip overwrite confirmation
- `--dry-run` — print the diff / generated output without writing files

The `-o`/`--out` global option is handled by the router. See `references/api-specs.md` for resolution rules.

## Output style

Do not narrate mode resolution or internal routing to the user. Just execute the command and present the results.

## Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| `help` | Input is only `help` / `-h` / `--help` | Print command help, stop |
| `sync` | **Default.** Everything else — including bare flags like `--dry-run`, category names, or `sync` keyword | Generate types and constants, optionally filtered by categories |

## Category parsing

Categories can be passed as positional args after `sync` or via `-c`/`--category` flags. If no categories are specified, all categories are selected.

Valid categories:

| Category | API calls | Template asset | Output file |
|----------|-----------|----------------|-------------|
| `roles` | `GET /organization_roles`, `GET /role_sets` | `assets/types-template.ts` | `<outdir>/types/types.ts` |
| `permissions` | `GET /organization_permissions` | `assets/types-template.ts` | `<outdir>/types/types.ts` |
| `plans` | `GET /billing/plans` | `assets/constants-template.ts` | `<outdir>/types/constants.ts` |

---

### Step 0: Help

**Mode:** `help` only — **Skip** for `sync`.

Print the following verbatim:

```
Usage: /clerk-backend-api types sync [categories...] [options]

Syncs TypeScript types from your Clerk dashboard.
Running with no categories generates everything.

Categories:
  roles                 Organization roles and role sets
  permissions           Organization permissions
  plans                 Billing plans

Examples:
  /clerk-backend-api types sync                          — generate all types and constants
  /clerk-backend-api types sync plans permissions        — generate only plans + permissions
  /clerk-backend-api types sync plans --overwrite        — skip overwrite confirmation
  /clerk-backend-api types sync --dry-run                — print diff without writing
  /clerk-backend-api types sync -c plans -c permissions  — filter via flags

Options:
  -c, --category [cat]   Filter to specific category (repeatable)
  --overwrite            Skip overwrite confirmation
  --dry-run              Print diff / generated output without writing files
  --help, -h, help       Show this help
```

Stop here.

---

### Step 1: Resolve output directory

**Mode:** `sync` only — **Skip** for `help`.

Use the `<outdir>` resolved by the router (see `references/api-specs.md`). Types are written to `<outdir>/types/`.

---

### Step 2: Fetch data from API

**Mode:** `sync` only — **Skip** for `help`.

Execute the appropriate API calls based on selected categories:

| Category | Commands |
|----------|----------|
| `roles` | `bash scripts/openapi/execute-request.sh GET /organization_roles` and `bash scripts/openapi/execute-request.sh GET /role_sets` |
| `permissions` | `bash scripts/openapi/execute-request.sh GET /organization_permissions` |
| `plans` | `bash scripts/openapi/execute-request.sh GET /billing/plans` |

**IMPORTANT:** This step is a data-fetching step only. Once all calls return, you MUST continue to Step 3.

---

### Step 3: Read templates and generate output

**Mode:** `sync` only — **Skip** for `help`.

1. Read `references/type-generation.md` for generation rules.
2. Read the applicable template asset(s) using the Read tool:
   - `assets/types-template.ts` — for `roles` and/or `permissions` categories
   - `assets/constants-template.ts` — for `plans` category
3. Replace placeholder values in the template with real API data, following the rules in the reference doc.

**IMPORTANT:** Always read template files fresh. Do NOT rely on prior conversation context.

---

### Step 4: Write output

**Mode:** `sync` only — **Skip** for `help`.

If `--dry-run`, print the diff (or "already up to date" if no changes) and stop.

Otherwise:
1. If the output file already exists, diff it against the new content.
2. If no changes, tell the user the file is already up to date. Stop.
3. If changes exist and `--overwrite` was NOT passed, show the diff and ask the user to confirm before writing.
4. Write the file(s) to the resolved output directory.
