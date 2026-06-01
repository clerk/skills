# Clerk Skills

AI agent skills for Clerk authentication. 21 public skills across 4 categories, plus internal maintenance skills under `.agents/skills/`.

## Structure

```
skills/
├── core/                          # clerk, cli, setup, custom-ui, backend-api
├── frameworks/            # nextjs, react, vue, nuxt, astro, tanstack, expo, react-router, chrome-extension
├── features/                      # orgs, webhooks, testing
└── mobile/                 # swift, android
```

Internal maintenance skills live in `.agents/skills/`. Mirror each one into `.claude/skills/` with a symlink to the same directory.

## Plugin Registry

`.claude-plugin/marketplace.json` - Anthropic plugin format with 4 grouped plugins.

## Contributing

1. Each skill needs `SKILL.md` with YAML frontmatter (`name`, `description`, `license`)
2. Place in the correct category directory
3. Add to `.claude-plugin/marketplace.json` under the matching plugin group
4. Skill names use `clerk-` prefix (e.g. `clerk-nextjs-patterns`)
5. Folder names keep the `clerk-` prefix (e.g. `frameworks/clerk-nextjs-patterns/`)
