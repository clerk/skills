import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  checkPromptInvariants,
  PROMPT_PATH,
  validatePromptInvariants,
} from "./check-prompt-invariants.mjs";

const manifest = {
  routes: {
    "/docs/nextjs/getting-started/quickstart": ["install-clerk"],
  },
  redirects: { dynamic: [], static: {} },
};
const canonicalQuickstartPaths = [
  "android",
  "astro",
  "chrome-extension",
  "expo",
  "expressjs",
  "fastify",
  "ios",
  "js-frontend",
  "nextjs",
  "nuxt",
  "react-router",
  "react",
  "tanstack-react-start",
  "vue",
];
const canonicalManifest = {
  routes: Object.fromEntries(
    canonicalQuickstartPaths.map((slug) => [
      `/docs/${slug}/getting-started/quickstart`,
      [],
    ]),
  ),
  redirects: { dynamic: [], static: {} },
};
const shellCommandSeparators = ["&&", "||", ";", "&", "|"];
const defaultQuickstartUrl =
  "https://clerk.com/docs/nextjs/getting-started/quickstart.md";

function options(
  content,
  customManifest = manifest,
  includeDefaultQuickstart = true,
) {
  return {
    content: includeDefaultQuickstart
      ? `${content}\n${defaultQuickstartUrl}`
      : content,
    filePath: PROMPT_PATH,
    manifest: customManifest,
  };
}

function codeFence(content, info = "bash") {
  return ["```" + info, content, "```"].join("\n");
}

function assertViolation(
  content,
  expected,
  customManifest = manifest,
  includeDefaultQuickstart = true,
) {
  assert.throws(
    () =>
      validatePromptInvariants(
        options(content, customManifest, includeDefaultQuickstart),
      ),
    (error) => error.message.includes(expected),
  );
}

test("accepts current package-runner, setup, and quickstart forms", () => {
  assert.doesNotThrow(() =>
    validatePromptInvariants(
      options(
        "Supported frameworks default to accountless setup.\n```bash\nnpx clerk@latest init\n```\nThen `npx clerk@latest auth login`.\nhttps://clerk.com/docs/nextjs/getting-started/quickstart.md",
      ),
    ),
  );
});

test("leaves accountless wording to the prompt style guide", () => {
  assert.doesNotThrow(() =>
    validatePromptInvariants(
      options(
        "# Accountless setup always provisions an app\nAccountless setup always provisions an app.\n```bash\nnpx clerk@latest init\n```",
      ),
    ),
  );
});

test("parses skill frontmatter separately from the prompt body", () => {
  assert.doesNotThrow(() =>
    validatePromptInvariants(
      options(
        "---\nname: clerk-setup\ndescription: Set up Clerk\n---\n# Set up Clerk\n```bash\nnpx clerk@latest init\n```",
      ),
    ),
  );
});

for (const command of [
  "npm install -g clerk",
  "npm install clerk -g",
  "npm add -g clerk",
  "npm i --location=global clerk",
  "pnpm add --global clerk",
  "pnpm add clerk --global",
  "pnpm i -g clerk",
  "bun install -g clerk",
  "bun i -g clerk",
  "npm -g install clerk",
]) {
  test(`rejects global CLI installation: ${command}`, () => {
    assertViolation(
      `${codeFence("npx clerk@latest init")}\nRun \`${command}\`.`,
      "globally",
    );
  });
}

test("does not treat scoped Clerk packages or isolated CLI names as commands", () => {
  assert.doesNotThrow(() =>
    validatePromptInvariants(
      options(
        [
          codeFence("npx clerk@latest init"),
          "The package is `clerk` or `clerk@latest`.",
          "Use `npm install -g @clerk/ui` for this SDK package.",
          codeFence("pnpm add --global @clerk/nextjs"),
        ].join("\n"),
      ),
    ),
  );
});

for (const command of [
  "npx --yes clerk init",
  "npx -p clerk clerk init",
  "npx --no-install clerk init",
  "bunx --bun clerk init",
  "npm exec clerk init",
  "npm exec --yes clerk init",
  "pnpm dlx --silent clerk init",
]) {
  test(`rejects an unversioned runner command beside valid init: ${command}`, () => {
    assertViolation(
      `${codeFence("npx clerk@latest init")}\n${codeFence(command)}`,
      "package runner",
    );
  });
}

for (const command of [
  "npx --yes clerk@latest init",
  "bunx --bun clerk@latest init",
  "npm exec clerk@latest init",
  "npm exec --package=clerk@latest -- clerk init",
  "npx -p clerk@latest clerk init",
  "pnpm dlx --silent clerk@latest init",
]) {
  test(`accepts a pinned runner command: ${command}`, () => {
    assert.doesNotThrow(() => validatePromptInvariants(options(codeFence(command))));
  });
}

for (const command of [
  "sudo clerk init",
  "env FOO=bar clerk init",
  "command clerk init",
]) {
  test(`rejects a prefixed bare CLI command alongside valid init: ${command}`, () => {
    assertViolation(
      `${codeFence("npx clerk@latest init")}\n${codeFence(command)}`,
      "package runner",
    );
  });
}

test("accepts a package-runner command behind a shell prefix", () => {
  assert.doesNotThrow(() =>
    validatePromptInvariants(
      options(codeFence("env FOO=bar npx clerk@latest init")),
    ),
  );
});

test("rejects global CLI installation in prose", () => {
  assertViolation(
    `${codeFence("npx clerk@latest init")}\nInstall it with npm install -g clerk if needed.`,
    "globally",
  );
});

test("rejects a global CLI installation followed immediately by prose punctuation", () => {
  assertViolation(
    `${codeFence("npx clerk@latest init")}\nRun npm install -g clerk.`,
    "globally",
  );
});

test("recognizes a versioned init command split across shell continuation lines", () => {
  const command = ["npx \\", "clerk@latest init"].join("\n");
  assert.doesNotThrow(() => validatePromptInvariants(options(codeFence(command))));
});

test("rejects an unversioned command split across shell continuation lines", () => {
  const command = ["npx \\", "clerk init"].join("\n");
  assertViolation(`${codeFence("npx clerk@latest init")}\n${codeFence(command)}`, "package runner");
});

test("rejects a global install split across shell continuation lines", () => {
  const command = ["npm install \\", "-g clerk"].join("\n");
  assertViolation(`${codeFence("npx clerk@latest init")}\n${codeFence(command)}`, "globally");
});

for (const command of [
  "clerk init",
  "$ clerk init",
  "clerk@latest init",
  "npx clerk init",
]) {
  test(`rejects bare or unversioned CLI command: ${command}`, () => {
    assertViolation(codeFence(command), "package runner");
  });
}

for (const content of [
  "```console\nclerk auth login\n```",
  "```bash {{ filename: 'terminal' }}\nclerk init\n```",
]) {
  test(`rejects bare commands in any fenced code block: ${content}`, () => {
    assertViolation(content, "package runner");
  });
}

for (const separator of shellCommandSeparators) {
  test(`rejects a bare command chained with ${separator}`, () => {
    assertViolation(
      codeFence(`npx clerk@latest init ${separator} clerk doctor`),
      "package runner",
    );
  });
}

test("reports the correct line for repeated invalid commands", () => {
  assertViolation(codeFence("clerk init\n\nclerk init"), ":4:");
});

test("returns structured errors for GitHub annotations", () => {
  const [error] = checkPromptInvariants(
    options(codeFence("clerk@latest init")),
  );

  assert.deepEqual(error, {
    filePath: PROMPT_PATH,
    line: 2,
    message:
      "use a package runner with clerk@latest instead of `clerk@latest init`",
  });
});

test("accepts optional sign-in before init for an existing application", () => {
  assert.doesNotThrow(() =>
    validatePromptInvariants(
      options(
        "## Step 1: Sign in (optional)\n```bash\nnpx clerk@latest auth login\n```\n## Step 2: Initialize\n```bash\nnpx clerk@latest init --app app_123\n```",
      ),
    ),
  );
});

test("accepts optional sign-in under a subheading of an optional step", () => {
  assert.doesNotThrow(() =>
    validatePromptInvariants(
      options(
        "## Step 1: Sign in (optional)\n### Run the login\n```bash\nnpx clerk@latest auth login\n```\n## Step 2: Initialize\n```bash\nnpx clerk@latest init\n```",
      ),
    ),
  );
});

test("ignores optional headings inside blockquotes", () => {
  assertViolation(
    "## Step 1: Sign in\n> ## Example (optional)\n\n```bash\nnpx clerk@latest auth login\n```\n## Step 2: Initialize\n```bash\nnpx clerk@latest init\n```",
    "do not require Clerk authentication",
  );
});

test("does not let body prose make pre-init login optional", () => {
  assertViolation(
    "## Step 1: Sign in\nOnly sign in if requested. This is optional.\n```bash\nnpx clerk@latest auth login\n```\n## Step 2: Initialize\n```bash\nnpx clerk@latest init\n```",
    "do not require Clerk authentication",
  );
});

test("rejects mandatory sign-in before initialization", () => {
  assertViolation(
    "# Set up Clerk\n## Authenticate\n```bash\nnpx clerk@latest auth login\n```\n## Step 1: Initialize\n```bash\nnpx clerk@latest init\n```",
    "do not require Clerk authentication",
  );
});

test("rejects mandatory inline-code sign-in before initialization", () => {
  assertViolation(
    "## Sign in\nRun `npx -y clerk@latest auth login` first.\n## Initialize\n```bash\nnpx -y clerk@latest init\n```",
    "do not require Clerk authentication",
  );
});

test("accepts optional inline-code sign-in before initialization", () => {
  assert.doesNotThrow(() =>
    validatePromptInvariants(
      options(
        "## Sign in (optional)\nRun `npx -y clerk@latest auth login` first.\n## Initialize\n```bash\nnpx -y clerk@latest init\n```",
      ),
    ),
  );
});

for (const separator of shellCommandSeparators) {
  test(`rejects mandatory sign-in chained with ${separator} before init`, () => {
    assertViolation(
      `## Authenticate\n${codeFence(
        `npx clerk@latest auth login ${separator} npx clerk@latest init`,
      )}`,
      "do not require Clerk authentication",
    );
  });
}

test("requires setup guidance to include an initialization fence", () => {
  assertViolation(
    "Run `npx clerk@latest init` to set up Clerk.",
    "include Clerk initialization",
  );
});

for (const fallback of [
  "",
  "https://clerk.com/docs/<slug>/getting-started/quickstart.md?manual=1",
]) {
  test(`requires a concrete framework quickstart link instead of ${
    fallback || "no link"
  }`, () => {
    assertViolation(
      `${codeFence("npx clerk@latest init")}\n${fallback}`,
      "include at least one concrete framework quickstart",
      manifest,
      false,
    );
  });
}

for (const subcommand of ["initialize", "init-extra"]) {
  test(`does not treat ${subcommand} as init`, () => {
    assertViolation(
      codeFence(`npx clerk@latest ${subcommand}`),
      "include Clerk initialization",
    );
  });
}

for (const subcommand of ["logins", "login-extra"]) {
  test(`does not treat auth ${subcommand} as login`, () => {
    assert.doesNotThrow(() =>
      validatePromptInvariants(
        options(
          [
            codeFence(`npx clerk@latest auth ${subcommand}`),
            "## Step 1: Initialize",
            codeFence("npx clerk@latest init"),
          ].join("\n"),
        ),
      ),
    );
  });
}

test("rejects non-md and unroutable framework quickstart links", () => {
  assertViolation(
    `${codeFence("npx clerk@latest init")}\nhttps://clerk.com/docs/nextjs/getting-started/quickstart`,
    "end in .md",
  );
  assertViolation(
    `${codeFence("npx clerk@latest init")}\nhttps://clerk.com/docs/react/getting-started/quickstart.md`,
    "does not resolve directly",
  );
});

for (const suffix of ["#install-clerk", "?manual=1"]) {
  test(`accepts a quickstart .md URL with ${suffix}`, () => {
    assert.doesNotThrow(() =>
      validatePromptInvariants(
        options(
          `${codeFence(
            "npx clerk@latest init",
          )}\nhttps://clerk.com/docs/nextjs/getting-started/quickstart.md${suffix}`,
        ),
      ),
    );
  });
}

test("accepts an inline-code quickstart URL without its closing backtick", () => {
  assert.doesNotThrow(() =>
    validatePromptInvariants(
      options(
        `${codeFence(
          "npx clerk@latest init",
        )}\nUse \`https://clerk.com/docs/nextjs/getting-started/quickstart.md\`.`,
      ),
    ),
  );
});

test("validates quickstart URLs inside fenced code blocks", () => {
  assertViolation(
    `${codeFence(
      "npx clerk@latest init",
    )}\n\`\`\`text\nhttps://clerk.com/docs/react/getting-started/quickstart.md\n\`\`\``,
    "does not resolve directly",
  );
});

for (const suffix of [".mdx", ".md-old"]) {
  test(`rejects a quickstart URL ending in ${suffix}`, () => {
    assertViolation(
      `${codeFence(
        "npx clerk@latest init",
      )}\nhttps://clerk.com/docs/nextjs/getting-started/quickstart${suffix}`,
      "end in .md",
    );
  });
}

test("the canonical setup skill passes the invariant checker", async () => {
  const content = await readFile(PROMPT_PATH, "utf8");
  assert.doesNotThrow(() =>
    validatePromptInvariants(options(content, canonicalManifest, false)),
  );
});

test("the canonical init commands avoid installing skills globally", async () => {
  const content = await readFile(PROMPT_PATH, "utf8");
  const initCommands = content.match(/^npx -y clerk@latest init[^\n]*$/gm) ?? [];
  assert.equal(initCommands.length, 2);
  for (const command of initCommands) {
    assert.match(command, /(?:^|\s)--no-skills(?:\s|$)/);
  }
});
