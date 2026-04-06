# Clerk Skills

AI agent skills for Clerk authentication. 18 skills across 4 categories.

## Structure

```
skills/
├── core/                          # clerk, setup, custom-ui, backend-api
├── frameworks/            # nextjs, react, vue, nuxt, astro, tanstack, expo, react-router, chrome-extension
├── features/                      # orgs, webhooks, testing
└── mobile/                 # swift, android
```

## Plugin Registry

`.claude-plugin/marketplace.json` - Anthropic plugin format with 4 grouped plugins.

## Contributing

1. Each skill needs `SKILL.md` with YAML frontmatter (`name`, `description`, `license`)
2. Place in the correct category directory
3. Add to `.claude-plugin/marketplace.json` under the matching plugin group
4. Skill names use `clerk-` prefix (e.g. `clerk-nextjs-patterns`)
5. Folder names keep the `clerk-` prefix (e.g. `frameworks/clerk-nextjs-patterns/`)
