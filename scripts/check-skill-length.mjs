import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const MAX_SKILL_LINES = 500;

export function countLines(content) {
  if (!content) return 0;
  return content.split(/\r?\n/).length - (content.endsWith("\n") ? 1 : 0);
}

async function skillFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await skillFiles(fullPath)));
    else if (entry.isFile() && entry.name === "SKILL.md") files.push(fullPath);
  }
  return files;
}

export async function checkSkillLengths(root = process.cwd(), maxLines = MAX_SKILL_LINES) {
  const findings = [];
  for (const file of await skillFiles(path.join(root, "skills"))) {
    const lines = countLines(await readFile(file, "utf8"));
    if (lines > maxLines) findings.push({ file: path.relative(root, file), lines });
  }
  return findings;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = await checkSkillLengths();
  if (findings.length) {
    for (const { file, lines } of findings) {
      console.error(`${file}: ${lines} lines exceeds the ${MAX_SKILL_LINES}-line limit; move details into references/`);
    }
    process.exitCode = 1;
  } else {
    console.log(`All SKILL.md files are at most ${MAX_SKILL_LINES} lines.`);
  }
}
