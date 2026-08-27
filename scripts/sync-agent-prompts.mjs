import fs from 'node:fs/promises'
import path from 'node:path'

const sourceRoot = path.resolve(process.argv[2] ?? '../clerk')
const sourcePath = path.join(sourceRoot, 'clerk-docs/prompts/cli-setup.md')
const source = await fs.readFile(sourcePath, 'utf8')
const generatedNotice = '<!-- Generated from clerk/clerk@main:clerk-docs/prompts/cli-setup.md. Do not edit manually. -->\n\n'

const setupFrontmatter = `---
name: clerk-setup
description: Set up Clerk authentication in an existing project or a newly scaffolded application using the canonical Clerk CLI flow.
license: MIT
allowed-tools: Bash Read Edit
metadata:
  author: clerk
  version: 3.0.0
---

`

await Promise.all([
  fs.writeFile('skills/core/clerk-setup/SKILL.md', setupFrontmatter + generatedNotice + source),
  fs.writeFile('skills/core/clerk-cli/references/setup.md', generatedNotice + source),
])
