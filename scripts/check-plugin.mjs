import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SPEC = "https://agent-plugins.org/schemas/1.0.0";

// Agent Plugins 1.0.0 closes the root manifest to these fields.
const SPEC_MANIFEST_FIELDS = new Set([
  "$schema",
  "name",
  "version",
  "description",
  "author",
  "homepage",
  "repository",
  "license",
  "keywords",
  "extensions",
]);
// cursor/plugins schemas/plugin.schema.json sets additionalProperties: false.
const CURSOR_MANIFEST_FIELDS = new Set([
  "name",
  "displayName",
  "description",
  "version",
  "minClientVersions",
  "author",
  "publisher",
  "homepage",
  "repository",
  "license",
  "logo",
  "keywords",
  "category",
  "tags",
  "commands",
  "agents",
  "skills",
  "rules",
  "hooks",
  "variables",
  "mcpServers",
]);
const SKILL_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const MANIFEST_PATHS = [
  "plugin.json",
  ".claude-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
  ".codex-plugin/plugin.json",
];
const MARKETPLACE_PATHS = [
  ".claude-plugin/marketplace.json",
  ".cursor-plugin/marketplace.json",
  ".agents/plugins/marketplace.json",
];
const JSON_PATHS = [
  ...MANIFEST_PATHS,
  "mcp.json",
  ".mcp.json",
  ...MARKETPLACE_PATHS,
];

function extraFields(object, allowed) {
  return JSON.stringify(
    Object.keys(object ?? {})
      .filter((key) => !allowed.has(key))
      .sort(),
  );
}

// Values that several files repeat, each read as [file, property, value]. Every
// group must agree, and a value left out everywhere still counts as drift.
function copiedValues(files) {
  const manifests = (property, read = (manifest) => manifest[property]) =>
    MANIFEST_PATHS.map((filePath) => [
      filePath,
      property,
      read(files[filePath]),
    ]);
  const codex = files[".codex-plugin/plugin.json"];
  const cursor = files[".cursor-plugin/plugin.json"];
  const entry = (filePath) =>
    files[filePath].plugins?.find(({ name }) => name === "clerk") ?? {};
  // Cursor writes the logo path without the leading ./ that Codex uses.
  const logo = (value) => (value ? path.posix.normalize(value) : value);

  return {
    name: manifests("name"),
    // Claude Code takes no version on purpose (see checkManifests).
    version: manifests("version").filter(
      ([filePath]) => filePath !== ".claude-plugin/plugin.json",
    ),
    description: [
      ...manifests("description"),
      [
        ".codex-plugin/plugin.json",
        "interface.longDescription",
        codex.interface?.longDescription,
      ],
      [
        ".claude-plugin/marketplace.json",
        "clerk description",
        entry(".claude-plugin/marketplace.json").description,
      ],
      [
        ".cursor-plugin/marketplace.json",
        "clerk description",
        entry(".cursor-plugin/marketplace.json").description,
      ],
    ],
    // Keywords are the search terms in every marketplace, Claude Code's included.
    keywords: manifests("keywords"),
    homepage: manifests("homepage"),
    repository: manifests("repository"),
    license: manifests("license"),
    "author name": [
      ...manifests("author.name", (manifest) => manifest.author?.name),
      [
        ".codex-plugin/plugin.json",
        "interface.developerName",
        codex.interface?.developerName,
      ],
    ],
    "author email": manifests(
      "author.email",
      (manifest) => manifest.author?.email,
    ),
    // Cursor's schema allows only name and email on author.
    "author url": manifests(
      "author.url",
      (manifest) => manifest.author?.url,
    ).filter(([filePath]) => filePath !== ".cursor-plugin/plugin.json"),
    "display name": [
      [".cursor-plugin/plugin.json", "displayName", cursor.displayName],
      [
        ".codex-plugin/plugin.json",
        "interface.displayName",
        codex.interface?.displayName,
      ],
    ],
    logo: [
      [".cursor-plugin/plugin.json", "logo", logo(cursor.logo)],
      [
        ".codex-plugin/plugin.json",
        "interface.logo",
        logo(codex.interface?.logo),
      ],
      [
        ".codex-plugin/plugin.json",
        "interface.composerIcon",
        logo(codex.interface?.composerIcon),
      ],
    ],
    category: [
      [
        ".codex-plugin/plugin.json",
        "interface.category",
        codex.interface?.category,
      ],
      [
        ".agents/plugins/marketplace.json",
        "clerk category",
        entry(".agents/plugins/marketplace.json").category,
      ],
    ],
  };
}

function checkCopies(files, check) {
  for (const [label, copies] of Object.entries(copiedValues(files))) {
    const values = Object.fromEntries(
      copies.map(([filePath, property, value]) => [
        `${filePath} ${property}`,
        value ?? null,
      ]),
    );
    const distinct = new Set(
      Object.values(values).map((value) => JSON.stringify(value)),
    );
    check(
      distinct.size === 1 && !distinct.has("null"),
      `manifests disagree on ${label}: ${JSON.stringify(values)}`,
    );
  }
}

function checkManifests(files, check) {
  const spec = files["plugin.json"];
  const claude = files[".claude-plugin/plugin.json"];
  const cursor = files[".cursor-plugin/plugin.json"];

  // Claude Code keeps users on their cached copy while `version` is unchanged;
  // without it, every commit is an update.
  check(
    !("version" in claude),
    ".claude-plugin/plugin.json: must not set version",
  );
  checkCopies(files, check);

  // The other manifests must match this one, so checking it covers them all.
  const sorted = [...new Set(spec.keywords)].sort();
  check(
    JSON.stringify(spec.keywords) === JSON.stringify(sorted),
    "plugin.json: keywords must be unique and in alphabetical order",
  );

  check(
    spec.$schema === `${SPEC}/plugin.schema.json`,
    "plugin.json: wrong or missing $schema",
  );
  let extra = extraFields(spec, SPEC_MANIFEST_FIELDS);
  check(
    extra === "[]",
    `plugin.json: fields outside the closed spec schema: ${extra}`,
  );

  extra = extraFields(cursor, CURSOR_MANIFEST_FIELDS);
  check(
    extra === "[]",
    `.cursor-plugin/plugin.json: fields Cursor's schema rejects: ${extra}`,
  );
  extra = extraFields(cursor.author, new Set(["name", "email"]));
  check(
    extra === "[]",
    `.cursor-plugin/plugin.json: author allows only name and email, found ${extra}`,
  );

  // Cursor and Codex both take Claude Code's `"type": "http"` MCP format, not
  // the Agent Plugins spec's `streamable-http` in mcp.json.
  for (const filePath of [
    ".cursor-plugin/plugin.json",
    ".codex-plugin/plugin.json",
  ]) {
    for (const [field, expected] of [
      ["skills", "./skills/"],
      ["mcpServers", "./.mcp.json"],
    ]) {
      check(
        files[filePath][field] === expected,
        `${filePath}: ${field} must be ${JSON.stringify(expected)}`,
      );
    }
  }
}

function checkMcp(files, check) {
  const spec = files["mcp.json"];
  const native = files[".mcp.json"];
  const sameKeys = (object, keys) =>
    JSON.stringify(Object.keys(object).sort()) === JSON.stringify(keys);

  check(
    sameKeys(spec, ["$schema", "mcpServers"]),
    "mcp.json: only $schema and mcpServers are allowed",
  );
  check(
    spec.$schema === `${SPEC}/mcp.schema.json`,
    "mcp.json: wrong or missing $schema",
  );
  check(
    sameKeys(native, ["mcpServers"]),
    ".mcp.json: expected only mcpServers",
  );

  const specServers = spec.mcpServers ?? {};
  const nativeServers = native.mcpServers ?? {};
  check(
    JSON.stringify(Object.keys(specServers).sort()) ===
      JSON.stringify(Object.keys(nativeServers).sort()),
    "mcp.json and .mcp.json list different servers",
  );

  for (const [name, server] of Object.entries(specServers)) {
    check(
      server.type === "streamable-http",
      `mcp.json: ${name} must use type streamable-http`,
    );
    const extra = extraFields(server, new Set(["type", "url", "headers"]));
    check(
      extra === "[]",
      `mcp.json: ${name} has fields the spec rejects: ${extra}`,
    );
    const other = nativeServers[name] ?? {};
    check(other.type === "http", `.mcp.json: ${name} must use type http`);
    check(
      other.url === server.url,
      `${name}: url differs between mcp.json and .mcp.json`,
    );
  }
}

function checkSkills(skills, check) {
  check(skills.length > 0, "skills is empty");

  for (const { directory, content } of skills) {
    // Plugin loaders only look one level down; a category folder here hides
    // every skill inside it.
    if (content === null) {
      check(false, `skills/${directory}: no SKILL.md (skills must be flat)`);
      continue;
    }
    const name = /^name:\s*(\S+)\s*$/m.exec(content)?.[1] ?? null;
    check(
      name === directory,
      `skills/${directory}: frontmatter name is ${JSON.stringify(name)}`,
    );
    check(
      SKILL_NAME.test(directory),
      `skills/${directory}: invalid skill name`,
    );
  }
}

function checkMarketplaces(files, check) {
  for (const filePath of MARKETPLACE_PATHS) {
    const entries = (files[filePath].plugins ?? []).map(({ name, source }) => [
      name,
      typeof source === "string" ? source : source?.path,
    ]);
    check(
      JSON.stringify(entries) === JSON.stringify([["clerk", "./"]]),
      `${filePath}: expected one plugin clerk at ./`,
    );
  }
}

// Every harness reads a different manifest, and no single file is valid for
// all of them, so these checks keep the overlapping files in agreement.
export function checkPlugin({ files, skills }) {
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };

  checkManifests(files, check);
  checkMcp(files, check);
  checkSkills(skills, check);
  checkMarketplaces(files, check);
  return errors;
}

async function readRepo(cwd) {
  const files = Object.fromEntries(
    await Promise.all(
      JSON_PATHS.map(async (filePath) => [
        filePath,
        JSON.parse(await readFile(path.join(cwd, filePath), "utf8")),
      ]),
    ),
  );

  const entries = await readdir(path.join(cwd, "skills"), {
    withFileTypes: true,
  });
  const skills = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
      .map(async (directory) => ({
        directory,
        content: await readFile(
          path.join(cwd, "skills", directory, "SKILL.md"),
          "utf8",
        ).catch((error) => {
          if (error.code === "ENOENT") return null;
          throw error;
        }),
      })),
  );

  return { files, skills };
}

function escapeAnnotation(value) {
  return value
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A");
}

export async function run({ cwd }) {
  const errors = checkPlugin(await readRepo(cwd));

  for (const message of errors) {
    console.error(`::error::${escapeAnnotation(message)}`);
  }

  if (errors.length) {
    throw new Error(
      `Found ${errors.length} plugin ${errors.length === 1 ? "inconsistency" : "inconsistencies"}.`,
    );
  }

  console.log(
    "Manifests, MCP config, skills, and marketplaces are consistent.",
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run({ cwd: process.cwd() }).catch((error) => {
    console.error(`::error::${escapeAnnotation(error.message)}`);
    process.exitCode = 1;
  });
}
