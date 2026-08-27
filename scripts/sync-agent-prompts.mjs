import fs from "node:fs/promises";
import path from "node:path";

const [clerkRoot, skillsRoot] = process.argv.slice(2);

if (!clerkRoot || !skillsRoot) {
  throw new Error(
    "Usage: node scripts/sync-agent-prompts.mjs <clerk-root> <skills-root>",
  );
}

const sourcePath = path.join(clerkRoot, "clerk-docs/prompts/cli-setup.md");
const source = await fs.readFile(sourcePath, "utf8");

if (!source.trim()) {
  throw new Error(
    "Refusing to generate Clerk setup skills from a blank cli-setup.md",
  );
}

const frontmatter = `---
name: clerk-setup
description: Add Clerk authentication to any project by following the official quickstart
  guides.
license: MIT
allowed-tools: WebFetch
metadata:
  author: clerk
  version: 2.3.0
---`;
const generatedNotice =
  "<!-- Generated from clerk/clerk@main:clerk-docs/prompts/cli-setup.md. Do not edit by hand. -->";
const setupSkill = `${frontmatter}\n\n${generatedNotice}\n\n${source.trim()}\n`;
const cliReference = `${generatedNotice}\n\n${source.trim()}\n`;

await fs.writeFile(
  path.join(skillsRoot, "skills/core/clerk-setup/SKILL.md"),
  setupSkill,
);
await fs.writeFile(
  path.join(skillsRoot, "skills/core/clerk-cli/references/setup.md"),
  cliReference,
);
