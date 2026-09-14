import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  expandBraces,
  extractDocsLinks,
  globToRegExp,
  run,
  validateLink,
} from "./check-docs-links.mjs";

const manifest = {
  routes: {
    "/docs/guides/customizing-clerk/appearance-prop/options": [],
    "/docs/nextjs/guides/customizing-clerk/appearance-prop/options": [],
    "/docs/nextjs/getting-started/quickstart": ["install-clerk"],
  },
  redirects: {
    static: {
      "/docs/guides/customizing-clerk/appearance-prop/layout":
        "/docs/guides/customizing-clerk/appearance-prop/options",
      "/docs/nextjs/quickstart": "/docs/nextjs/getting-started/quickstart",
    },
    dynamic: [
      {
        source: "/docs/hooks/:path*",
        destination: "/docs/reference/hooks/:path*",
        permanent: true,
      },
    ],
  },
};

describe("glob helpers", () => {
  it("matches files at and below a globstar", () => {
    const pattern = globToRegExp("skills/**/*.md");

    assert.equal(pattern.test("skills/SKILL.md"), true);
    assert.equal(pattern.test("skills/core/clerk/SKILL.md"), true);
    assert.equal(pattern.test("skills/core/clerk/template.ts"), false);
  });

  it("expands brace alternatives", () => {
    assert.deepEqual(expandBraces("skills/**/*.{md,mdx}"), [
      "skills/**/*.md",
      "skills/**/*.mdx",
    ]);
  });
});

describe("extractDocsLinks", () => {
  it("reports URLs and source lines without Markdown delimiters or prose punctuation", () => {
    assert.deepEqual(
      extractDocsLinks(
        "Read [the docs](https://clerk.com/docs/nextjs/getting-started/quickstart).\nhttps://example.com",
      ),
      [
        {
          line: 1,
          url: "https://clerk.com/docs/nextjs/getting-started/quickstart",
        },
      ],
    );
  });

  it("ignores templated docs URLs", () => {
    assert.deepEqual(
      extractDocsLinks(
        "https://clerk.com/docs/{framework}/getting-started/quickstart",
      ),
      [],
    );
  });
});

describe("validateLink", () => {
  it("accepts direct page, .md, query, and valid anchor links", () => {
    for (const suffix of [
      "",
      ".md",
      "?sdk=nextjs",
      "#install-clerk",
      ".md#install-clerk",
    ]) {
      assert.deepEqual(
        validateLink(
          `https://clerk.com/docs/nextjs/getting-started/quickstart${suffix}`,
          manifest,
        ),
        {
          status: "valid",
        },
      );
    }
  });

  it("rejects missing pages and headings", () => {
    assert.deepEqual(validateLink("https://clerk.com/docs/missing", manifest), {
      status: "invalid",
      reason: "page does not exist",
    });
    assert.deepEqual(
      validateLink(
        "https://clerk.com/docs/nextjs/getting-started/quickstart#missing",
        manifest,
      ),
      {
        status: "invalid",
        reason: "heading #missing does not exist",
      },
    );
  });

  it("warns for static and dynamic redirects", () => {
    assert.deepEqual(
      validateLink("https://clerk.com/docs/nextjs/quickstart", manifest),
      { status: "redirect" },
    );
    assert.deepEqual(
      validateLink("https://clerk.com/docs/hooks/use-auth", manifest),
      { status: "redirect" },
    );
  });

  it("warns for SDK-scoped forms of compact redirects", () => {
    assert.deepEqual(
      validateLink(
        "https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/layout",
        manifest,
      ),
      { status: "redirect" },
    );
    assert.deepEqual(
      validateLink("https://clerk.com/docs/nextjs/hooks/use-auth", manifest),
      { status: "redirect" },
    );
  });

  it("does not strip unknown top-level path segments for redirects", () => {
    assert.deepEqual(
      validateLink(
        "https://clerk.com/docs/not-an-sdk/guides/customizing-clerk/appearance-prop/layout",
        manifest,
      ),
      { status: "invalid", reason: "page does not exist" },
    );
  });
});

describe("run", () => {
  it("fails with a GitHub annotation containing the offending file, line, and URL", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "check-docs-links-"),
    );
    const errors = [];
    const originalConsoleError = console.error;

    try {
      await mkdir(path.join(directory, "skills"));
      await writeFile(
        path.join(directory, "skills", "broken.md"),
        "First line\nhttps://clerk.com/docs/does-not-exist\n",
      );
      console.error = (message) => errors.push(message);

      await assert.rejects(
        run({
          cwd: directory,
          manifestUrl: `data:application/json,${encodeURIComponent(JSON.stringify(manifest))}`,
          paths: "skills/**/*.md",
        }),
        /Found 1 invalid Clerk docs link/,
      );
    } finally {
      console.error = originalConsoleError;
      await rm(directory, { recursive: true, force: true });
    }

    assert.match(
      errors.join("\n"),
      /::error file=skills\/broken\.md,line=2::https:\/\/clerk\.com\/docs\/does-not-exist — page does not exist/,
    );
  });
});
