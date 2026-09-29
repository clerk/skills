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
      {
        source: "/docs/releases/:path+",
        destination: "/docs/changelog/:path+",
        permanent: true,
      },
      {
        source: "/docs/optional/:slug?",
        destination: "/docs/destination/:slug?",
        permanent: true,
      },
      {
        source: "/docs/framework/:sdk(nextjs|react)",
        destination: "/docs/:sdk/getting-started/quickstart",
        permanent: true,
      },
      {
        source: "/docs/literal/*",
        destination: "/docs/destination",
        permanent: true,
      },
    ],
  },
};

// Copied from redirects.dynamic in https://clerk.com/docs/links.json on
// 2026-09-29. The manifest publishes sources in path-to-regexp v8 form, with
// optional `{/*name}` groups.
const liveDynamicRedirects = [
  {
    source: "/docs/authentication/enterprise-connections{/*path}",
    destination:
      "/docs/guides/configure/auth-strategies/enterprise-connections{/*path}",
    permanent: true,
  },
  {
    source: "/docs/components/customization{/*path}",
    destination: "/docs/guides/customizing-clerk{/*path}",
    permanent: true,
  },
  {
    source: "/docs/customization/account-portal{/*path}",
    destination: "/docs/guides/account-portal{/*path}",
    permanent: true,
  },
  {
    source: "/docs/elements{/*path}",
    destination: "/docs/guides/customizing-clerk/elements{/*path}",
    permanent: true,
  },
  {
    source: "/docs/customization/elements{/*path}",
    destination: "/docs/guides/customizing-clerk/elements{/*path}",
    permanent: true,
  },
  {
    source: "/docs/integrations/webhooks{/*path}",
    destination: "/docs/guides/development/webhooks{/*path}",
    permanent: true,
  },
  {
    source: "/docs/hooks{/*path}",
    destination: "/docs/reference/hooks{/*path}",
    permanent: true,
  },
  {
    source: "/docs/references{/*path}",
    destination: "/docs/reference{/*path}",
    permanent: true,
  },
];

const liveManifest = {
  routes: {
    "/docs/nextjs/getting-started/quickstart": [],
    "/docs/getting-started/quickstart": [],
    "/docs/reference/hooks/use-auth": [],
  },
  redirects: {
    static: {
      "/docs/configure-middleware":
        "/docs/getting-started/quickstart#protect-your-application",
      "/docs/integrations/webhooks":
        "/docs/guides/development/webhooks/overview",
    },
    dynamic: [
      ...liveDynamicRedirects,
      {
        source: "/docs/sdk/:name{/:page}",
        destination: "/docs/:name/overview{/:page}",
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

  it("ignores clerk.com paths that only share the /docs prefix", () => {
    assert.deepEqual(
      extractDocsLinks(
        "https://clerk.com/docs-broken and https://clerk.com/docsearch/foo",
      ),
      [],
    );
  });

  it("captures root-level anchors and query strings", () => {
    assert.deepEqual(extractDocsLinks("https://clerk.com/docs#missing"), [
      { line: 1, url: "https://clerk.com/docs#missing" },
    ]);
    assert.deepEqual(extractDocsLinks("https://clerk.com/docs?sdk=nextjs"), [
      { line: 1, url: "https://clerk.com/docs?sdk=nextjs" },
    ]);
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
    assert.deepEqual(
      validateLink(
        "https://clerk.com/docs/nextjs/getting-started/quickstart#install-clerk%zz",
        manifest,
      ),
      { status: "invalid", reason: "malformed anchor" },
    );
  });

  it("warns for static and dynamic redirects", () => {
    assert.deepEqual(
      validateLink("https://clerk.com/docs/nextjs/quickstart", manifest),
      {
        status: "redirect",
        destination: "/docs/nextjs/getting-started/quickstart",
      },
    );
    assert.deepEqual(
      validateLink("https://clerk.com/docs/hooks/use-auth", manifest),
      { status: "redirect", destination: "/docs/reference/hooks/use-auth" },
    );
  });

  it("warns for SDK-scoped forms of compact redirects", () => {
    assert.deepEqual(
      validateLink(
        "https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/layout",
        manifest,
      ),
      {
        status: "redirect",
        destination:
          "/docs/nextjs/guides/customizing-clerk/appearance-prop/options",
      },
    );
    assert.deepEqual(
      validateLink("https://clerk.com/docs/nextjs/hooks/use-auth", manifest),
      {
        status: "redirect",
        destination: "/docs/nextjs/reference/hooks/use-auth",
      },
    );
  });

  it("supports dynamic redirect modifiers and escapes bare stars", () => {
    for (const [pathname, destination] of [
      ["/docs/releases/2026/september", "/docs/changelog/2026/september"],
      ["/docs/optional", "/docs/destination"],
      ["/docs/optional/value", "/docs/destination/value"],
      ["/docs/framework/react", "/docs/react/getting-started/quickstart"],
      ["/docs/literal/*", "/docs/destination"],
    ]) {
      assert.deepEqual(validateLink(`https://clerk.com${pathname}`, manifest), {
        status: "redirect",
        destination,
      });
    }

    for (const pathname of [
      "/docs/releases",
      "/docs/framework/vue",
      "/docs/literal/anything",
    ]) {
      assert.deepEqual(validateLink(`https://clerk.com${pathname}`, manifest), {
        status: "invalid",
        reason: "page does not exist",
      });
    }
  });

  it("resolves every live dynamic redirect with and without a trailing path", () => {
    for (const { source, destination } of liveDynamicRedirects) {
      const base = source.replace("{/*path}", "");
      const target = destination.replace("{/*path}", "");

      assert.deepEqual(validateLink(`https://clerk.com${base}`, liveManifest), {
        status: "redirect",
        destination: target,
      });
      assert.deepEqual(
        validateLink(`https://clerk.com${base}/one/two`, liveManifest),
        { status: "redirect", destination: `${target}/one/two` },
      );
      assert.deepEqual(
        validateLink(`https://clerk.com${base}-suffix`, liveManifest),
        { status: "invalid", reason: "page does not exist" },
      );
    }
  });

  it("resolves the live links reported in DOCS-12216", () => {
    assert.deepEqual(
      validateLink("https://clerk.com/docs/hooks/use-auth", liveManifest),
      { status: "redirect", destination: "/docs/reference/hooks/use-auth" },
    );
    assert.deepEqual(
      validateLink(
        "https://clerk.com/docs/references/nextjs/overview",
        liveManifest,
      ),
      { status: "redirect", destination: "/docs/reference/nextjs/overview" },
    );
    assert.deepEqual(
      validateLink(
        "https://clerk.com/docs/nextjs/hooks/use-auth",
        liveManifest,
      ),
      {
        status: "redirect",
        destination: "/docs/nextjs/reference/hooks/use-auth",
      },
    );
  });

  it("prefers dynamic redirects over overlapping static ones, like production", () => {
    assert.deepEqual(
      validateLink(
        "https://clerk.com/docs/integrations/webhooks",
        liveManifest,
      ),
      {
        status: "redirect",
        destination: "/docs/guides/development/webhooks",
      },
    );
    assert.deepEqual(
      validateLink(
        "https://clerk.com/docs/nextjs/integrations/webhooks",
        liveManifest,
      ),
      {
        status: "redirect",
        destination: "/docs/nextjs/guides/development/webhooks",
      },
    );
  });

  it("matches dynamic redirect sources case-insensitively, like production", () => {
    assert.deepEqual(
      validateLink("https://clerk.com/docs/Hooks/use-auth", liveManifest),
      { status: "redirect", destination: "/docs/reference/hooks/use-auth" },
    );
    assert.deepEqual(
      validateLink("https://clerk.com/docs/nextjs/Quickstart", manifest),
      { status: "invalid", reason: "page does not exist" },
    );
  });

  it("supports optional named-parameter groups", () => {
    assert.deepEqual(
      validateLink("https://clerk.com/docs/sdk/react", liveManifest),
      { status: "redirect", destination: "/docs/react/overview" },
    );
    assert.deepEqual(
      validateLink("https://clerk.com/docs/sdk/react/hooks", liveManifest),
      { status: "redirect", destination: "/docs/react/overview/hooks" },
    );
    assert.deepEqual(
      validateLink(
        "https://clerk.com/docs/sdk/react/hooks/extra",
        liveManifest,
      ),
      { status: "invalid", reason: "page does not exist" },
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
  it("annotates each invalid link and continues after a malformed anchor", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "check-docs-links-"),
    );
    const errors = [];
    const originalConsoleError = console.error;

    try {
      await mkdir(path.join(directory, "skills"));
      await writeFile(
        path.join(directory, "skills", "broken.md"),
        "First line\nhttps://clerk.com/docs/nextjs/getting-started/quickstart#install-clerk%zz\nhttps://clerk.com/docs/does-not-exist\n",
      );
      console.error = (message) => errors.push(message);

      await assert.rejects(
        run({
          cwd: directory,
          manifestUrl: `data:application/json,${encodeURIComponent(JSON.stringify(manifest))}`,
          paths: "skills/**/*.md",
        }),
        /Found 2 invalid Clerk docs links/,
      );
    } finally {
      console.error = originalConsoleError;
      await rm(directory, { recursive: true, force: true });
    }

    assert.match(
      errors.join("\n"),
      /::error file=skills\/broken\.md,line=2::https:\/\/clerk\.com\/docs\/nextjs\/getting-started\/quickstart#install-clerk%25zz — malformed anchor/,
    );
    assert.match(
      errors.join("\n"),
      /::error file=skills\/broken\.md,line=3::https:\/\/clerk\.com\/docs\/does-not-exist — page does not exist/,
    );
  });

  it("warns with the redirect destination instead of failing", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "check-docs-links-"),
    );
    const warnings = [];
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;

    try {
      await mkdir(path.join(directory, "skills"));
      await writeFile(
        path.join(directory, "skills", "hooks.md"),
        [
          "https://clerk.com/docs/hooks/use-auth",
          "https://clerk.com/docs/hooks/use-auth.md?sdk=nextjs#usage",
          "https://clerk.com/docs/nextjs/configure-middleware.md?x=1#ignored",
          "",
        ].join("\n"),
      );
      console.warn = (message) => warnings.push(message);
      console.log = () => {};

      await run({
        cwd: directory,
        manifestUrl: `data:application/json,${encodeURIComponent(JSON.stringify(liveManifest))}`,
        paths: "skills/**/*.md",
      });
    } finally {
      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;
      await rm(directory, { recursive: true, force: true });
    }

    assert.deepEqual(warnings, [
      "::warning file=skills/hooks.md,line=1::https://clerk.com/docs/hooks/use-auth resolves through a redirect to https://clerk.com/docs/reference/hooks/use-auth",
      "::warning file=skills/hooks.md,line=2::https://clerk.com/docs/hooks/use-auth.md?sdk=nextjs#usage resolves through a redirect to https://clerk.com/docs/reference/hooks/use-auth.md?sdk=nextjs#usage",
      "::warning file=skills/hooks.md,line=3::https://clerk.com/docs/nextjs/configure-middleware.md?x=1#ignored resolves through a redirect to https://clerk.com/docs/nextjs/getting-started/quickstart.md?x=1#protect-your-application",
    ]);
  });

  it("retries when reading the manifest body fails transiently", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "check-docs-links-"),
    );
    const originalFetch = globalThis.fetch;
    let attempts = 0;

    try {
      await mkdir(path.join(directory, "skills"));
      await writeFile(
        path.join(directory, "skills", "ok.md"),
        "https://clerk.com/docs/nextjs/getting-started/quickstart\n",
      );

      globalThis.fetch = async () => {
        attempts += 1;
        // First attempt: an ok response whose body fails to decode, as a
        // truncated response would.
        if (attempts === 1) {
          return {
            ok: true,
            status: 200,
            json: async () => {
              throw new Error("Unexpected end of JSON input");
            },
          };
        }
        return { ok: true, status: 200, json: async () => manifest };
      };

      await run({
        cwd: directory,
        manifestUrl: "https://example.test/links.json",
        paths: "skills/**/*.md",
      });
    } finally {
      globalThis.fetch = originalFetch;
      await rm(directory, { recursive: true, force: true });
    }

    assert.equal(attempts, 2);
  });
});
