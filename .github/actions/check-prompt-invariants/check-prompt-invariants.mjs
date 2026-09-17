import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { toString } from "mdast-util-to-string";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import {
  loadManifest,
  validateLink,
} from "../check-docs-links/check-docs-links.mjs";

const DEFAULT_PROMPT_PATH = "skills/core/clerk-setup/SKILL.md";
const DEFAULT_MANIFEST_URL = "https://clerk.com/docs/links.json";

const packageRunnerPattern = String.raw`(?:npx(?:\s+-y)?|pnpm\s+dlx|bunx|yarn\s+dlx)`;
const clerkCommandPattern = String.raw`clerk(?:@[^\s]+)?`;
const clerkCommand = new RegExp(
  `^(?:${packageRunnerPattern}\\s+)?${clerkCommandPattern}(?:\\s|$)`,
);
const packageRunnerCommand = new RegExp(
  `^${packageRunnerPattern}\\s+clerk@latest(?:\\s|$)`,
);
const initCommand = new RegExp(
  `${packageRunnerPattern}\\s+clerk@latest\\s+init(?![\\w-])`,
);
const loginCommand = new RegExp(
  `${packageRunnerPattern}\\s+clerk@latest\\s+auth\\s+login(?![\\w-])`,
);
// Preserve command order within a line so every chained Clerk invocation is
// validated independently.
const shellCommandSeparator = /\s*(?:&&|\|\||[;&|])\s*/;
const globalCliInstall =
  /\b(?:(?:npm\s+(?:install|i)|pnpm\s+add|bun\s+add)\s+(?:(?:--global|-g)\s+[^\n`]*\bclerk\b|[^\n`]*\bclerk\b[^\n`]*\s(?:--global|-g)\b)|yarn\s+global\s+add\s+[^\n`]*\bclerk\b)/i;
const frameworkQuickstartUrl =
  /https:\/\/clerk\.com\/docs\/[^\s`|)>]+\/getting-started\/quickstart[^\s`|)>]*/g;

function valueStartLine(content, node) {
  const line = node.position?.start.line ?? 1;
  const offset = node.position?.start.offset;
  if (node.type !== "code" || offset === undefined) {
    return line;
  }

  return /^(?:`{3,}|~{3,})/.test(content.slice(offset)) ? line + 1 : line;
}

function markdownDetails(content) {
  const tree = remark().use(remarkFrontmatter).use(remarkGfm).parse(content);
  const commands = [];
  const globalInstalls = [];
  const quickstartUrls = [];
  // Track root-level section headings, outermost first. Headings inside a
  // blockquote or list do not make a login step optional.
  const headings = [];

  visit(
    tree,
    ["heading", "text", "code", "inlineCode"],
    (node, _index, parent) => {
      if (node.type === "heading") {
        if (parent?.type !== "root") {
          return;
        }
        while (
          headings.length &&
          headings[headings.length - 1].depth >= node.depth
        ) {
          headings.pop();
        }
        headings.push({ depth: node.depth, text: toString(node) });
        return;
      }

      const startLine = valueStartLine(content, node);
      for (const [lineOffset, line] of node.value.split("\n").entries()) {
        const lineNumber = startLine + lineOffset;
        if (globalCliInstall.test(line)) {
          globalInstalls.push(lineNumber);
        }
        if (node.type === "text") {
          continue;
        }

        for (const shellCommand of line.split(shellCommandSeparator)) {
          const command = shellCommand.trim().replace(/^\$\s+/, "");
          if (clerkCommand.test(command)) {
            commands.push({
              command,
              headings: headings.map(({ text }) => text),
              line: lineNumber,
              type: node.type,
            });
          }
        }
      }
    },
  );

  visit(
    tree,
    ["link", "text", "code", "inlineCode"],
    (node, _index, parent) => {
      if (
        (node.type === "text" || node.type === "inlineCode") &&
        parent?.type === "link"
      ) {
        return;
      }

      const value = node.type === "link" ? node.url : node.value;
      const startLine =
        node.type === "link"
          ? (node.position?.start.line ?? 1)
          : valueStartLine(content, node);
      for (const match of value.matchAll(frameworkQuickstartUrl)) {
        quickstartUrls.push({
          line:
            startLine + value.slice(0, match.index ?? 0).split("\n").length - 1,
          value: match[0],
        });
      }
    },
  );

  return { commands, globalInstalls, quickstartUrls };
}

export function checkPromptInvariants({ content, filePath, manifest }) {
  const errors = [];
  const report = (message, line) => errors.push({ filePath, line, message });
  const { commands, globalInstalls, quickstartUrls } = markdownDetails(content);

  for (const line of globalInstalls) {
    report("do not install the Clerk CLI globally", line);
  }

  for (const { command, line } of commands) {
    if (packageRunnerCommand.test(command) === false) {
      report(
        `use a package runner with clerk@latest instead of \`${command}\``,
        line,
      );
    }
  }

  const fencedCommands = commands.filter(({ type }) => type === "code");
  const firstInitIndex = fencedCommands.findIndex(({ command }) =>
    initCommand.test(command),
  );
  if (firstInitIndex === -1) {
    report("include Clerk initialization in setup guidance");
  } else {
    const requiredLogin = fencedCommands
      .slice(0, firstInitIndex)
      .find(
        ({ command, headings }) =>
          loginCommand.test(command) &&
          headings.some((heading) => /\(optional\)/i.test(heading)) === false,
      );
    if (requiredLogin) {
      report(
        "do not require Clerk authentication before initialization",
        requiredLogin.line,
      );
    }
  }

  for (const quickstartUrl of quickstartUrls) {
    const rawUrl = quickstartUrl.value.replace(/[.,;:!]+$/, "");
    const url = new URL(rawUrl);
    if (url.pathname.endsWith(".md") === false) {
      report("framework quickstart links must end in .md", quickstartUrl.line);
      continue;
    }

    const result = validateLink(rawUrl, manifest);
    if (result.status !== "valid") {
      report(
        `quickstart link does not resolve directly: ${rawUrl} — ${
          result.reason ?? "redirect"
        }`,
        quickstartUrl.line,
      );
    }
  }

  return errors;
}

export function validatePromptInvariants(options) {
  const errors = checkPromptInvariants(options);
  if (errors.length) {
    throw new Error(
      `Prompt invariant validation failed:\n${errors
        .map(
          ({ filePath, line, message }) =>
            `- ${filePath}${line ? `:${line}` : ""}: ${message}`,
        )
        .join("\n")}`,
    );
  }
}

function escapeAnnotation(value) {
  return value
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A");
}

export async function run({ cwd, manifestUrl, promptPath }) {
  const [content, manifest] = await Promise.all([
    readFile(path.join(cwd, promptPath), "utf8"),
    loadManifest(manifestUrl),
  ]);
  const errors = checkPromptInvariants({
    content,
    filePath: promptPath,
    manifest,
  });

  for (const { filePath, line, message } of errors) {
    const location = line ? `,line=${line}` : "";
    console.error(
      `::error file=${escapeAnnotation(filePath)}${location}::${escapeAnnotation(
        message,
      )}`,
    );
  }

  if (errors.length) {
    throw new Error(
      `Found ${errors.length} prompt invariant ${
        errors.length === 1 ? "violation" : "violations"
      }.`,
    );
  }

  console.log(`Validated prompt invariants in ${promptPath}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run({
    cwd: process.cwd(),
    manifestUrl: process.env.CLERK_DOCS_MANIFEST_URL ?? DEFAULT_MANIFEST_URL,
    promptPath: process.env.CLERK_SETUP_PROMPT_PATH ?? DEFAULT_PROMPT_PATH,
  }).catch((error) => {
    console.error(`::error::${escapeAnnotation(error.message)}`);
    process.exitCode = 1;
  });
}
