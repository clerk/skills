import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { checkSkillLengths, countLines, MAX_SKILL_BYTES, MAX_SKILL_LINES } from "./check-skill-length.mjs";

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
      bytes: Buffer.byteLength("line\n".repeat(MAX_SKILL_LINES + 1)),
    }]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("allows the byte boundary and rejects one byte over, even below 500 lines", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "clerk-skill-bytes-"));
  try {
    const skill = path.join(root, "skills", "wide");
    await mkdir(skill, { recursive: true });
    const file = path.join(skill, "SKILL.md");
    await writeFile(file, "x".repeat(MAX_SKILL_BYTES));
    assert.deepEqual(await checkSkillLengths(root), []);
    await writeFile(file, "x".repeat(MAX_SKILL_BYTES + 1));
    assert.deepEqual(await checkSkillLengths(root), [{
      file: path.join("skills", "wide", "SKILL.md"),
      lines: 1,
      bytes: MAX_SKILL_BYTES + 1,
    }]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("counts UTF-8 bytes, not JavaScript characters", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "clerk-skill-utf8-"));
  try {
    const skill = path.join(root, "skills", "unicode");
    await mkdir(skill, { recursive: true });
    await writeFile(path.join(skill, "SKILL.md"), "é".repeat(MAX_SKILL_BYTES / 2 + 1));
    assert.equal((await checkSkillLengths(root))[0].bytes, MAX_SKILL_BYTES + 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
