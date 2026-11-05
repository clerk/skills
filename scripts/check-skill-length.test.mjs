import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  checkSkillLengths,
  countLines,
  estimateSkillTokens,
  MAX_ESTIMATED_TOKENS,
  MAX_SKILL_LINES,
} from "./check-skill-length.mjs";

test("counts terminal newline as a terminator, not an extra line", () => {
  assert.equal(countLines(""), 0);
  assert.equal(countLines("one\n"), 1);
  assert.equal(countLines("one\r\ntwo\r\n"), 2);
});

test("allows 500 lines and rejects 501, including nested skills", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "clerk-skill-length-"));
  try {
    const flat = path.join(root, "skills", "clerk-flat");
    const nested = path.join(root, "skills", "future", "clerk-nested");
    await mkdir(flat, { recursive: true });
    await mkdir(nested, { recursive: true });
    await writeFile(path.join(flat, "SKILL.md"), "line\n".repeat(MAX_SKILL_LINES));
    await writeFile(path.join(nested, "SKILL.md"), "line\n".repeat(MAX_SKILL_LINES + 1));
    await writeFile(path.join(nested, "reference.md"), "line\n".repeat(MAX_SKILL_LINES + 1));
    for (const ignored of [".git", "node_modules"]) {
      const ignoredDirectory = path.join(nested, ignored);
      await mkdir(ignoredDirectory);
      await writeFile(path.join(ignoredDirectory, "SKILL.md"), "line\n".repeat(MAX_SKILL_LINES + 1));
    }
    assert.deepEqual(await checkSkillLengths(root), [{
      file: path.join("skills", "future", "clerk-nested", "SKILL.md"),
      lines: MAX_SKILL_LINES + 1,
      tokens: estimateSkillTokens("line\n".repeat(MAX_SKILL_LINES + 1)),
    }]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("estimates body tokens from UTF-8 bytes after collapsing whitespace", () => {
  assert.equal(estimateSkillTokens("a   b\n\nc"), 2);
  assert.equal(estimateSkillTokens("éé"), 1);
});

test("allows the estimated-token boundary and rejects one over, even below 500 lines", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "clerk-skill-tokens-"));
  try {
    const skill = path.join(root, "skills", "wide");
    await mkdir(skill, { recursive: true });
    const file = path.join(skill, "SKILL.md");
    const atLimit = "abcd".repeat(MAX_ESTIMATED_TOKENS);
    const overLimit = `${atLimit}a`;
    assert.equal(estimateSkillTokens(atLimit), MAX_ESTIMATED_TOKENS);
    assert.equal(estimateSkillTokens(overLimit), MAX_ESTIMATED_TOKENS + 1);
    await writeFile(file, atLimit);
    assert.deepEqual(await checkSkillLengths(root), []);
    await writeFile(file, overLimit);
    assert.deepEqual(await checkSkillLengths(root), [{
      file: path.join("skills", "wide", "SKILL.md"),
      lines: 1,
      tokens: MAX_ESTIMATED_TOKENS + 1,
    }]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not count YAML frontmatter toward the estimated instruction budget", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "clerk-skill-frontmatter-"));
  try {
    const skill = path.join(root, "skills", "metadata");
    await mkdir(skill, { recursive: true });
    const body = "Follow this instruction.\r\n";
    const content = `---\r\ndescription: ${"word ".repeat(MAX_ESTIMATED_TOKENS + 1)}\r\n---\r\n${body}`;
    await writeFile(path.join(skill, "SKILL.md"), content);
    assert.equal(estimateSkillTokens(content), estimateSkillTokens(body));
    assert.deepEqual(await checkSkillLengths(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
