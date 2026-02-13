---
name: clerk-new
description: Uses clerk platform API to create a new clerk project.
argument-hint: [help]
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Skill, WebFetch
---

## Context

Arguments: $ARGUMENTS

## Your Task

Bootstrap a Clerk project using the platform API and framework CLIs.

### Modes

**`help`** — If arguments include `help`, `-h`, or `--help`:
- Show a table of all available options (both Clerk app creation and framework) as flags or natural language.
- Include a few example prompts.

**`dry-mode`** — If arguments include `dry-mode`, `--dry-mode`, `debug`, or `--debug`:
- Run through validation but print commands without executing them.

**`one-shot`** — If arguments include `one shot`, `one-shot`, or `--one-shot`:
- Accept all defaults and skip all interactive prompts.
- Use `test-app` as the directory and `My Test App` as the Clerk app name.
- Use shadcn.
- Reconcile any additional args as overrides where they make sense.

> [!IMPORTANT] Execution order
> Steps are sequential. **Do not read reference files for a later step before completing the current step.** Only read a reference when you are actively executing the step that requires it. In one-shot mode this is critical — all inputs for Step 1 are already known, so execute it immediately without reading any other files first.

---

### Step 1: Generate App

**Next.js** — Follow all instructions in [`references/nextjs`](references/nextjs).

---

### Step 2: Create Clerk App Instance

**Collect options**

| Option | CLI | Required | Default | Description |
|--------|-----|----------|---------|-------------|
| App name | `<name>` | yes | — | Display name for the Clerk app instance (capital case) |
| Template | `-t <template>` | no | `b2b-saas` | Enables additional Clerk features: `b2b-saas`, `b2c-saas`, or `waitlist` |

- If no app name was provided, prompt for one — suggest `My Clerk App`.

**Run command**

```bash
bash ./.claude/skills/clerk-new/scripts/setup.sh --t <template> -o <output> [name] 
```

Replace `directory` with the one selected in Step 1.

Exit task.
