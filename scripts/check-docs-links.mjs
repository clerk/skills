import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

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

// Matches a `:name` parameter or `*name` wildcard, plus the legacy
// `:name(pattern)` constraint and `*`, `+`, or `?` modifiers. An optional
// leading slash is captured so an omitted legacy parameter can drop it.
const PATH_PARAMETER = /(\/?)([:*])([A-Za-z0-9_]+)(?:\(([^)]+)\))?([*+?])?/;

// Compile a redirect source into a matcher. Handles both the path-to-regexp v8
// syntax that links.json publishes (`/docs/hooks{/*path}`, `{/:name}`) and the
// legacy `:param`, `:param*`, `:param+`, `:param?` forms.
function compileDynamicRedirect(source) {
  const names = [];
  let index = 0;

  function compile(closing) {
    let expression = "";

    while (index < source.length) {
      if (source[index] === closing) {
        index += 1;
        return expression;
      }

      if (source[index] === "{") {
        index += 1;
        expression += `(?:${compile("}")})?`;
        continue;
      }

      const parameter = source.slice(index).match(PATH_PARAMETER);
      if (parameter?.index !== 0) {
        expression += escapeRegExp(source[index]);
        index += 1;
        continue;
      }

      const [match, slash, kind, name, constraint, modifier] = parameter;
      const valuePattern = constraint
        ? `(?:${constraint})`
        : kind === "*"
          ? ".+"
          : "[^/]+";
      const repeatedPattern = `${valuePattern}(?:/${valuePattern})*`;
      const prefix = escapeRegExp(slash);
      names.push(name);

      if (modifier === "*") {
        expression += `(?:${prefix}(${repeatedPattern}))?`;
      } else if (modifier === "+") {
        expression += `${prefix}(${repeatedPattern})`;
      } else if (modifier === "?") {
        expression += `(?:${prefix}(${valuePattern}))?`;
      } else {
        expression += `${prefix}(${valuePattern})`;
      }

      index += match.length;
    }

    return expression;
  }

  const regex = new RegExp(`^${compile()}$`);

  return (pathname) => {
    const match = pathname.match(regex);
    return match
      ? Object.fromEntries(names.map((name, i) => [name, match[i + 1]]))
      : undefined;
  };
}

// Fill a redirect destination with matched parameters. An optional `{...}`
// group is kept only when every parameter inside it matched.
function applyRedirectParameters(destination, parameters) {
  const parameterPattern = new RegExp(PATH_PARAMETER.source, "g");

  return destination
    .replace(/\{([^{}]*)\}/g, (group, contents) =>
      [...contents.matchAll(parameterPattern)].every(
        ([, , , name]) => parameters[name] !== undefined,
      )
        ? contents
        : "",
    )
    .replace(parameterPattern, (match, slash, kind, name) =>
      parameters[name] === undefined ? "" : `${slash}${parameters[name]}`,
    );
}

function inferredSdkSegments(routes = {}) {
  const routePaths = new Set(Object.keys(routes));
  const sdkSegments = new Set();

  for (const routePath of routePaths) {
    const match = routePath.match(/^\/docs\/([^/]+)(\/.+)$/);
    if (match && routePaths.has(`/docs${match[2]}`)) {
      sdkSegments.add(match[1]);
    }
  }

  return sdkSegments;
}

function manifestMetadata(manifest) {
  const cached = manifestMetadataCache.get(manifest);
  if (cached) {
    return cached;
  }

  const metadata = {
    sdkSegments: inferredSdkSegments(manifest.routes),
    dynamicRedirects: (manifest.redirects?.dynamic ?? []).map((redirect) => ({
      match: compileDynamicRedirect(redirect.source),
      destination: redirect.destination,
    })),
  };
  manifestMetadataCache.set(manifest, metadata);
  return metadata;
}

function redirectPathCandidates(pathname, sdkSegments) {
  const candidates = [{ pathname }];
  const match = pathname.match(/^\/docs\/([^/]+)(\/.+)$/);

  // Clerk's runtime strips recognized SDK segments before matching the compact
  // redirect map, then restores the SDK on the destination. Infer those SDKs
  // from the manifest's paired scoped and unscoped routes so this action does
  // not need its own hard-coded SDK registry.
  if (match && sdkSegments.has(match[1])) {
    candidates.push({ pathname: `/docs${match[2]}`, sdk: match[1] });
  }

  return candidates;
}

function withSdk(destination, sdk) {
  return sdk && destination.startsWith("/docs/")
    ? `/docs/${sdk}${destination.slice("/docs".length)}`
    : destination;
}

function resolveRedirect(pathname, manifest) {
  const metadata = manifestMetadata(manifest);

  for (const candidate of redirectPathCandidates(
    pathname,
    metadata.sdkSegments,
  )) {
    const staticDestination = manifest.redirects?.static?.[candidate.pathname];
    if (staticDestination) {
      return withSdk(staticDestination, candidate.sdk);
    }

    for (const redirect of metadata.dynamicRedirects) {
      const parameters = redirect.match(candidate.pathname);
      if (parameters) {
        return withSdk(
          applyRedirectParameters(redirect.destination, parameters),
          candidate.sdk,
        );
      }
    }
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

// Point the original link at the redirect destination, keeping its `.md`
// suffix, query, and fragment the way production does.
function redirectedUrl(rawUrl, destination) {
  const url = new URL(rawUrl);
  url.pathname = url.pathname.endsWith(".md")
    ? `${destination}.md`
    : destination;
  return url.href;
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
