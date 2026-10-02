import assert from "node:assert/strict";
import test from "node:test";
import { checkPlugin, run } from "./check-plugin.mjs";

const SPEC = "https://agent-plugins.org/schemas/1.0.0";
const description = "Add authentication with Clerk.";
const url = "https://mcp.clerk.com/mcp";
const keywords = ["auth", "clerk", "nextjs"];

function validRepo() {
  const author = {
    name: "Clerk",
    email: "ai@clerk.dev",
    url: "https://clerk.com",
  };
  const shared = {
    name: "clerk",
    description,
    homepage: "https://clerk.com/docs",
    repository: "https://github.com/clerk/skills",
    license: "MIT",
    keywords: [...keywords],
  };

  return {
    files: {
      "plugin.json": {
        $schema: `${SPEC}/plugin.schema.json`,
        ...shared,
        version: "1.0.0",
        author: { ...author },
      },
      ".claude-plugin/plugin.json": {
        ...shared,
        keywords: [...keywords],
        author: { ...author },
      },
      ".cursor-plugin/plugin.json": {
        ...shared,
        keywords: [...keywords],
        displayName: "Clerk",
        version: "1.0.0",
        author: { name: author.name, email: author.email },
        logo: "assets/clerk-logo.svg",
        skills: "./skills/",
        mcpServers: "./.mcp.json",
      },
      ".codex-plugin/plugin.json": {
        ...shared,
        keywords: [...keywords],
        version: "1.0.0",
        author: { ...author },
        skills: "./skills/",
        mcpServers: "./.mcp.json",
        interface: {
          displayName: "Clerk",
          shortDescription: "Clerk auth",
          longDescription: description,
          developerName: "Clerk",
          category: "Coding",
          composerIcon: "./assets/clerk-logo.svg",
          logo: "./assets/clerk-logo.svg",
        },
      },
      "mcp.json": {
        $schema: `${SPEC}/mcp.schema.json`,
        mcpServers: { clerk: { type: "streamable-http", url } },
      },
      ".mcp.json": { mcpServers: { clerk: { type: "http", url } } },
      ".claude-plugin/marketplace.json": {
        plugins: [{ name: "clerk", source: "./", description }],
      },
      ".cursor-plugin/marketplace.json": {
        plugins: [{ name: "clerk", source: "./", description }],
      },
      ".agents/plugins/marketplace.json": {
        plugins: [
          {
            name: "clerk",
            source: { source: "local", path: "./" },
            category: "Coding",
          },
        ],
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
  repo.files[".claude-plugin/plugin.json"].version = "1.0.0";
  assert.deepEqual(checkPlugin(repo), [
    ".claude-plugin/plugin.json: must not set version",
  ]);
});

test("rejects manifests that disagree", () => {
  const repo = validRepo();
  repo.files[".codex-plugin/plugin.json"].version = "1.1.0";
  assert.match(checkPlugin(repo).join("\n"), /manifests disagree on version/);
});

test("rejects manifests whose keywords drift apart", () => {
  const repo = validRepo();
  repo.files[".claude-plugin/plugin.json"].keywords = ["clerk", "auth"];
  assert.match(checkPlugin(repo).join("\n"), /manifests disagree on keywords/);
});

// Each case edits one copy of a value that several files must repeat.
for (const [label, edit] of [
  [
    "description",
    (files) =>
      (files[".codex-plugin/plugin.json"].interface.longDescription = "Old."),
  ],
  [
    "description",
    (files) =>
      (files[".claude-plugin/marketplace.json"].plugins[0].description =
        "Old."),
  ],
  [
    "description",
    (files) =>
      (files[".cursor-plugin/marketplace.json"].plugins[0].description =
        "Old."),
  ],
  [
    "homepage",
    (files) =>
      (files[".cursor-plugin/plugin.json"].homepage = "https://clerk.com"),
  ],
  [
    "repository",
    (files) =>
      (files[".claude-plugin/plugin.json"].repository =
        "https://github.com/clerk/plugin"),
  ],
  [
    "license",
    (files) => (files[".codex-plugin/plugin.json"].license = "Apache-2.0"),
  ],
  [
    "author name",
    (files) =>
      (files[".codex-plugin/plugin.json"].interface.developerName =
        "Clerk Inc."),
  ],
  [
    "author email",
    (files) =>
      (files[".cursor-plugin/plugin.json"].author.email = "support@clerk.com"),
  ],
  [
    "author url",
    (files) =>
      (files[".claude-plugin/plugin.json"].author.url = "https://clerk.dev"),
  ],
  [
    "display name",
    (files) => (files[".cursor-plugin/plugin.json"].displayName = "Clerk Auth"),
  ],
  [
    "logo",
    (files) =>
      (files[".codex-plugin/plugin.json"].interface.composerIcon =
        "./assets/icon.svg"),
  ],
  [
    "category",
    (files) =>
      (files[".agents/plugins/marketplace.json"].plugins[0].category =
        "Productivity"),
  ],
]) {
  test(`rejects drift in ${label}`, () => {
    const repo = validRepo();
    edit(repo.files);
    const errors = checkPlugin(repo);
    assert.equal(errors.length, 1, errors.join("\n"));
    assert.match(errors[0], new RegExp(`^manifests disagree on ${label}: `));
  });
}

test("rejects a copied value that every file leaves out", () => {
  const repo = validRepo();
  delete repo.files[".cursor-plugin/plugin.json"].displayName;
  delete repo.files[".codex-plugin/plugin.json"].interface.displayName;
  assert.deepEqual(checkPlugin(repo), [
    'manifests disagree on display name: {".cursor-plugin/plugin.json displayName":null,".codex-plugin/plugin.json interface.displayName":null}',
  ]);
});

test("rejects keywords out of alphabetical order", () => {
  const repo = validRepo();
  for (const filePath of [
    "plugin.json",
    ".claude-plugin/plugin.json",
    ".cursor-plugin/plugin.json",
    ".codex-plugin/plugin.json",
  ]) {
    repo.files[filePath].keywords = ["clerk", "auth", "nextjs"];
  }
  assert.deepEqual(checkPlugin(repo), [
    "plugin.json: keywords must be unique and in alphabetical order",
  ]);
});

test("rejects duplicate keywords", () => {
  const repo = validRepo();
  for (const filePath of [
    "plugin.json",
    ".claude-plugin/plugin.json",
    ".cursor-plugin/plugin.json",
    ".codex-plugin/plugin.json",
  ]) {
    repo.files[filePath].keywords = ["auth", "auth", "clerk"];
  }
  assert.deepEqual(checkPlugin(repo), [
    "plugin.json: keywords must be unique and in alphabetical order",
  ]);
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
