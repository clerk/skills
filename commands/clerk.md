---
description: Load Clerk skill and get contextual guidance for any auth task
---

Load the Clerk authentication skill and help with any Clerk development task.

## Workflow

### Step 1: Check for --update-skill flag

If $ARGUMENTS contains `--update-skill`:

1. Run the update command:
   ```bash
   npx add-skill clerk/skills -y
   ```

2. Output success message and stop (do not continue to other steps).

### Step 2: Load clerk skill

```
skill({ name: 'clerk' })
```

### Step 3: Identify task type from user request

Analyze $ARGUMENTS to determine:
- **Task type**: setup, customize UI, sync data, test, orgs, troubleshoot
- **Platform**: Web (Next.js, React, Express, Remix)

Use decision trees in SKILL.md to select correct skill.

### Step 4: Read relevant skill files

Based on task type, load the appropriate skill:

| Task | Skill | Files to Read |
|------|-------|---------------|
| Add auth | `adding-auth/` | SKILL.md + gotchas.md |
| Custom UI | `customizing-auth-ui/` | SKILL.md + gotchas.md |
| Sync users | `syncing-users/` | SKILL.md + gotchas.md |
| Testing | `testing-auth/` | SKILL.md + gotchas.md |
| Multi-tenant | `managing-orgs/` | SKILL.md + gotchas.md |
| Next.js patterns | `nextjs-patterns/` | SKILL.md + relevant reference |
| Troubleshoot | `clerk-errors/` | SKILL.md |

### Step 5: Execute task

Apply Clerk patterns from skill to complete user's request.

### Step 6: Fallback for Unmatched Requests

If no skill matches the user's request:

1. Search Clerk docs for relevant content
2. If still unmatched, respond:

> I don't have a specific skill for this yet. Here are your options:
>
> 1. **Clerk Docs**: [Search for "{topic}"](https://clerk.com/docs)
> 2. **Request a Skill**: [Create an issue](https://github.com/clerk/skills/issues/new?template=skill-request.md&title=[SKILL]+{topic})
>
> Want me to help with the docs instead?

### Step 7: Summarize

```
=== Clerk Task Complete ===

Skill: <skill used>
Framework: <detected framework>

<brief summary of what was done>
```

<user-request>
$ARGUMENTS
</user-request>
