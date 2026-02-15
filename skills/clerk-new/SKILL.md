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
- Reconcile any additional args as overrides where they make sense.

---
## Framework Router:
**Next.js** — Follow all instructions in [`references/nextjs`](references/nextjs.md).

---

Exit task.
