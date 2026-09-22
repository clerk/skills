#!/usr/bin/env python3
"""Check that the per-harness manifests agree and each stays inside its loader's rules."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SPEC = "https://agent-plugins.org/schemas/1.0.0"

# Agent Plugins 1.0.0 closes the root manifest to these fields.
SPEC_MANIFEST_FIELDS = {
    "$schema", "name", "version", "description", "author",
    "homepage", "repository", "license", "keywords", "extensions",
}
# cursor/plugins schemas/plugin.schema.json sets additionalProperties: false.
CURSOR_MANIFEST_FIELDS = {
    "name", "displayName", "description", "version", "minClientVersions", "author", "publisher",
    "homepage", "repository", "license", "logo", "keywords", "category", "tags", "commands",
    "agents", "skills", "rules", "hooks", "variables", "mcpServers",
}
SKILL_NAME = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

errors: list[str] = []


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def check_manifests() -> None:
    manifests = {
        "plugin.json": load(REPO_ROOT / "plugin.json"),
        ".claude-plugin/plugin.json": load(REPO_ROOT / ".claude-plugin" / "plugin.json"),
        ".cursor-plugin/plugin.json": load(REPO_ROOT / ".cursor-plugin" / "plugin.json"),
        ".codex-plugin/plugin.json": load(REPO_ROOT / ".codex-plugin" / "plugin.json"),
    }
    # Claude Code keeps users on their cached copy while `version` is unchanged; without it, every commit is an update.
    claude = manifests.pop(".claude-plugin/plugin.json")
    check("version" not in claude, ".claude-plugin/plugin.json: must not set version")
    for field in ("name", "description"):
        check(claude.get(field) == manifests["plugin.json"].get(field), f".claude-plugin/plugin.json: {field} differs")
    for field in ("name", "version", "description"):
        values = {path: manifest.get(field) for path, manifest in manifests.items()}
        check(len(set(values.values())) == 1, f"manifests disagree on {field}: {values}")

    spec = manifests["plugin.json"]
    check(spec.get("$schema") == f"{SPEC}/plugin.schema.json", "plugin.json: wrong or missing $schema")
    extra = set(spec) - SPEC_MANIFEST_FIELDS
    check(not extra, f"plugin.json: fields outside the closed spec schema: {sorted(extra)}")

    cursor = manifests[".cursor-plugin/plugin.json"]
    extra = set(cursor) - CURSOR_MANIFEST_FIELDS
    check(not extra, f".cursor-plugin/plugin.json: fields Cursor's schema rejects: {sorted(extra)}")
    extra = set(cursor.get("author", {})) - {"name", "email"}
    check(not extra, f".cursor-plugin/plugin.json: author allows only name and email, found {sorted(extra)}")


def check_mcp() -> None:
    spec = load(REPO_ROOT / "mcp.json")
    native = load(REPO_ROOT / ".mcp.json")

    check(set(spec) == {"$schema", "mcpServers"}, "mcp.json: only $schema and mcpServers are allowed")
    check(spec.get("$schema") == f"{SPEC}/mcp.schema.json", "mcp.json: wrong or missing $schema")
    check(set(native) == {"mcpServers"}, ".mcp.json: expected only mcpServers")

    spec_servers = spec.get("mcpServers", {})
    native_servers = native.get("mcpServers", {})
    check(set(spec_servers) == set(native_servers), "mcp.json and .mcp.json list different servers")

    for name, server in spec_servers.items():
        check(server.get("type") == "streamable-http", f"mcp.json: {name} must use type streamable-http")
        extra = set(server) - {"type", "url", "headers"}
        check(not extra, f"mcp.json: {name} has fields the spec rejects: {sorted(extra)}")
        other = native_servers.get(name, {})
        check(other.get("type") == "http", f".mcp.json: {name} must use type http")
        check(other.get("url") == server.get("url"), f"{name}: url differs between mcp.json and .mcp.json")


def check_skills() -> None:
    skills_root = REPO_ROOT / "skills"
    skill_dirs = sorted(path for path in skills_root.iterdir() if path.is_dir())
    check(bool(skill_dirs), "skills is empty")

    for skill_dir in skill_dirs:
        skill_md = skill_dir / "SKILL.md"
        # Loaders only look one level down; a category folder here hides every skill inside it.
        if not skill_md.is_file():
            errors.append(f"skills/{skill_dir.name}: no SKILL.md (skills must be flat)")
            continue
        match = re.search(r"^name:\s*(\S+)\s*$", skill_md.read_text(encoding="utf-8"), re.MULTILINE)
        name = match.group(1) if match else None
        check(name == skill_dir.name, f"skills/{skill_dir.name}: frontmatter name is {name!r}")
        check(bool(SKILL_NAME.match(skill_dir.name)), f"skills/{skill_dir.name}: invalid skill name")


def check_marketplaces() -> None:
    for path in (".claude-plugin/marketplace.json", ".cursor-plugin/marketplace.json"):
        entries = load(REPO_ROOT / path).get("plugins", [])
        check(
            [(entry.get("name"), entry.get("source")) for entry in entries] == [("clerk", "./")],
            f"{path}: expected one plugin clerk at ./",
        )
    entries = load(REPO_ROOT / ".agents" / "plugins" / "marketplace.json").get("plugins", [])
    check(
        [(entry.get("name"), entry.get("source", {}).get("path")) for entry in entries] == [("clerk", "./")],
        ".agents/plugins/marketplace.json: expected one plugin clerk at ./",
    )


def main() -> None:
    check_manifests()
    check_mcp()
    check_skills()
    check_marketplaces()

    if errors:
        print("\n".join(f"- {error}" for error in errors))
        sys.exit(1)
    print("Manifests, MCP config, skills, and marketplaces are consistent.")


if __name__ == "__main__":
    main()
