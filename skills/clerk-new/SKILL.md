---
name: clerk-new
description: Uses clerk platform API to create a new clerk project.
argument-hint: [help] 
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Skill, WebFetch
---

## Context
Arguments: $ARGUMENTS 

## Your task

Bootstrap clerk projects using the clerk `platform api` and framework CLIs.

If any arguments provided mention `help` or `-h, --help`:
- show a table of all available options that user can provide for both `clerk app creation` and `framework` options (either as flags or natural language) 
- share a few `prompt` examples

If any arguments provided mention `dry-mode`, `--dry-mode` or `debug`, `--debug`, then run through validation but print any commands without running them.

If arguments includes `one shot`, `one-shot`, or `--one-shot`:
- accept all defaults and skip all interactive prompts
- use `test-app` as the directory and `My Test App` as the clerk app name
- use shadcn
- reconcile any additional args that make sense to add as additional options

> [!IMPORTANT] Execution order
> Steps are sequential. **Do not read reference files for a later step before completing the current step.** Only read a reference when you are actively executing the step that requires it. In one-shot mode this is critical — all inputs for Step 1 are already known, so execute it immediately without reading any other files first.


### Step 1: Generate App

**Next.js**<br/>
Follow all instructions in [`references/nextjs`](references/nextjs).


### Step 2: Create Clerk App Instance

**Collect options**

| Options |  CLI Options | Required | Default | Description |
|---------|--------------|----------|---------|-------------|
| `app name`| `<name>` | yes | n/a | The name of the clerk app instance |
| `template` |  `-t <template>`| no | `b2b-saas` | Template that enables additional clerk features. Options are one of: `b2b-saas`, `b2c-saas`,  or `waitlist` |

- If no `app name` was provided, prompt for one by suggesting `My Clerk App`.
> The name should be capital case / UI-display friendly.


**Run command**
Replace `directory` with the one selected for setting up project.
Run `bash .claude/skills/clerk-new/scripts/setup.sh [-t template] [-o directory] <name>` <br />


Exit task.

