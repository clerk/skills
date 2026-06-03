# Clerk Skills

AI agent skills for Clerk authentication. 21 flat public skills in one installable bundle, plus internal maintenance skills under `.agents/skills/`.

## Structure

```
skills/
├── clerk/                         # orchestrator/router skill
├── clerk-cli/
├── clerk-setup/
├── clerk-custom-ui/
├── clerk-backend-api/
├── clerk-nextjs-patterns/
├── clerk-react-patterns/
├── clerk-react-router-patterns/
├── clerk-vue-patterns/
├── clerk-nuxt-patterns/
├── clerk-astro-patterns/
├── clerk-tanstack-patterns/
├── clerk-expo-patterns/
├── clerk-expo/
├── clerk-chrome-extension-patterns/
├── clerk-orgs/
├── clerk-billing/
├── clerk-webhooks/
├── clerk-testing/
├── clerk-swift/
└── clerk-android/
```

Internal maintenance skills live in `.agents/skills/`. Mirror each one into `.claude/skills/` with a symlink to the same directory.

## Plugin Registry

`.claude-plugin/plugin.json` - Claude plugin manifest for the full flat skills bundle.
`.claude-plugin/marketplace.json` - Claude marketplace entry for installing this plugin from the repo.
`.codex-plugin/plugin.json` - Codex plugin manifest for the full skills bundle.
`.cursor-plugin/plugin.json` - Cursor plugin manifest for the same flat skills bundle.
`.agents/plugins/marketplace.json` - Codex marketplace registry for installing the plugin.

## Contributing

1. Each skill needs `SKILL.md` with YAML frontmatter (`name`, `description`, `license`)
2. Place each skill directly in `skills/<skill-name>/`
3. Skill names use `clerk-` prefix (e.g. `clerk-nextjs-patterns`)
4. Folder names keep the `clerk-` prefix (e.g. `skills/clerk-nextjs-patterns/`)
5. Plugin manifests should rely on `skills/` directory discovery where supported; only add explicit manifest paths for non-skill components.
6. Run `bun run validate` before opening a PR.
