import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { toString } from "mdast-util-to-string";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { parse as parseShell } from "shell-quote";
import { visit } from "unist-util-visit";
import {
  DEFAULT_MANIFEST_URL,
  loadManifest,
  validateLink,
} from "./check-docs-links.mjs";

export const PROMPT_PATH = "skills/core/clerk-setup/SKILL.md";

const frameworkQuickstartUrl =
  /https:\/\/clerk\.com\/docs\/[^\s`|)>]+\/getting-started\/quickstart[^\s`|)>]*/g;

function commandSegments(line) {
  let tokens;
  try {
    tokens = parseShell(line);
  } catch {
    // Markdown also contains non-shell snippets. A malformed line cannot be a
    // reliable command until it is fixed, so leave it for human review.
    return [];
  }

  const segments = [[]];
  for (const token of tokens) {
    if (
      typeof token === "object" &&
      "op" in token &&
      ["&&", "||", ";", "|", "&", "|&"].includes(token.op)
    ) {
      segments.push([]);
    } else if (typeof token === "string") {
      segments[segments.length - 1].push(token);
    } else if (typeof token === "object" && "pattern" in token) {
      segments[segments.length - 1].push(token.pattern);
    }
  }
  return segments.filter((segment) => segment.length > 0);
}

function logicalLines(value, startLine) {
  const lines = [];
  let pending = "";
  let pendingLine = startLine;
  let continuing = false;

  for (const [offset, line] of value.split("\n").entries()) {
    if (!continuing) pendingLine = startLine + offset;
    continuing = line.endsWith("\\");
    pending += continuing ? line.slice(0, -1) : line;
    if (!continuing) {
      lines.push({ text: pending, line: pendingLine });
      pending = "";
    }
  }
  if (continuing) lines.push({ text: pending, line: pendingLine });
  return lines;
}

function runnerOptions(command, startIndex, shortPackageOption = false) {
  let index = startIndex;
  let packageName;
  while (command[index]?.startsWith("-")) {
    const option = command[index++];
    if (option === "--") break;
    if ((shortPackageOption && option === "-p") || option === "--package") {
      packageName = command[index++];
    } else if (option.startsWith("--package=")) {
      packageName = option.slice("--package=".length);
    } else if (["-w", "--workspace"].includes(option)) {
      index++;
    }
  }
  return { index, packageName };
}

function unwrapCommand(tokens) {
  let remaining = tokens[0] === "$" ? tokens.slice(1) : tokens;
  while (remaining.length) {
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(remaining[0])) {
      remaining = remaining.slice(1);
    } else if (remaining[0] === "sudo") {
      remaining = remaining.slice(1);
      const optionsWithValues = new Set([
        "-u",
        "--user",
        "-g",
        "--group",
        "-h",
        "--host",
        "-p",
        "--prompt",
        "-r",
        "--role",
        "-t",
        "--type",
        "-C",
        "--close-from",
        "-D",
        "--chdir",
        "-T",
        "--command-timeout",
      ]);
      while (remaining[0]?.startsWith("-")) {
        if (remaining[0] === "--") {
          remaining = remaining.slice(1);
          break;
        }
        remaining = remaining.slice(optionsWithValues.has(remaining[0]) ? 2 : 1);
      }
    } else if (remaining[0] === "command") {
      remaining = remaining.slice(1);
      while (["-p", "-v", "-V"].includes(remaining[0])) {
        remaining = remaining.slice(1);
      }
      if (remaining[0] === "--") remaining = remaining.slice(1);
    } else if (remaining[0] === "env") {
      remaining = remaining.slice(1);
      while (remaining[0]?.startsWith("-") || /^[A-Za-z_][A-Za-z0-9_]*=/.test(remaining[0] ?? "")) {
        if (remaining[0] === "--") {
          remaining = remaining.slice(1);
          break;
        }
        remaining = remaining.slice(["-u", "--unset"].includes(remaining[0]) ? 2 : 1);
      }
    } else {
      break;
    }
  }
  return remaining;
}

function clerkInvocation(tokens) {
  const command = unwrapCommand(tokens);
  let index = 0;
  let runner = false;
  let packageName;

  if (command[0] === "npx" || command[0] === "bunx") {
    runner = true;
    ({ index, packageName } = runnerOptions(command, 1, true));
  } else if (
    ["pnpm", "yarn"].includes(command[0]) &&
    command[1] === "dlx"
  ) {
    runner = true;
    ({ index, packageName } = runnerOptions(command, 2));
  } else if (command[0] === "npm" && command[1] === "exec") {
    runner = true;
    ({ index, packageName } = runnerOptions(command, 2));
  }

  const executable = command[index];
  const name =
    packageName &&
    /^clerk(?:@[^\s]+)?$/.test(packageName) &&
    /^clerk(?:@[^\s]+)?$/.test(executable ?? "")
      ? packageName
      : executable;
  if (!/^clerk(?:@[^\s]+)?$/.test(name ?? "") || (!runner && command.length <= index + 1)) {
    return null;
  }
  return { name, runner, args: command.slice(index + 1) };
}

function isGlobalCliInstall(tokens, prose = false) {
  const command = unwrapCommand(tokens);
  const manager = command[0];
  let actionIndex = 1;
  while (command[actionIndex]?.startsWith("-")) {
    actionIndex += ["--location", "--prefix"].includes(command[actionIndex]) ? 2 : 1;
  }
  const action = command[actionIndex];
  const args = command.slice(actionIndex + 1);
  const install =
    (manager === "npm" && ["install", "i", "add"].includes(action)) ||
    (manager === "pnpm" && ["add", "install", "i"].includes(action)) ||
    (manager === "bun" && ["add", "install", "i"].includes(action)) ||
    (manager === "yarn" && action === "global" && args[0] === "add");
  if (!install) return false;

  const global =
    (manager === "yarn" && action === "global") ||
    command.slice(1).some((arg, index, flags) =>
      ["-g", "--global", "--location=global"].includes(arg) ||
      (arg === "--location" && flags[index + 1] === "global"),
    );
  return global && args.some((arg) =>
    /^clerk(?:@[^\s]+)?$/.test(prose ? arg.replace(/[.,;:!?]+$/, "") : arg),
  );
}

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
      for (const { text: line, line: lineNumber } of logicalLines(node.value, startLine)) {
        if (node.type === "text") {
          // Prose can still recommend a full install command. Start at each
          // package-manager token instead of treating isolated words as CLI use.
          const words = line.split(/\s+/);
          for (const [index, word] of words.entries()) {
            if (["npm", "pnpm", "bun", "yarn"].includes(word) &&
              isGlobalCliInstall(words.slice(index), true)) {
              globalInstalls.push(lineNumber);
            }
          }
          continue;
        }

        for (const segment of commandSegments(line)) {
          if (isGlobalCliInstall(segment)) globalInstalls.push(lineNumber);
          const invocation = clerkInvocation(segment);
          if (!invocation) continue;
          commands.push({
            command: segment.join(" ").replace(/^\$\s+/, ""),
            ...invocation,
            headings: headings.map(({ text }) => text),
            line: lineNumber,
            type: node.type,
          });
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

  for (const { command, name, runner, line } of commands) {
    if (!runner || name !== "clerk@latest") {
      report(
        `use a package runner with clerk@latest instead of \`${command}\``,
        line,
      );
    }
  }

  // Initialization must be a fenced command, but a login in inline code is just
  // as required, so check every login that appears before the first init fence.
  const firstInitIndex = commands.findIndex(
    ({ name, runner, args, type }) =>
      type === "code" && runner && name === "clerk@latest" && args[0] === "init",
  );
  if (firstInitIndex === -1) {
    report("include Clerk initialization in setup guidance");
  } else {
    const requiredLogin = commands
      .slice(0, firstInitIndex)
      .find(
        ({ name, runner, args, headings }) =>
          runner && name === "clerk@latest" && args[0] === "auth" && args[1] === "login" &&
          headings.some((heading) => /\(optional\)/i.test(heading)) === false,
      );
    if (requiredLogin) {
      report(
        "do not require Clerk authentication before initialization",
        requiredLogin.line,
      );
    }
  }

  if (quickstartUrls.length === 0) {
    report("include at least one concrete framework quickstart .md link");
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

export async function run({ cwd }) {
  const [content, manifest] = await Promise.all([
    readFile(path.join(cwd, PROMPT_PATH), "utf8"),
    loadManifest(DEFAULT_MANIFEST_URL),
  ]);
  const errors = checkPromptInvariants({
    content,
    filePath: PROMPT_PATH,
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

  console.log(`Validated prompt invariants in ${PROMPT_PATH}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run({ cwd: process.cwd() }).catch((error) => {
    console.error(`::error::${escapeAnnotation(error.message)}`);
    process.exitCode = 1;
  });
}
