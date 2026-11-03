import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { listFiles } from "./check-docs-links.mjs";

export const MAX_SKILL_LINES = 500;
export const MAX_ESTIMATED_TOKENS = 5_000;

export function countLines(content) {
  if (!content) return 0;
  return content.split(/\r?\n/).length - (content.endsWith("\n") ? 1 : 0);
}

export function estimateSkillTokens(content) {
  // Frontmatter is metadata; approximate the body at one token per four UTF-8 bytes.
  const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
  const collapsedBody = body.replace(/\s+/g, " ").trim();
  return Math.ceil(Buffer.byteLength(collapsedBody, "utf8") / 4);
}

export async function checkSkillLengths(root = process.cwd(), maxLines = MAX_SKILL_LINES, maxTokens = MAX_ESTIMATED_TOKENS) {
  const findings = [];
  for (const relativeFile of await listFiles(path.join(root, "skills"))) {
    if (path.basename(relativeFile) !== "SKILL.md") continue;
    const file = path.join("skills", relativeFile);
    const content = await readFile(path.join(root, file), "utf8");
    const lines = countLines(content);
    const tokens = estimateSkillTokens(content);
    if (lines > maxLines || tokens > maxTokens) findings.push({ file, lines, tokens });
  }
  return findings;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = await checkSkillLengths();
  if (findings.length) {
    for (const { file, lines, tokens } of findings) {
      const reasons = [];
      if (lines > MAX_SKILL_LINES) reasons.push(`${lines} lines exceeds the ${MAX_SKILL_LINES}-line limit`);
      if (tokens > MAX_ESTIMATED_TOKENS) reasons.push(`${tokens} estimated tokens exceeds the ${MAX_ESTIMATED_TOKENS}-token budget`);
      console.error(`${file}: ${reasons.join("; ")}; move details into references/`);
    }
    process.exitCode = 1;
  } else {
    console.log(`All SKILL.md files are at most ${MAX_SKILL_LINES} lines and ${MAX_ESTIMATED_TOKENS} estimated tokens.`);
  }
}
