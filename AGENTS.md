# Clerk Skills

AI agent skills for Clerk authentication. 20 flat skills in one installable bundle.

## Structure

```
skills/
├── clerk/                         # orchestrator/router skill
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

## Plugin Registry

`.claude-plugin/plugin.json` - Claude plugin manifest for the full flat skills bundle.
`.claude-plugin/marketplace.json` - Claude marketplace entry for installing this plugin from the repo.
`.codex-plugin/plugin.json` - Codex plugin manifest for the full skills bundle.
`.cursor-plugin/plugin.json` - Cursor plugin manifest for the same flat skills bundle.
`.agents/plugins/marketplace.json` - Codex marketplace registry for installing the plugin.

## Contributing

1. Each skill needs `SKILL.md` with YAML frontmatter (`name`, `description`, `license`)
2. Place each skill directly in `skills/<skill-name>/`
3. Add the flat skill path to `.claude-plugin/marketplace.json`
4. Skill names use `clerk-` prefix (e.g. `clerk-nextjs-patterns`)
5. Folder names keep the `clerk-` prefix (e.g. `skills/clerk-nextjs-patterns/`)
6. When adding, removing, or moving skills, keep applicable marketplace manifests in sync.
7. Run `bun run validate` before opening a PR.
