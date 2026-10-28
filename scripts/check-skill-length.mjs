import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { listFiles } from "./check-docs-links.mjs";

export const MAX_SKILL_LINES = 500;
// A portable proxy for the spec's recommended ~5,000-token instruction budget.
// Token counts vary by model, so this is a byte limit rather than an exact token claim.
export const MAX_SKILL_BYTES = 20_000;

export function countLines(content) {
  if (!content) return 0;
  return content.split(/\r?\n/).length - (content.endsWith("\n") ? 1 : 0);
}

export async function checkSkillLengths(root = process.cwd(), maxLines = MAX_SKILL_LINES, maxBytes = MAX_SKILL_BYTES) {
  const findings = [];
  for (const relativeFile of await listFiles(path.join(root, "skills"))) {
    if (path.basename(relativeFile) !== "SKILL.md") continue;
    const file = path.join("skills", relativeFile);
    const content = await readFile(path.join(root, file), "utf8");
    const lines = countLines(content);
    const bytes = Buffer.byteLength(content, "utf8");
    if (lines > maxLines || bytes > maxBytes) findings.push({ file, lines, bytes });
  }
  return findings;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = await checkSkillLengths();
  if (findings.length) {
    for (const { file, lines, bytes } of findings) {
      const reasons = [];
      if (lines > MAX_SKILL_LINES) reasons.push(`${lines} lines exceeds the ${MAX_SKILL_LINES}-line limit`);
      if (bytes > MAX_SKILL_BYTES) reasons.push(`${bytes} bytes exceeds the ${MAX_SKILL_BYTES}-byte limit`);
      console.error(`${file}: ${reasons.join("; ")}; move details into references/`);
    }
    process.exitCode = 1;
  } else {
    console.log(`All SKILL.md files are at most ${MAX_SKILL_LINES} lines and ${MAX_SKILL_BYTES} bytes.`);
  }
}
