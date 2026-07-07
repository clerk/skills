---
name: audit-expo-skill
description: Audits the bundled `clerk-expo` skill against the @clerk/expo SDK source and clerk-docs, then proposes or applies updates. Use when the user says "audit the expo skill", "update the clerk-expo skill", "check clerk-expo against the SDK", "resync clerk-expo skill", "run audit-expo-skill", or after @clerk/expo ships a minor or major release.
license: MIT
effort: high
user-invocable: true
disable-model-invocation: true
argument-hint: "[--sdk <path>] [--docs <path>] [--apply]"
metadata:
  internal: true
---

# Clerk Expo Skill Audit

Cross-check `skills/mobile/clerk-expo/` in this repository against the actual `@clerk/expo` SDK source and the clerk-docs content it cites. The SDK source is the source of truth for API shape; clerk-docs is the source of truth for recommended patterns; the skill must track both. **When the two conflict on a factual claim (an API exists, a signature, a default, a version floor), SDK source wins — always.** Docs win only on prescriptive questions source cannot answer (which flow to recommend, prop placement in examples, dashboard prerequisites).

The skill intentionally hardcodes verified code snippets (see its freshness gate). This audit is the maintenance half of that contract: it runs after SDK releases so the snippets stay verified rather than becoming folklore.

## Inputs

- **SDK source of truth**: a `clerk/javascript` checkout containing `packages/expo/` (and `packages/shared/src/types/` for the sign-in/sign-up resource types).
- **Docs source of truth**: a `clerk/clerk-docs` checkout containing `docs/getting-started/quickstart.expo.mdx`, `docs/guides/development/custom-flows/authentication/*.mdx`, and `docs/reference/expo/**`.
- **Target skill**: `skills/mobile/clerk-expo/SKILL.md`, `references/*.md`, and `evals/evals.json`.
- Optional corroboration: a `clerk/clerk-expo-quickstart` checkout (three example apps exercising the current API).

## Source Checkout Resolution

Resolve each checkout in this order:

1. Use `--sdk <path>` / `--docs <path>` when supplied. The SDK path must contain `packages/expo/package.json`; the docs path must contain `docs/getting-started/quickstart.expo.mdx`.
2. Look for sibling checkouts of this repository: `../javascript` and `../clerk-docs` (the standard Clerk projects layout), and `../clerk-expo-quickstart` for corroboration.
3. If `CLERK_JAVASCRIPT_REPO` / `CLERK_DOCS_REPO` are set, use those paths.
4. If a checkout is missing and network access is acceptable, shallow-clone into `.context/`:

```sh
mkdir -p .context && cd .context
git clone --depth 1 https://github.com/clerk/javascript.git
git clone --depth 1 https://github.com/clerk/clerk-docs.git
```

If neither is available, stop and ask the user for paths. Do not audit from memory or from an installed `node_modules` copy alone; the audit exists precisely because memory drifts.

## Workflow

### 1. Establish the version delta

- Read the skill's stamped version from `SKILL.md` frontmatter (`compatibility:`) and its freshness-gate text.
- Read the current version from `packages/expo/package.json` plus `peerDependencies` (Expo SDK range, React Native floor, React range) and bundled native SDK versions (`clerk-ios`, `clerk-android` in dependencies).
- Read `packages/expo/CHANGELOG.md` entries between the stamped version and current. This is the primary work queue: every changelog entry either affects the skill or is explicitly irrelevant.

If the stamped version equals the current version and the changelog shows nothing new, report "no drift" and stop.

### 2. Inventory the SDK surface

Build a structured inventory from source (prefer `src/` over `dist/`):

- **Exports map**: `packages/expo/package.json` `exports` — every subpath (`/native`, `/web`, `/token-cache`, `/resource-cache`, `/secure-store`, `/local-credentials`, `/passkeys`, `/google`, `/apple`, `/legacy`, `/experimental`, …), noting additions and removals.
- **Hooks**: everything re-exported from `src/hooks/index.ts` and the Expo-specific hooks (`useSSO`, `useAuth` extensions, `useSignInWithGoogle`, `useSignInWithApple`, `useLocalCredentials`). Capture signatures, return shapes, and `@deprecated` tags.
- **Custom-flow resources**: the `SignInFutureResource` / `SignUpFutureResource` method surface in `packages/shared/src/types/signInFuture.ts` and `signUpFuture.ts` (method names, param shapes, status enums). The skill's custom-flows reference mirrors this surface.
- **Native components**: `src/native/index.ts` exports and each component's props types (`AuthView.types.ts`, `UserProfileView`, `UserButton`). Flag any prop the skill names that no longer exists, and any new public prop.
- **Config plugin**: `src/plugin/withClerkExpo.ts` — required env vars, theme option schema, platform side effects (deployment targets, URL schemes).
- **Provider**: `src/provider/ClerkProvider.tsx` props, especially experimental ones (`__experimental_passkeys`, `__experimental_resourceCache`) and any newly stabilized names.
- **Dev warnings / migration signals**: grep for `@deprecated`, `console.warn`, and package-migration notices (e.g. the `@clerk/expo-google-signin` split). These become "coming changes" notes in the skill.

### 3. Inventory the docs claims

For every canonical docs URL cited in the skill's references:

- Confirm the corresponding `.mdx` file still exists in clerk-docs at that route (URL path → `docs/` path). Broken citations are `drift`.
- Re-read the Expo tab/section of each cited custom-flow guide and the Expo quickstart. Where the docs' recommended pattern changed (new required step, changed prop placement, new dashboard prerequisite), the skill's matching snippet is `drift` even if it still compiles.

### 4. Extract the skill's claims

Read `SKILL.md`, every `references/*.md`, and `evals/evals.json`. Extract each concrete claim:

- Version stamps and peer ranges.
- Every code snippet (imports, method calls, props, env var names).
- Every gate and pitfall that names an API (`useSSO` vs `useOAuth`, `resourceCache` vs `secureStore`, captcha mount point, `treatPendingAsSignedOut` placement).
- The capability matrix (Expo Go / dev build / web).
- Eval expectations that assert API strings.

### 5. Diff and bucket

Produce a structured diff with four buckets:

1. **Missing from skill**: new exports, hooks, props, flows, or prerequisites in SDK/docs that the skill should cover (or explicitly scope out).
2. **Stale in skill**: claims contradicted by source or docs — renamed/removed APIs, changed defaults, changed peer floors, moved props, dead docs URLs, evals asserting outdated strings.
3. **Thin in skill**: covered but under-specified relative to real footgun surface (e.g. a new error code developers will hit).
4. **Over-specified**: detail the docs or installed `.d.ts` cover better; propose shrinkage where it reduces drift risk.

Cite source file and line for every bucket-1/2/3 entry, plus the target skill location.

### 6. Propose edits

Emit a review-ready proposal grouped by target file. For each change include severity (`drift`, `gap`, or `polish`), the source citation, the target location, and a unified diff or concise before/after. Always include, when any change is applied:

- The `compatibility:` stamp and freshness-gate version in `SKILL.md` updated to the audited SDK version.
- Eval updates when expectations reference changed APIs.

Do not rewrite accurate neighboring sections. Skill shrinkage is a valid proposal.

### 7. Apply or hand back

Default: present the proposal and stop for review.

With `--apply`: apply `drift` and `gap` edits, update the version stamps, list `polish` for review, then validate — JSON files parse, every relative reference path in `SKILL.md` resolves, and every canonical docs URL maps to an existing clerk-docs file.

## Guardrails

- Never invent API surface. On factual conflicts between docs and SDK source, side with source and write the skill accordingly; list the discrepancy under "Open questions" as a probable clerk-docs bug worth reporting upstream. Only genuinely prescriptive ambiguity (source supports both patterns, docs unclear on which to recommend) goes to human review.
- Snippets must stay minimal (API shape and control flow, not styled screens) and keep their canonical docs URL citation.
- Preserve the skill's execution-gate structure and voice; edits slot into existing sections.
- The legacy-API prohibition (Gate: method-based flows, never `prepareFirstFactor`/`setActive` for new code) may only be relaxed if the SDK itself re-legitimizes the legacy surface — treat any such change as a major finding, not a routine edit.
- Do not audit against an installed `node_modules` copy as authority; it reflects whatever the last install pulled, not the release being audited.
- Do not commit; leave staging and committing to the maintainer unless explicitly asked.

## Output Shape

```markdown
# clerk-expo skill audit - <YYYY-MM-DD>

## Summary
<stamped vs current version, changelog entries reviewed, counts per bucket, largest drift>

## skills/mobile/clerk-expo/SKILL.md
### <section>
- [drift|gap|polish] <one-line description>
  - source: packages/expo/src/<...>:<line> (or docs/<...>.mdx:<line>)
  - target: skills/mobile/clerk-expo/SKILL.md:<line>
  - change: <diff or concise before/after>

## skills/mobile/clerk-expo/references/<file>.md
...

## skills/mobile/clerk-expo/evals/evals.json
...

## Open questions
...
```

Keep the result skimmable so a maintainer can approve, reject, or apply each entry independently.
