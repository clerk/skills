import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const clerkMcpUrl = "https://mcp.clerk.dev/mcp";

const expectedSkills = [
  "clerk",
  "clerk-cli",
  "clerk-setup",
  "clerk-custom-ui",
  "clerk-backend-api",
  "clerk-nextjs-patterns",
  "clerk-react-patterns",
  "clerk-react-router-patterns",
  "clerk-vue-patterns",
  "clerk-nuxt-patterns",
  "clerk-astro-patterns",
  "clerk-tanstack-patterns",
  "clerk-expo-patterns",
  "clerk-expo",
  "clerk-chrome-extension-patterns",
  "clerk-orgs",
  "clerk-billing",
  "clerk-webhooks",
  "clerk-testing",
  "clerk-swift",
  "clerk-android",
];

const jsonFiles = [
  ".agents/plugins/marketplace.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".codex-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
  ".mcp.json",
  "mcp.json",
  "package.json",
];

const legacyCategoryPaths = [
  "skills/core",
  "skills/features",
  "skills/frameworks",
  "skills/mobile",
];

const failures: string[] = [];
const parsedJson = new Map<string, unknown>();

function fail(message: string) {
  failures.push(message);
}

function readJson(path: string) {
  try {
    const value = JSON.parse(readFileSync(join(root, path), "utf8")) as unknown;
    parsedJson.set(path, value);
    return value;
  } catch (error) {
    fail(`${path} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, path: string) {
  if (typeof value !== "string" || value.length === 0) {
    fail(`${path} must be a non-empty string`);
  }
}

function normalizeDirectoryPath(value: string) {
  return value.replace(/^\.\//, "").replace(/\/$/, "");
}

function extractFrontmatter(content: string, path: string) {
  if (!content.startsWith("---\n")) {
    fail(`${path} must start with YAML frontmatter`);
    return undefined;
  }

  const closingIndex = content.indexOf("\n---", 4);
  if (closingIndex === -1) {
    fail(`${path} has unterminated YAML frontmatter`);
    return undefined;
  }

  return content.slice(4, closingIndex);
}

function getFrontmatterValue(frontmatter: string, key: string) {
  const lines = frontmatter.split("\n");

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line.startsWith(`${key}:`)) {
      continue;
    }

    const inlineValue = line.slice(key.length + 1).trim();
    if (inlineValue.length > 0) {
      return inlineValue;
    }

    const continuation: string[] = [];
    for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex++) {
      const nextLine = lines[nextIndex];
      if (!/^\s+/.test(nextLine)) {
        break;
      }
      continuation.push(nextLine.trim());
    }

    return continuation.join(" ").trim();
  }

  return undefined;
}

function validateSkillFrontmatter(skill: string) {
  const skillRelativePath = `skills/${skill}/SKILL.md`;
  const skillPath = join(root, skillRelativePath);
  const content = readFileSync(skillPath, "utf8");
  const frontmatter = extractFrontmatter(content, skillRelativePath);

  if (!frontmatter) {
    return;
  }

  const name = getFrontmatterValue(frontmatter, "name");
  if (name !== skill) {
    fail(`${skillRelativePath} frontmatter name must be ${skill}`);
  }

  const description = getFrontmatterValue(frontmatter, "description");
  if (!description) {
    fail(`${skillRelativePath} frontmatter description must be non-empty`);
  }
}

function validateSkillPathList(manifest: string, value: unknown, expectedPaths: string[]) {
  if (typeof value === "string") {
    if (normalizeDirectoryPath(value) !== "skills") {
      fail(`${manifest} skills must point to skills`);
    }
    return;
  }

  if (!Array.isArray(value)) {
    fail(`${manifest} skills must be a string path or an array of paths`);
    return;
  }

  const actualPaths = value.filter((skill): skill is string => typeof skill === "string").sort();

  if (actualPaths.length !== value.length) {
    fail(`${manifest} skills must contain only string paths`);
  }

  for (const expectedPath of expectedPaths) {
    if (!actualPaths.includes(expectedPath)) {
      fail(`${manifest} missing skill path ${expectedPath}`);
    }
  }

  for (const skillPath of actualPaths) {
    if (!existsSync(join(root, skillPath, "SKILL.md"))) {
      fail(`${manifest} skill path does not resolve: ${skillPath}`);
    }
  }
}

function walkFiles(dir: string): string[] {
  if (!existsSync(join(root, dir))) {
    return [];
  }

  const entries = readdirSync(join(root, dir));
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(root, dir, entry);
    const relativePath = relative(root, fullPath);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (entry.endsWith("-workspace")) {
        continue;
      }
      files.push(...walkFiles(relativePath));
      continue;
    }

    files.push(relativePath);
  }

  return files;
}

for (const file of jsonFiles) {
  readJson(file);
}

const skillsRoot = join(root, "skills");
const skillDirs = existsSync(skillsRoot)
  ? readdirSync(skillsRoot)
      .filter((entry) => {
        const fullPath = join(skillsRoot, entry);
        return statSync(fullPath).isDirectory() && !entry.endsWith("-workspace");
      })
      .sort()
  : [];

if (!existsSync(skillsRoot)) {
  fail("skills/ directory is missing");
}

if (skillDirs.length !== expectedSkills.length) {
  fail(`expected ${expectedSkills.length} skill directories, found ${skillDirs.length}`);
}

for (const skill of expectedSkills) {
  const skillPath = join(root, "skills", skill, "SKILL.md");
  if (!existsSync(skillPath)) {
    fail(`missing skills/${skill}/SKILL.md`);
    continue;
  }

  validateSkillFrontmatter(skill);
}

for (const skill of skillDirs) {
  if (!expectedSkills.includes(skill)) {
    fail(`unexpected skill directory: skills/${skill}`);
  }
}

if (!existsSync(join(root, "skills", "clerk", "SKILL.md"))) {
  fail("orchestrator skill is missing at skills/clerk/SKILL.md");
}

for (const legacyPath of legacyCategoryPaths) {
  const legacyFullPath = join(root, legacyPath);
  if (existsSync(legacyFullPath)) {
    const trackedContent = readdirSync(legacyFullPath).filter((entry) => !entry.endsWith("-workspace"));
    if (trackedContent.length > 0) {
      fail(`legacy category path still has content: ${legacyPath}`);
    }
  }
}

const claudeMarketplace = parsedJson.get(".claude-plugin/marketplace.json");
if (isRecord(claudeMarketplace)) {
  const plugins = claudeMarketplace.plugins;
  if (!Array.isArray(plugins) || plugins.length !== 1) {
    fail(".claude-plugin/marketplace.json must expose exactly one Clerk skills plugin");
  } else {
    const plugin = plugins[0];
    if (!isRecord(plugin)) {
      fail(".claude-plugin/marketplace.json plugin must be an object");
    } else {
      if (plugin.name !== "clerk-skills") {
        fail(".claude-plugin plugin name must be clerk-skills");
      }

      if (plugin.source !== "./") {
        fail(".claude-plugin plugin source must be ./");
      }

      const skills = plugin.skills;
      if (skills !== undefined) {
        const expectedPaths = expectedSkills.map((skill) => `./skills/${skill}`);
        validateSkillPathList(".claude-plugin/marketplace.json", skills, expectedPaths);
      }
    }
  }
}

const claudePlugin = parsedJson.get(".claude-plugin/plugin.json");
if (isRecord(claudePlugin)) {
  if (claudePlugin.name !== "clerk-skills") {
    fail(".claude-plugin/plugin.json name must be clerk-skills");
  }

  assertString(claudePlugin.description, ".claude-plugin/plugin.json description");
  assertString(claudePlugin.version, ".claude-plugin/plugin.json version");
}

const codexPlugin = parsedJson.get(".codex-plugin/plugin.json");
if (isRecord(codexPlugin)) {
  if (codexPlugin.skills !== "./skills/") {
    fail(".codex-plugin/plugin.json skills must point to ./skills/");
  }

  if (codexPlugin.mcpServers !== "./.mcp.json") {
    fail(".codex-plugin/plugin.json mcpServers must point to ./.mcp.json");
  }

  const pluginInterface = codexPlugin.interface;
  if (!isRecord(pluginInterface)) {
    fail(".codex-plugin/plugin.json interface must be an object");
  } else {
    assertString(pluginInterface.websiteURL, ".codex-plugin/plugin.json interface.websiteURL");
    assertString(pluginInterface.privacyPolicyURL, ".codex-plugin/plugin.json interface.privacyPolicyURL");
    assertString(pluginInterface.termsOfServiceURL, ".codex-plugin/plugin.json interface.termsOfServiceURL");
  }
}

const cursorPlugin = parsedJson.get(".cursor-plugin/plugin.json");
if (isRecord(cursorPlugin)) {
  if (cursorPlugin.name !== "clerk") {
    fail(".cursor-plugin/plugin.json name must be clerk");
  }

  const skills = cursorPlugin.skills;
  const expectedPaths = expectedSkills.map((skill) => `skills/${skill}`);
  validateSkillPathList(".cursor-plugin/plugin.json", skills, expectedPaths);
}

const dotMcp = parsedJson.get(".mcp.json");
if (isRecord(dotMcp)) {
  const mcpServers = dotMcp.mcpServers;
  if (!isRecord(mcpServers) || !isRecord(mcpServers.clerk) || mcpServers.clerk.url !== clerkMcpUrl) {
    fail(".mcp.json must configure mcpServers.clerk.url");
  }
}

const rootMcp = parsedJson.get("mcp.json");
if (isRecord(rootMcp)) {
  const mcpServers = rootMcp.mcpServers;
  if (!isRecord(mcpServers) || !isRecord(mcpServers.clerk) || mcpServers.clerk.url !== clerkMcpUrl) {
    fail("mcp.json must configure mcpServers.clerk.url");
  }
}

const manifestFiles = [
  ".agents/plugins/marketplace.json",
  ".claude-plugin/marketplace.json",
  ".codex-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
];

for (const manifest of manifestFiles) {
  const content = readFileSync(join(root, manifest), "utf8");
  for (const legacyPath of legacyCategoryPaths) {
    if (content.includes(legacyPath)) {
      fail(`${manifest} still references ${legacyPath}`);
    }
  }
}

for (const file of walkFiles("skills")) {
  if (file.endsWith(".DS_Store")) {
    fail(`unexpected .DS_Store file: ${file}`);
  }
}

if (failures.length > 0) {
  console.error("Validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Validation passed:");
console.log(`- ${expectedSkills.length} flat skills found`);
console.log("- skills/clerk/SKILL.md orchestrator exists");
console.log("- skill frontmatter names and descriptions are valid");
console.log("- JSON manifests parse");
console.log("- plugin manifests resolve the flat skills directory");
console.log("- Clerk MCP config is wired");
