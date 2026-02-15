# Create Clerk App Instance

## Collect Options

| Option | CLI | Required | Default | Description |
|--------|-----|----------|---------|-------------|
| App name | `<name>` | yes | — | Display name for the Clerk app instance (capital case) |
| Template | `-t <template>` | no | `b2b-saas` | Enables additional Clerk features: `b2b-saas`, `b2c-saas`, or `waitlist` |

- If no app name was provided, prompt for one — suggest `My Clerk App`.

## Run Command

> Replace `directory` with the one selected in previous step (or use '.' for cwd if that was chosen).

```bash
bash ./.claude/skills/clerk-new/scripts/setup.sh --t <template> -o <directory> [name] 
```