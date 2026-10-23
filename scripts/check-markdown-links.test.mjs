import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  checkMarkdownLinks,
  findUndescribedLinks,
} from "./check-markdown-links.mjs";

test("flags GFM bare and parenthesized URLs, including raw URL labels", () => {
  const findings = findUndescribedLinks(
    "Visit https://clerk.com/docs/a.\nOrganizations (https://clerk.com/docs/b)\n[https://clerk.com/docs/c](https://clerk.com/docs/c)\n",
  );
  assert.deepEqual(findings, [
    { line: 1, url: "https://clerk.com/docs/a" },
    { line: 2, url: "https://clerk.com/docs/b" },
    { line: 3, url: "https://clerk.com/docs/c" },
  ]);
});

test("accepts descriptive links and ignores code, images, and frontmatter", () => {
  const content = [
    "---",
    "url: https://clerk.com/docs/frontmatter",
    "---",
    "[Organizations](https://clerk.com/docs/orgs)",
    "`https://clerk.com/docs/inline`",
    "```sh",
    "curl https://clerk.com/docs/code",
    "```",
    "![Clerk logo](https://clerk.com/logo.svg)",
  ].join("\n");
  assert.deepEqual(findUndescribedLinks(content), []);
});

test("checks Markdown below skills and reports file and line", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "clerk-markdown-links-"));
  try {
    await mkdir(path.join(root, "skills", "clerk-example", "references"), { recursive: true });
    await writeFile(path.join(root, "skills", "clerk-example", "SKILL.md"), "[Good](https://clerk.com/docs/good)\n");
    await writeFile(path.join(root, "skills", "clerk-example", "references", "setup.md"), "See https://clerk.com/docs/bare\n");
    for (const ignored of [".git", "node_modules"]) {
      await mkdir(path.join(root, "skills", "clerk-example", ignored));
      await writeFile(path.join(root, "skills", "clerk-example", ignored, "ignored.md"), "See https://clerk.com/docs/ignored\n");
    }
    assert.deepEqual(await checkMarkdownLinks(root), [{
      file: path.join("skills", "clerk-example", "references", "setup.md"),
      line: 1,
      url: "https://clerk.com/docs/bare",
    }]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
