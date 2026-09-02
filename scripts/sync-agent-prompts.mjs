import fs from 'node:fs/promises'
import path from 'node:path'

const sourceRoot = path.resolve(process.argv[2] ?? '../clerk')
const sourcePath = path.join(sourceRoot, 'clerk-docs/prompts/cli-setup.md')
const source = await fs.readFile(sourcePath, 'utf8')
const generatedNotice = '<!-- Generated from clerk/clerk@main:clerk-docs/prompts/cli-setup.md. Do not edit manually. -->\n\n'

await Promise.all([
  fs.writeFile('skills/core/clerk-setup/references/setup.md', generatedNotice + source),
  fs.writeFile('skills/core/clerk-cli/references/setup.md', generatedNotice + source),
])
