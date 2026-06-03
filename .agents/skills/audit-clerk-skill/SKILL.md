---
name: audit-clerk-skill
description: Audits the bundled `clerk-cli` skill against the Clerk CLI source tree and proposes or applies updates. Use when the user says "audit the clerk-cli skill", "update the clerk-cli skill", "check clerk-cli against the CLI source", "resync clerk-cli skill", "run audit-clerk-skill", or after Clerk CLI commands, flags, or agent-mode behavior change.
license: MIT
effort: high
user-invocable: true
disable-model-invocation: true
argument-hint: "[--source <path>] [--apply]"
metadata:
  internal: true
---

# Clerk CLI Skill Audit

Cross-check `skills/core/clerk-cli/` in this repository against the actual Clerk CLI source and propose precise edits where the skill has drifted. The CLI is the source of truth; the skill is maintainer documentation that must track it.

This task needs a complete command inventory, not a quick grep pass. Build the source model first, then compare it to the skill's current claims.

## Inputs

- **CLI source of truth**: a `clerk/cli` checkout containing `packages/cli-core/src/commands/**`, plus `packages/cli-core/src/cli.ts`, `cli-program.ts`, `mode.ts`, and any referenced files in `packages/cli-core/src/lib/`.
- **Target skill**: `skills/core/clerk-cli/SKILL.md` and `skills/core/clerk-cli/references/*.md`.

## Source Checkout Resolution

Resolve the CLI source checkout in this order:

1. Use `--source <path>` when supplied. The path must contain `packages/cli-core/src/commands/`.
2. If the current repository itself contains `packages/cli-core/src/commands/`, use the current repository root.
3. If `CLERK_CLI_REPO` is set, use that path. Do not print the variable value if it contains sensitive path fragments.
4. In Conductor, look for exactly one sibling workspace matching `../cli/*/packages/cli-core/src/commands/`. If multiple match, ask which one to use.
5. If no checkout is available and network access is acceptable for the task, clone the public CLI repository into `.context/clerk-cli-source`:

```sh
mkdir -p .context
cd .context
git clone --depth 1 https://github.com/clerk/cli.git clerk-cli-source
```

If none of these work, stop and ask the user for a CLI source path. Do not audit against the installed `clerk` binary alone, because the binary may be stale and does not expose every source-level branch.

## Workflow

### 1. Inventory the CLI

Walk `packages/cli-core/src/commands/` and build a structured inventory. For each top-level command and subcommand capture:

- Full command path, such as `clerk config patch` or `clerk api ls`.
- Purpose, from the command description or help string in source.
- Flags, including short form, type, default, and destructive behavior.
- Exit codes beyond the default if the command overrides them.
- Agent-mode branches gated on `isAgentMode()`, `CLERK_MODE`, TTY detection, or related helpers.
- Whether the command mutates remote state and needs `--dry-run`, `--yes`, or production-targeting guidance.

Read `packages/cli-core/src/commands/<name>/README.md` as secondary context only. Use those files to flag mocked or stubbed commands and to cross-check API endpoint claims in `references/recipes.md`. Do not propose copying command READMEs into this repository; they include internal implementation detail and would bloat the skill.

Also capture cross-cutting behavior:

- Runner preference logic, including lockfile to package-runner mapping.
- Auth, key resolution, `--app`, and `--instance` targeting.
- `doctor` checks and `--json` output shape.
- Agent-mode behavior for prompts, JSON defaults, browser opening, OAuth callbacks, deploy handoff, and sandbox warnings.
- `clerk init --prompt` or equivalent handoff behavior if the skill mentions it.

Prefer reading source over running the binary. When runtime behavior is unclear, use tests under `packages/cli-core/src/**/*.test.ts` or `packages/cli-core/src/test/` as supporting evidence.

### 2. Extract the Skill's Claims

Read `skills/core/clerk-cli/SKILL.md` and each file under `skills/core/clerk-cli/references/`. Extract every concrete claim:

- Commands in the core command table and invocation guidance.
- Flags named in prose, tables, and examples.
- Agent-mode behavior bullets.
- Exit code, error format, and JSON output claims.
- Cross-references between `SKILL.md` and `references/*.md`.

### 3. Diff Source Against Skill

Produce a structured diff with four buckets:

1. **Missing from skill**: commands, subcommands, flags, or behaviors that exist in source but are not mentioned anywhere in the skill.
2. **Stale in skill**: claims in the skill that no longer match source, including renamed flags, changed defaults, removed commands, shifted exit codes, or reworked agent-mode branches.
3. **Thin in skill**: commands mentioned but under-specified relative to their real complexity or footgun surface.
4. **Over-specified**: details the skill encodes that `clerk <cmd> --help`, generated examples, or referenced files cover better.

For buckets 1 through 3, cite both the source file and line and the target skill location.

### 4. Decide Placement

Route changes by maintenance value:

- **Core loop, mental model, and safety** stay in `SKILL.md`.
- **Per-command flag details, recipes, and edge cases** belong in `references/recipes.md` or a new reference file.
- **Agent-mode branches** belong in `references/agent-mode.md`; `SKILL.md` gets only a concise summary.
- **Auth, key resolution, and targeting** belong in `references/auth.md`.

Prefer `clerk <command> --help` over duplicating generated help. Flags with destructive semantics, hidden interactions, or agent-mode divergence deserve skill coverage. Self-explanatory flags should usually be removed from prose and delegated to `--help`.

Treat skill shrinkage as a valid proposal when it reduces drift risk. The goal is an accurate, durable skill, not a larger one.

### 5. Propose Edits

Emit a review-ready proposal. For each change include:

- Path, such as `skills/core/clerk-cli/SKILL.md` or `skills/core/clerk-cli/references/agent-mode.md`.
- Severity: `drift`, `gap`, or `polish`.
- Why, with a source citation such as `packages/cli-core/src/commands/<cmd>/<file>.ts:<line>`.
- Target location in this repository.
- A unified diff when practical, otherwise a concise before and after block.

Group the proposal by target file. Do not rewrite accurate neighboring sections just because they are nearby.

### 6. Apply or Hand Back

Default behavior: present the proposal and stop for review.

If invoked with `--apply`, apply `drift` and `gap` edits directly, then list `polish` suggestions for review. After applying edits, run available formatting or validation commands for this repository. If no formatter exists, validate Markdown and JSON structure with lightweight checks.

## Guardrails

- Never invent flags. If a flag appears in tests but not in the command parser, mark it for human review.
- Preserve the existing `clerk-cli` skill's terse, third-person voice.
- Do not use em dashes in proposals or edits.
- Keep `skills/core/clerk-cli/SKILL.md` near the 500-line guidance. Move detailed material to `references/` instead of bloating the main skill.
- Do not treat the installed `clerk` binary as authoritative over source. Use `--help` only to confirm generated presentation when source and tests leave ambiguity.
- Do not commit or print secrets. If the audit touches env guidance, preserve the repository's 1Password and no-plaintext-secret rules.

## Output Shape

Return the proposal as:

```markdown
# clerk-cli skill audit - <YYYY-MM-DD>

## Summary
<counts per bucket, plus the largest drift>

## skills/core/clerk-cli/SKILL.md
### <section name>
- [drift|gap|polish] <one-line description>
  - source: packages/cli-core/src/commands/<...>:<line>
  - target: skills/core/clerk-cli/SKILL.md:<line>
  - change: <diff or concise before/after>

## skills/core/clerk-cli/references/<file>.md
...

## New files
...

## Open questions
...
```

Keep the result skimmable so a maintainer can approve, reject, or apply each entry independently.
