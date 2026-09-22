# Clerk Skills

AI agent skills for Clerk authentication, packaged as one plugin for every agent harness, plus internal maintenance skills under `.agents/skills/`.

## Structure

The repo root is the plugin root.

```
skills/                            # one folder per skill, flat
plugin.json                        # Agent Plugins 1.0.0 manifest
mcp.json                           # Agent Plugins MCP config ("type": "streamable-http")
.mcp.json                          # Claude Code and older Codex MCP config ("type": "http")
.claude-plugin/plugin.json
.cursor-plugin/plugin.json
.codex-plugin/plugin.json          # also carries the OpenAI listing metadata
```

`skills/` is flat because plugin loaders only look one level down. A category folder hides every skill inside it.

Internal maintenance skills live in `.agents/skills/`. Mirror each one into `.claude/skills/` with a symlink to the same directory.

## Plugin Registry

`.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json`, `.agents/plugins/marketplace.json` - marketplace catalogs, each listing the one `clerk` plugin at `./`.

The manifests overlap on purpose: no single file is valid for every loader. `scripts/check.py` keeps them consistent and runs in CI.

`.claude-plugin/plugin.json` has no `version` on purpose. Claude Code keeps users on their cached copy while `version` is unchanged; without it, every commit is an update.

## Contributing

1. Each skill needs `SKILL.md` with YAML frontmatter (`name`, `description`, `license`)
2. Place it in `skills/<skill-name>/`. The folder name must match the frontmatter `name`
3. Skill names use `clerk-` prefix (e.g. `clerk-nextjs-patterns`)
4. Plugin names are permanent. Renaming or removing one needs a `renames` entry in `.claude-plugin/marketplace.json`
