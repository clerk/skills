---
name: clerk-type-gen
description: "Generate and sync types for permissions, roles and more from your Clerk dashboard"
argument-hint: "[category]"
allowed-tools: Read, Write, Skill, Glob, Grep
---

## Options context

User Prompt: $ARGUMENTS

## Flags

Parse these from the user prompt before determining mode:
- `--dry-run` / `dry run` — print output without writing to filesystem
- `--overwrite` — bypass file overwrite confirmation
- `--out <dir>` — custom output directory

## Your Task

**IMPORTANT:** This skill is a multi-step pipeline that can run sub-skills as intermediate steps. You MUST complete ALL steps in sequence — do NOT stop after fetching data or running sub-skills.

**Rules:**
- Follow all steps in their sequential order unless explicitly instructed to skip.
- Do NOT read reference files or templates ahead of when they are needed. Only read a file at the step that requires it.

---

### 0. Help Check

If prompt contains only `help` / `-h` / `--help`, print the following verbatim (without additional commentary) and **stop**:

Generate typescript types or constants from your Clerk dashboard and keep them in sync.

```
Commands
  /clerk-type-gen                    — Sync all categories (or init if first run)
  /clerk-type-gen sync               — Same as above
  /clerk-type-gen init               — Initialize output dir with all types & constants
  /clerk-type-gen roles              — Generate types for roles & rolesets
  /clerk-type-gen permissions        — Generate types for permissions
  /clerk-type-gen features           — Generate types for features
  /clerk-type-gen plans              — Generate types for billing plans

Options
  --overwrite                        — Bypass file overwrite confirmation
  --out <dir>                        — Output directory (defaults to '.generated/clerk')
  --help, -h, help                   — Print skill information and examples
  --dry-run, dry run                 — Print output without writing to filesystem
```

---

### 1. Resolve Output Directory & Determine Mode

Resolve the output directory **first**, then determine the mode.

#### Step 1a: Resolve output directory
1. If `--out <dir>` was provided, use that directory.
2. Otherwise, scan the project for an existing `.generated` directory. If found, ask the user: "Found `.generated` at `<path>` — use this for output?"
3. If no directory was found or the user declined, default to `.generated/clerk/` in the project root.

#### Step 1b: Determine mode

| Prompt contains | Output dir exists? | Resolved mode |
|-----------------|--------------------|---------------|
| `init` | — | `init` |
| specific categories (`roles`, `permissions`, `features`, `plans`) | — | `category` |
| `sync`, empty prompt, or no args | **yes** | `sync` |
| `sync`, empty prompt, or no args | **no** | `init` |

---

### 2. Fetch Category Data

Fetch data via `Skill clerk-backend-api` using the query mapped to each requested category:

| Category | Query |
|----------|-------|
| `roles` | `"fetch all roles and rolesets"` |
| `permissions` | `"fetch all permissions"` |
| `plans` / `features` | `"fetch all plans"` |

For `init` and `sync` modes, fetch everything in a single query: `"fetch all roles, rolesets, permissions and plans"`.

When multiple individual categories are requested, combine them into a single query (e.g. `roles` + `permissions` → `"fetch all roles, rolesets, and permissions"`).

**IMPORTANT:** The Skill call above is a data-fetching step only. Once it returns, you MUST immediately continue to Step 3 using the returned data. Do NOT stop or summarize here.

---

### 3. Generate Output

For each applicable output file, **read the template file first**, then generate the output using the fetched data and the template.

**Output files**

| File | Template to read | Generated when |
|------|------------------|----------------|
| `types.ts` | [Types Template](./references/types-template.md) | Always (all modes) |
| `constants.ts` | [Constants Template](./references/const-template.md) | `init`, `sync`, or when `plans` and/or `roles` categories are requested |

**Steps:**
1. Read each applicable template file using the Read tool. Do NOT rely on prior conversation context — always read the file fresh.
2. Generate the output content by applying the fetched data to the template structure.
3. Only generate the sections relevant to the requested categories. For `init` and `sync` modes, generate all sections.

**Formatting rules**
- **Use JSDoc comments** — Each type must have a `/** type TypeName */` comment above it, matching the template examples.
- **Use tabs for indentation** — All union members must be indented with tabs and prefixed with `|`.
- Only include types relevant to the requested categories.

If `dry-run` mode, stop here and print output. Otherwise proceed to [Write to Filesystem](#4-write-to-filesystem).

---

### 4. Write to Filesystem

If in `dry-run` mode, skip this step.

#### Init mode
Create the output directory if it doesn't exist, then write all generated files.

#### Sync and category modes
For each generated file (`types.ts`, `constants.ts` if applicable):

1. **If the file does not exist:** write it directly.
2. **If the file exists:** read it and compare against the generated output.
   - For `sync`: compare the entire file.
   - For `category`: compare only the relevant sections for the requested categories.
3. **If there are no differences:** tell the user "`<filename>` is already up to date." and skip that file.
4. **If there are differences:**
   - If `--overwrite` was passed: write immediately.
   - For `sync`: ask the user "This will overwrite `<filename>`, proceed?"
   - For `category`: for each changed section, ask the user "This will overwrite the `<category>` section in `<filename>`, proceed?" Only replace confirmed sections, preserving all other sections intact.
