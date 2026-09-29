import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { compile, match } from "path-to-regexp";

const DEFAULT_PATHS = "skills/**/*.md";
export const DEFAULT_MANIFEST_URL = "https://clerk.com/docs/links.json";
// Match /docs only when followed by a path, query, fragment, delimiter, or end
// of URL — never when another word character follows (e.g. /docs-broken or
// /docsearch), which would otherwise truncate to a bare, always-valid /docs.
const DOCS_URL =
  /https:\/\/clerk\.com\/docs(?![^\s<>"'`\\)\]}/?#])[^\s<>"'`\\)\]}]*/g;
const MANIFEST_FETCH_TIMEOUT_MS = 10000;
const MANIFEST_FETCH_RETRIES = 3;
const MANIFEST_RETRY_BASE_DELAY_MS = 250;
const manifestMetadataCache = new WeakMap();

function escapeRegExp(character) {
  return /[|\\{}()[\]^$+*?.]/.test(character) ? `\\${character}` : character;
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

// Compile a dynamic redirect with path-to-regexp and the same options as the
// docs runtime, so matching (including case-insensitivity) stays aligned with
// production. A pattern path-to-regexp can't parse throws here, which fails
// the check the same way it fails `lint:check-redirects` in clerk/clerk.
function compileDynamicRedirect(redirect) {
  return {
    matchesSource: match(redirect.source, { decode: decodeURIComponent }),
    getDestination: compile(redirect.destination, {
      encode: encodeURIComponent,
    }),
  };
}

// SDK segments the docs runtime strips before matching redirects. Copied from
// `sdks` in clerk/clerk's src/app/docs/SDK.tsx at 72f6537. links.json
// doesn't publish this list, and many SDKs have no scoped pages to infer it
// from.
const SDK_SEGMENTS = new Set([
  "nextjs",
  "react",
  "expo",
  "tanstack-react-start",
  "react-router",
  "expressjs",
  "android",
  "astro",
  "chrome-extension",
  "csharp",
  "electron",
  "fastify",
  "go",
  "ios",
  "java",
  "js-backend",
  "js-frontend",
  "nuxt",
  "php",
  "python",
  "remix",
  "ruby",
  "vue",
  "angular",
  "elysia",
  "flutter",
  "hono",
  "koa",
  "rust",
  "solidjs",
  "svelte",
  "tauri",
]);

function manifestMetadata(manifest) {
  const cached = manifestMetadataCache.get(manifest);
  if (cached) {
    return cached;
  }

  const metadata = {
    dynamicRedirects: (manifest.redirects?.dynamic ?? []).map(
      compileDynamicRedirect,
    ),
  };
  manifestMetadataCache.set(manifest, metadata);
  return metadata;
}

// Clerk's runtime strips a recognized SDK segment before matching redirects,
// then restores it on the destination.
function splitSdk(pathname) {
  const match = pathname.match(/^\/docs\/([^/]+)(\/.+)$/);
  return match && SDK_SEGMENTS.has(match[1])
    ? { normalizedPathname: `/docs${match[2]}`, sdk: match[1] }
    : { normalizedPathname: pathname };
}

function withSdk(destination, sdk) {
  return sdk && destination.startsWith("/docs/")
    ? `/docs/${sdk}${destination.slice("/docs".length)}`
    : destination;
}

// Mirrors the docs runtime's lookup order: dynamic redirects on the
// SDK-normalized path, then static redirects on the normalized path, then
// static redirects on the SDK-scoped path.
function resolveRedirect(pathname, manifest) {
  const metadata = manifestMetadata(manifest);
  const { normalizedPathname, sdk } = splitSdk(pathname);

  for (const redirect of metadata.dynamicRedirects) {
    const result = redirect.matchesSource(normalizedPathname);
    if (result) {
      return withSdk(redirect.getDestination(result.params), sdk);
    }
  }

  const staticRedirects = manifest.redirects?.static ?? {};
  if (Object.hasOwn(staticRedirects, normalizedPathname)) {
    return withSdk(staticRedirects[normalizedPathname], sdk);
  }
  if (Object.hasOwn(staticRedirects, pathname)) {
    return staticRedirects[pathname];
  }

  return undefined;
}

export function validateLink(rawUrl, manifest) {
  const url = new URL(rawUrl);
  const pathname = normalizePathname(url.pathname);

  if (Object.hasOwn(manifest.routes ?? {}, pathname)) {
    let anchor;
    try {
      anchor = decodeURIComponent(url.hash.slice(1));
    } catch {
      return { status: "invalid", reason: "malformed anchor" };
    }

    if (!anchor || manifest.routes[pathname].includes(anchor)) {
      return { status: "valid" };
    }

    return { status: "invalid", reason: `heading #${anchor} does not exist` };
  }

  const destination = resolveRedirect(pathname, manifest);
  if (destination) {
    return { status: "redirect", destination };
  }

  return { status: "invalid", reason: "page does not exist" };
}

// Point the original link at the redirect destination the way production
// does: keep the link's `.md` suffix and query, and prefer the destination's
// fragment over the link's own.
function redirectedUrl(rawUrl, destination) {
  const url = new URL(rawUrl);
  const target = new URL(destination, url);
  if (url.pathname.endsWith(".md")) {
    target.pathname += ".md";
  }
  target.search = url.search;
  target.hash = target.hash || url.hash;
  return target.href;
}

function escapeAnnotation(value) {
  return value
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A");
}

function isRetryableStatus(status) {
  return status === 429 || status >= 500;
}

export async function loadManifest(manifestUrl) {
  let lastError;

  // This action gates a required status check, so a single transient network or
  // CDN hiccup would otherwise block every merge. Retry transient failures with
  // a bounded timeout and backoff, but still fail closed once retries run out.
  for (let attempt = 1; attempt <= MANIFEST_FETCH_RETRIES; attempt += 1) {
    try {
      const response = await fetch(manifestUrl, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(MANIFEST_FETCH_TIMEOUT_MS),
      });

      if (response.ok) {
        // Await here so a truncated body or JSON-decode failure is caught and
        // retried, rather than rejecting outside this loop after one attempt.
        return await response.json();
      }

      lastError = new Error(
        `Unable to fetch ${manifestUrl}: ${response.status} ${response.statusText}`,
      );

      // Client errors other than 429 won't succeed on retry.
      if (!isRetryableStatus(response.status)) {
        break;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < MANIFEST_FETCH_RETRIES) {
      await new Promise((resolve) =>
        setTimeout(resolve, MANIFEST_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)),
      );
    }
  }

  throw lastError;
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
          `::warning ${location}::${escapeAnnotation(`${link.url} resolves through a redirect to ${redirectedUrl(link.url, result.destination)}`)}`,
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
