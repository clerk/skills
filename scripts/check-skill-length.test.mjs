import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { checkSkillLengths, countLines, MAX_SKILL_LINES } from "./check-skill-length.mjs";

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
    assert.deepEqual(await checkSkillLengths(root), [{
      file: path.join("skills", "future", "clerk-nested", "SKILL.md"),
      lines: MAX_SKILL_LINES + 1,
    }]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
