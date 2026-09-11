import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_PATHS = "skills/**/*.md";
const DEFAULT_MANIFEST_URL = "https://clerk.com/docs/links.json";
const DOCS_URL = /https:\/\/clerk\.com\/docs(?:\/[^\s<>"'`\\)\]}]*)?/g;

function escapeRegExp(character) {
  return /[|\\{}()[\]^$+?.]/.test(character) ? `\\${character}` : character;
}

export function expandBraces(pattern) {
  const match = pattern.match(/\{([^{}]+)\}/);
  if (!match) {
    return [pattern];
  }

  return match[1]
    .split(",")
    .flatMap((part) =>
      expandBraces(
        `${pattern.slice(0, match.index)}${part}${pattern.slice((match.index ?? 0) + match[0].length)}`,
      ),
    );
}

export function globToRegExp(glob) {
  let expression = "^";

  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index];
    if (character === "*" && glob[index + 1] === "*") {
      index += 1;
      if (glob[index + 1] === "/") {
        index += 1;
        expression += "(?:.*/)?";
      } else {
        expression += ".*";
      }
    } else if (character === "*") {
      expression += "[^/]*";
    } else if (character === "?") {
      expression += "[^/]";
    } else {
      expression += escapeRegExp(character);
    }
  }

  return new RegExp(`${expression}$`);
}

function parsePatterns(value) {
  return value
    .split(/\r?\n/)
    .map((pattern) => pattern.trim().replace(/^\.\//, ""))
    .filter(Boolean)
    .flatMap((pattern) => {
      const excluded = pattern.startsWith("!");
      const glob = excluded ? pattern.slice(1) : pattern;
      return expandBraces(glob).map((expanded) => ({
        excluded,
        regex: globToRegExp(expanded),
      }));
    });
}

export function matchesPatterns(filePath, patterns) {
  let matches = false;

  for (const pattern of patterns) {
    if (pattern.regex.test(filePath)) {
      matches = !pattern.excluded;
    }
  }

  return matches;
}

async function listFiles(directory, relativeDirectory = "") {
  const entries = await readdir(path.join(directory, relativeDirectory), {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== ".git" && entry.name !== "node_modules") {
        files.push(...(await listFiles(directory, relativePath)));
      }
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

function cleanMatchedUrl(url) {
  return url.replace(/[.,;:!]+$/, "");
}

export function extractDocsLinks(content) {
  return [...content.matchAll(DOCS_URL)]
    .filter((match) => match[0].includes("{") === false)
    .map((match) => ({
      line: content.slice(0, match.index).split("\n").length,
      url: cleanMatchedUrl(match[0]),
    }));
}

function normalizePathname(pathname) {
  const withoutMarkdownExtension = pathname.endsWith(".md")
    ? pathname.slice(0, -3)
    : pathname;
  return withoutMarkdownExtension.length > 5
    ? withoutMarkdownExtension.replace(/\/$/, "")
    : withoutMarkdownExtension;
}

function dynamicRedirectMatches(pathname, source) {
  let expression = "^";

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== ":") {
      expression += escapeRegExp(source[index]);
      continue;
    }

    const parameter = source
      .slice(index)
      .match(/^:([A-Za-z0-9_]+)(?:\(([^)]+)\))?(\*)?/);
    if (!parameter) {
      expression += ":";
      continue;
    }

    expression += parameter[2]
      ? `(?:${parameter[2]})`
      : parameter[3]
        ? ".*"
        : "[^/]+";
    index += parameter[0].length - 1;
  }

  return new RegExp(`${expression}$`).test(pathname);
}

function isRedirect(pathname, redirects = {}) {
  if (redirects.static?.[pathname]) {
    return true;
  }

  return (redirects.dynamic ?? []).some((redirect) =>
    dynamicRedirectMatches(pathname, redirect.source),
  );
}

export function validateLink(rawUrl, manifest) {
  const url = new URL(rawUrl);
  const pathname = normalizePathname(url.pathname);

  if (Object.hasOwn(manifest.routes ?? {}, pathname)) {
    const anchor = decodeURIComponent(url.hash.slice(1));
    if (!anchor || manifest.routes[pathname].includes(anchor)) {
      return { status: "valid" };
    }

    return { status: "invalid", reason: `heading #${anchor} does not exist` };
  }

  if (isRedirect(pathname, manifest.redirects)) {
    return { status: "redirect" };
  }

  return { status: "invalid", reason: "page does not exist" };
}

function escapeAnnotation(value) {
  return value
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A");
}

async function loadManifest(manifestUrl) {
  const response = await fetch(manifestUrl, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(
      `Unable to fetch ${manifestUrl}: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export async function run({ cwd, manifestUrl, paths }) {
  const manifest = await loadManifest(manifestUrl);
  const patterns = parsePatterns(paths);
  const files = (await listFiles(cwd))
    .filter((filePath) => matchesPatterns(filePath, patterns))
    .sort();

  if (files.length === 0) {
    throw new Error(`No files matched: ${paths}`);
  }

  let checkedLinks = 0;
  let invalidLinks = 0;
  let redirectedLinks = 0;

  for (const filePath of files) {
    const content = await readFile(path.join(cwd, filePath), "utf8");
    for (const link of extractDocsLinks(content)) {
      checkedLinks += 1;
      const result = validateLink(link.url, manifest);
      const location = `file=${escapeAnnotation(filePath)},line=${link.line}`;

      if (result.status === "invalid") {
        invalidLinks += 1;
        console.error(
          `::error ${location}::${escapeAnnotation(`${link.url} — ${result.reason}`)}`,
        );
      } else if (result.status === "redirect") {
        redirectedLinks += 1;
        console.warn(
          `::warning ${location}::${escapeAnnotation(`${link.url} resolves through a redirect`)}`,
        );
      }
    }
  }

  console.log(
    `Checked ${checkedLinks} Clerk docs links in ${files.length} files (${redirectedLinks} redirects).`,
  );

  if (invalidLinks > 0) {
    throw new Error(
      `Found ${invalidLinks} invalid Clerk docs link${invalidLinks === 1 ? "" : "s"}.`,
    );
  }
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  run({
    cwd: process.cwd(),
    manifestUrl: process.env.CLERK_DOCS_MANIFEST_URL || DEFAULT_MANIFEST_URL,
    paths: process.env.CLERK_DOCS_LINK_PATHS || DEFAULT_PATHS,
  }).catch((error) => {
    console.error(
      `::error::${escapeAnnotation(error instanceof Error ? error.message : String(error))}`,
    );
    process.exitCode = 1;
  });
}
