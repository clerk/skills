import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { toString } from "mdast-util-to-string";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

import { listFiles } from "./check-docs-links.mjs";

const parser = remark().use(remarkFrontmatter).use(remarkGfm);

export function findUndescribedLinks(content) {
  const findings = [];
  visit(parser.parse(content), "link", (node) => {
    // GFM autolink literals and [https://...](https://...) both have a URL
    // for their entire label. Neither gives rendered Markdown useful text.
    if (/^https?:\/\//.test(node.url) && toString(node).trim() === node.url) {
      findings.push({ line: node.position?.start.line ?? 1, url: node.url });
    }
  });
  return findings;
}

export async function checkMarkdownLinks(root = process.cwd()) {
  const findings = [];
  for (const relativeFile of await listFiles(path.join(root, "skills"))) {
    if (!relativeFile.endsWith(".md")) continue;
    const file = path.join("skills", relativeFile);
    const content = await readFile(path.join(root, file), "utf8");
    for (const finding of findUndescribedLinks(content)) {
      findings.push({ file, ...finding });
    }
  }
  return findings;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = await checkMarkdownLinks();
  if (findings.length) {
    for (const { file, line, url } of findings) {
      console.error(`${file}:${line}: Write ${url} as a descriptive Markdown link.`);
    }
    process.exitCode = 1;
  } else {
    console.log("All skill links have descriptive Markdown text.");
  }
}
