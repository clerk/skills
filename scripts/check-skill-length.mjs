import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { listFiles } from "./check-docs-links.mjs";

export const MAX_SKILL_LINES = 500;

export function countLines(content) {
  if (!content) return 0;
  return content.split(/\r?\n/).length - (content.endsWith("\n") ? 1 : 0);
}

export async function checkSkillLengths(root = process.cwd(), maxLines = MAX_SKILL_LINES) {
  const findings = [];
  for (const relativeFile of await listFiles(path.join(root, "skills"))) {
    if (path.basename(relativeFile) !== "SKILL.md") continue;
    const file = path.join("skills", relativeFile);
    const lines = countLines(await readFile(path.join(root, file), "utf8"));
    if (lines > maxLines) findings.push({ file, lines });
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
