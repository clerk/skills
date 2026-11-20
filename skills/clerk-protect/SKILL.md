---
name: clerk-protect
description: >-
  Operate Clerk Protect, Clerk's fraud and abuse protection, with the `clerk-protect` CLI: sign in, pick an instance, write and reorder custom rules, turn protections on and tune them, manage lookup tables, investigate sign-in and sign-up decisions (counts, breakdowns, live traffic, plain-language questions), check how often rules match, and replay a change against recent traffic before applying it. Use when the user mentions Clerk Protect, "clerk-protect", Protect Labs, fraud or bot rules, blocking or challenging sign-ups, rate limits on sign-in, "why was this sign-in blocked", "what is attacking my instance", or tuning a protection. Not the `clerk` CLI that adds Clerk to an app — for that use `clerk-cli`.
license: MIT
metadata:
  author: clerk
  version: 1.0.0
---

# Clerk Protect CLI

`clerk-protect` manages Clerk Protect, Clerk's fraud and abuse protection, for one Clerk instance at a time: custom rules, protections, lookup tables, investigations of past and live decisions, and replays. It's a separate binary from the [`clerk` CLI](https://github.com/clerk/cli) (see the `clerk-cli` skill for that one).

> **Early access.** `clerk-protect` signs in through Protect Labs, which Clerk turns on per instance for customers in the Clerk Protect early-access program. If the user doesn't have Labs under **Configure → Protect** in the Clerk Dashboard, tell them to ask their Clerk contact. Commands and output can change between releases. The binary is the source of truth: run `clerk-protect <command> --help` to check anything this skill says.

## Install

Check first: `clerk-protect --version`. If it's missing or old, install or upgrade it. Installing is a change to the user's computer, so ask before you do it.

```bash
# macOS (signed, notarized package)
brew tap clerk/protect-cli https://github.com/clerk/protect-cli
brew install --cask clerk/protect-cli/clerk-protect

# Linux
brew tap clerk/protect-cli https://github.com/clerk/protect-cli
brew install --formula clerk/protect-cli/clerk-protect

# Upgrade
brew upgrade clerk/protect-cli/clerk-protect
```

On macOS the package installer asks for an administrator password, so the user runs the install command, not you.

Use the full name `clerk/protect-cli/clerk-protect`. Recent Homebrew refuses a third-party tap's package otherwise ("Refusing to load … from untrusted tap"). Release archives for Linux and Windows, and building from source, are on the [protect-cli releases page](https://github.com/clerk/protect-cli/releases) and in its [README](https://github.com/clerk/protect-cli#install). On macOS, don't use `go install`: the device key needs a Swift component it can't build.

### Linux: choose where the key lives

On Linux the CLI refuses to create a key unless `CLERK_PROTECT_KEY_BACKEND=file` is set. Every command reads it, not only `login`, so it belongs in the user's shell profile:

```bash
export CLERK_PROTECT_KEY_BACKEND=file
```

That key is a file anyone who can read it can use as the user's access, unlike the Secure Enclave on a Mac or the Trusted Platform Module (TPM) on Windows. Tell the user that before they set it, and link [Where your key lives](https://github.com/clerk/protect-cli#where-your-key-lives).

## Sign in

Signing in needs **a person at a browser on the user's computer**. You can't complete it for them.

```bash
clerk-protect login           # opens Protect Labs in the browser and waits
clerk-protect whoami          # who is signed in, to which instance, with which permissions
```

`login` takes three steps:

1. `login` opens Protect Labs and prints a key fingerprint. If the user isn't signed in to Labs, they open it from the Clerk Dashboard: the application and instance, then **Configure → Protect → Labs → Open Labs**. They must do this in the browser `login` opened.
2. They check that the fingerprint on the page matches the terminal, and approve. `login` finishes.
3. The approval comes back on `127.0.0.1`. `--no-browser` prints the address to open by hand.

Run `login` on the user's computer, not in a sandbox: it needs the device key, a browser, and a local callback. A sandboxed run that reports "not signed in" isn't proof the user is signed out; rerun the command on the user's computer.

Access is whatever the user has in Protect Labs for that instance. A sign-in lasts for the time left in that Labs session, up to eight hours; `whoami` shows the token expiry and the authorization deadline. After that, `login` again. On exit `3`, ask the user to run `clerk-protect login`; don't loop retrying.

If the user wants you only to read, have them sign in with a read-only Labs role. `whoami` lists the permissions you have. `investigate` and replays need the permission that lets someone run replays in Labs, so a read-only sign-in can't use them.

### Which instance

A command acts on the first of: `--instance ins_…`; the selected profile's instance; the instance signed in to last. Profiles save typing:

```bash
clerk-protect profile set prod --instance ins_…   # name an instance
clerk-protect profile use prod                    # make it the default
clerk-protect --profile staging rules list        # or CLERK_PROTECT_PROFILE=staging
clerk-protect profile show                        # what commands would act on, and why
```

A profile isn't a sign-in. Each instance needs its own `login`. **Always confirm the instance with the user before you change anything.**

## What you can do

| Area | Commands |
| --- | --- |
| Who and where | `login`, `logout`, `whoami`, `profile …`, `keys status`, `keys list` |
| Custom rules | `rulesets list`, `rules list\|get\|create\|update\|enable\|disable\|delete\|reorder\|validate`, `schema`, `fields` |
| Protections | `protections list\|show\|enable\|bindings\|disable\|reset` |
| Lookup tables | `tables list\|get\|create\|update\|delete`, `tables rows list\|get\|search\|add\|update\|set\|delete` |
| Investigate | `insights …` (including `insights trace-id`), `investigate "question"`, `trace`, `matches` |
| Test a change | `replay create\|list\|get\|watch\|export\|apply` |
| Protect Labs | `console open` (Protect Labs in the browser, already signed in) |

Every command takes `--json` for machine-readable output. Recipes for common tasks are in [the recipes reference](references/recipes.md). How to read what comes back, and the rule mistakes that fail silently, are in [the reading-results reference](references/reading-results.md). Read it before you report numbers or propose a rule.

## Rules for agents

- **Read before you change.** List what exists (`rules list`, `protections show NAME`) and show the user. Then propose the change.
- **Changes need the user's yes.** Creating, updating, enabling, disabling, deleting, or reordering rules, changing protections, and applying a replay change live protection for real users. Starting a replay changes nothing live, but it reads the instance's recent traffic, so it asks too. Interactively the CLI asks; non-interactively it refuses unless you pass `--yes`. Pass `--yes` only after the user has approved that specific change, never by default.
- **Validate, then replay, then apply.** Check a rule with `rules validate`. Score it against recent traffic with a replay, read the report, and show the user what it would have done. Apply only when they agree. Start with `challenge`, not `block`, while you learn what a rule catches.
- **`investigate` records its reason as the user's.** It saves the question, `--purpose`, and any `--justification` or `--investigating` with the signed-in person's name. Ask the user for the purpose and any ticket reference; don't write them yourself. The CLI also records that an agent made the request (from `AI_AGENT`, `CLERK_PROTECT_AGENT`, or `CLAUDECODE`, or `--agent NAME`).
- **Report facts, inferences, and unknowns separately.** Quote what the CLI printed, with the unit (decisions or flows) and the window. Label what you infer from it, and say what the data can't tell you. A passed challenge doesn't prove a real person, and a risk signal doesn't prove fraud.
- **Relay plan refusals.** "requires a plan that includes Protect" means the instance's plan lacks that protection: tell the user, don't retry. "the plan check … is unavailable; try again later" is temporary: retry once, then tell the user.

## Exit codes

| Code | Meaning                                         |
| ---- | ----------------------------------------------- |
| 0    | ok                                              |
| 1    | failed (including a rule that doesn't validate) |
| 2    | a mistake in the command (fix the flags)        |
| 3    | sign in again (ask the user)                    |
| 4    | an investigation was declined                   |
| 5    | an investigation needs more information         |

## Investigate decisions

Protect keeps decisions for 14 days. For a longer window, the answer is that the data isn't kept, not zero. Say which window you used.

Pick the tool by the question:

1. **"Why was this person blocked?"** If they have the reference from the blocked screen (such as `7Q8ikxgt`), `insights trace-id REFERENCE` (v0.5.0 or later) returns the decision and the rule. Otherwise use `insights search` with `--filter identifier=…` or `--filter source_ip=…`. When nothing comes back, the block may not have been Protect's; see [Not every block is Protect's](references/reading-results.md#not-every-block-is-protects).
2. **Counts and breakdowns** you can express as filters: `insights facets`, `insights timeseries --group-by D`, `insights search`, and `insights entity --dimension source_ip --value 1.2.3.4`. `insights dimensions` lists what you can filter on. Use `--unit flows` when the question is about sign-up or sign-in attempts; the default counts decisions, and one attempt makes several. Flows are attempts, not accounts. Insights windows take hours (`--since 168h`), not days.
3. **`investigate`** for an open question in plain language that filters can't express. It needs `clerk-protect` v0.4.0 or later and isn't on every instance. When it isn't, the command says so; use `insights`.
   ```bash
   clerk-protect investigate --no-interactive --format json \
     --purpose "<the user's reason>" \
     --shape "one row per country with blocked count, top 10" \
     "Which countries had the most blocked sign-ups in the last 24 hours?"
   ```
   Rows come on stdout, and the query and summary on stderr. On exit `5`, show the user the questions and resend the same question with `--prior-request <id>` and one `--context "Q: … A: …"` per answer.
4. **`trace`** to watch decisions live. Pass `--json` or `--no-tui` when you're reading the output.
5. **`matches`** for how often each protection or rule matched over time.

More in [the recipes reference](references/recipes.md#investigate).

## References

- [references/recipes.md](references/recipes.md) - commands for rules, protections, lookup tables, investigations, and replays.
- [references/reading-results.md](references/reading-results.md) - how to read counts and replay reports, and the rule mistakes that fail silently.
- [Protect overview](https://clerk.com/docs/guides/protect/overview) and [Protections](https://clerk.com/docs/guides/protect/protections/overview) in the Clerk docs - what each protection does, which steps it applies to, and which plan includes it.
