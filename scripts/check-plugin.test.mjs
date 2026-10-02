import assert from "node:assert/strict";
import test from "node:test";
import { checkPlugin, run } from "./check-plugin.mjs";

const SPEC = "https://agent-plugins.org/schemas/1.0.0";
const description = "Add authentication with Clerk.";
const url = "https://mcp.clerk.com/mcp";

function validRepo() {
  return {
    files: {
      "plugin.json": {
        $schema: `${SPEC}/plugin.schema.json`,
        name: "clerk",
        version: "0.1.0",
        description,
      },
      ".claude-plugin/plugin.json": { name: "clerk", description },
      ".cursor-plugin/plugin.json": {
        name: "clerk",
        version: "0.1.0",
        description,
        author: { name: "Clerk", email: "ai@clerk.dev" },
        skills: "./skills/",
        mcpServers: "./.mcp.json",
      },
      ".codex-plugin/plugin.json": {
        name: "clerk",
        version: "0.1.0",
        description,
        skills: "./skills/",
        mcpServers: "./.mcp.json",
      },
      "mcp.json": {
        $schema: `${SPEC}/mcp.schema.json`,
        mcpServers: { clerk: { type: "streamable-http", url } },
      },
      ".mcp.json": { mcpServers: { clerk: { type: "http", url } } },
      ".claude-plugin/marketplace.json": {
        plugins: [{ name: "clerk", source: "./" }],
      },
      ".cursor-plugin/marketplace.json": {
        plugins: [{ name: "clerk", source: "./" }],
      },
      ".agents/plugins/marketplace.json": {
        plugins: [{ name: "clerk", source: { source: "local", path: "./" } }],
      },
    },
    skills: [
      { directory: "clerk", content: "---\nname: clerk\n---\n" },
      { directory: "clerk-setup", content: "---\nname: clerk-setup\n---\n" },
    ],
  };
}

test("accepts a consistent plugin", () => {
  assert.deepEqual(checkPlugin(validRepo()), []);
});

test("rejects a version on the Claude Code manifest", () => {
  const repo = validRepo();
  repo.files[".claude-plugin/plugin.json"].version = "0.1.0";
  assert.deepEqual(checkPlugin(repo), [
    ".claude-plugin/plugin.json: must not set version",
  ]);
});

test("rejects manifests that disagree", () => {
  const repo = validRepo();
  repo.files[".codex-plugin/plugin.json"].version = "0.2.0";
  assert.match(checkPlugin(repo).join("\n"), /manifests disagree on version/);
});

test("rejects fields outside the closed schemas", () => {
  const repo = validRepo();
  repo.files["plugin.json"].skills = "./skills/";
  repo.files[".cursor-plugin/plugin.json"].interface = {};
  repo.files[".cursor-plugin/plugin.json"].author.url = "https://clerk.com";
  assert.deepEqual(checkPlugin(repo), [
    'plugin.json: fields outside the closed spec schema: ["skills"]',
    '.cursor-plugin/plugin.json: fields Cursor\'s schema rejects: ["interface"]',
    '.cursor-plugin/plugin.json: author allows only name and email, found ["url"]',
  ]);
});

test("rejects MCP configs that drift apart", () => {
  const repo = validRepo();
  repo.files[".mcp.json"].mcpServers.clerk = {
    type: "streamable-http",
    url: "https://example.com/mcp",
  };
  assert.deepEqual(checkPlugin(repo), [
    ".mcp.json: clerk must use type http",
    "clerk: url differs between mcp.json and .mcp.json",
  ]);
});

test("requires Cursor and Codex to load the skills and the http MCP config", () => {
  const repo = validRepo();
  delete repo.files[".cursor-plugin/plugin.json"].mcpServers;
  repo.files[".codex-plugin/plugin.json"].mcpServers = "./mcp.json";
  repo.files[".codex-plugin/plugin.json"].skills = "./plugins/clerk/skills/";
  assert.deepEqual(checkPlugin(repo), [
    '.cursor-plugin/plugin.json: mcpServers must be "./.mcp.json"',
    '.codex-plugin/plugin.json: skills must be "./skills/"',
    '.codex-plugin/plugin.json: mcpServers must be "./.mcp.json"',
  ]);
});

test("rejects category folders and mismatched skill names", () => {
  const repo = validRepo();
  repo.skills.push(
    { directory: "core", content: null },
    {
      directory: "clerk-orgs",
      content: "---\nname: clerk-organizations\n---\n",
    },
  );
  assert.deepEqual(checkPlugin(repo), [
    "skills/core: no SKILL.md (skills must be flat)",
    'skills/clerk-orgs: frontmatter name is "clerk-organizations"',
  ]);
});

test("rejects an empty skills folder", () => {
  const repo = validRepo();
  repo.skills = [];
  assert.deepEqual(checkPlugin(repo), ["skills is empty"]);
});

test("rejects a marketplace that lists anything but clerk at the root", () => {
  const repo = validRepo();
  repo.files[".cursor-plugin/marketplace.json"].plugins[0].source =
    "./plugins/clerk";
  repo.files[".agents/plugins/marketplace.json"].plugins.push({
    name: "clerk-skills",
    source: { source: "local", path: "./" },
  });
  assert.deepEqual(checkPlugin(repo), [
    ".cursor-plugin/marketplace.json: expected one plugin clerk at ./",
    ".agents/plugins/marketplace.json: expected one plugin clerk at ./",
  ]);
});

test("passes against this repository", async () => {
  await run({ cwd: process.cwd() });
});
