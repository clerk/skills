import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BLOCKED_UPSTREAM_LABEL,
  isBlockedUpstream,
  pullRequestLabelNames,
} from "./check-blocked-upstream.mjs";

describe("blocked upstream label", () => {
  it("blocks only the exact blocked-upstream label", () => {
    assert.equal(
      isBlockedUpstream({
        pull_request: {
          labels: [{ name: "documentation" }, { name: BLOCKED_UPSTREAM_LABEL }],
        },
      }),
      true,
    );
    assert.equal(
      isBlockedUpstream({
        pull_request: {
          labels: [{ name: "blocked" }, { name: "blocked: dependency" }],
        },
      }),
      false,
    );
  });

  it("passes when the pull request has no labels", () => {
    assert.equal(isBlockedUpstream({ pull_request: { labels: [] } }), false);
  });

  it("accepts label names and GitHub label objects", () => {
    assert.deepEqual(
      pullRequestLabelNames({
        pull_request: {
          labels: ["documentation", { name: BLOCKED_UPSTREAM_LABEL }, {}],
        },
      }),
      ["documentation", BLOCKED_UPSTREAM_LABEL],
    );
  });

  it("fails closed when the event is not a pull request payload", () => {
    assert.throws(
      () => isBlockedUpstream({}),
      /GitHub event payload does not contain pull_request\.labels/,
    );
  });
});
