import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const BLOCKED_UPSTREAM_LABEL = "blocked: upstream";

export function pullRequestLabelNames(event) {
  const labels = event?.pull_request?.labels;
  if (!Array.isArray(labels)) {
    throw new Error("GitHub event payload does not contain pull_request.labels");
  }

  return labels
    .map((label) => (typeof label === "string" ? label : label?.name))
    .filter((name) => typeof name === "string");
}

export function isBlockedUpstream(event) {
  return pullRequestLabelNames(event).includes(BLOCKED_UPSTREAM_LABEL);
}

async function run() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    throw new Error("GITHUB_EVENT_PATH is not set");
  }

  const event = JSON.parse(await readFile(eventPath, "utf8"));
  if (isBlockedUpstream(event)) {
    console.error(
      `::error title=Blocked by upstream::This pull request has the '${BLOCKED_UPSTREAM_LABEL}' label. Remove it only after the linked upstream change has shipped.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Pull request does not have the '${BLOCKED_UPSTREAM_LABEL}' label.`);
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  run().catch((error) => {
    console.error(
      `::error title=Unable to check upstream status::${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
}
