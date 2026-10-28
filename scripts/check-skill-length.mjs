import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";

import { listFiles } from "./check-docs-links.mjs";

export const MAX_SKILL_LINES = 500;
export const MAX_SKILL_TOKENS = 5_000;
// Token counts vary by model. Use one fixed reference tokenizer so CI is reproducible.
const tokenizer = new Tiktoken(o200k_base);

export function countLines(content) {
  if (!content) return 0;
  return content.split(/\r?\n/).length - (content.endsWith("\n") ? 1 : 0);
}

export function countSkillTokens(content) {
  // Frontmatter is metadata; the instruction budget applies to the skill body.
  const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
  return tokenizer.encode(body).length;
}

export async function checkSkillLengths(root = process.cwd(), maxLines = MAX_SKILL_LINES, maxTokens = MAX_SKILL_TOKENS) {
  const findings = [];
  for (const relativeFile of await listFiles(path.join(root, "skills"))) {
    if (path.basename(relativeFile) !== "SKILL.md") continue;
    const file = path.join("skills", relativeFile);
    const content = await readFile(path.join(root, file), "utf8");
    const lines = countLines(content);
    const tokens = countSkillTokens(content);
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
      if (tokens > MAX_SKILL_TOKENS) reasons.push(`${tokens} tokens exceeds the ${MAX_SKILL_TOKENS}-token limit`);
      console.error(`${file}: ${reasons.join("; ")}; move details into references/`);
    }
    process.exitCode = 1;
  } else {
    console.log(`All SKILL.md files are at most ${MAX_SKILL_LINES} lines and ${MAX_SKILL_TOKENS} o200k_base tokens.`);
  }
}
