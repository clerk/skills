---
name: clerk-protect
description: >-
  Operate Clerk Protect, Clerk's fraud and abuse protection, from the command line with the
  `clerk-protect` CLI: sign in, pick an instance, write and reorder custom rules, turn
  protections on and tune them, manage lookup tables, investigate sign-in and sign-up
  decisions (counts, breakdowns, live traffic, plain-language questions), check how often
  rules match, and replay a change against recent traffic before applying it. Use when the
  user mentions Clerk Protect, "clerk-protect", Protect Labs, fraud or bot rules, blocking or
  challenging sign-ups, rate limits on sign-in, "why was this sign-in blocked", "what is
  attacking my instance", or tuning a protection. Not the `clerk` CLI that adds Clerk to an
  app — for that use `clerk-cli`.
license: MIT
---

# Clerk Protect CLI

`clerk-protect` manages Clerk Protect for one Clerk instance at a time: custom rules, protections,
lookup tables, investigations of past and live decisions, and replays. It is a separate binary from
the [`clerk`](https://github.com/clerk/cli) CLI (see the `clerk-cli` skill for that one).

> **Early access.** `clerk-protect` signs in through Protect Labs, which Clerk turns on per instance for
> customers in the Clerk Protect early-access program. Without it there is no way to sign in. If the
> user does not have Labs under **Configure → Protect** in the Clerk Dashboard, tell them to ask their
> Clerk contact. Commands and output can change between releases. The binary is the source of truth:
> run `clerk-protect <command> --help` to check anything this skill says.

## Install

Check first: `clerk-protect --version`. If it is missing or old, install or upgrade it. Installing is a
change to the user's machine, so ask before you do it.

```bash
# macOS (signed, notarized package; the installer asks for an administrator password)
brew tap clerk/protect-cli https://github.com/clerk/protect-cli
brew install --cask clerk/protect-cli/clerk-protect

# Linux
brew tap clerk/protect-cli https://github.com/clerk/protect-cli
brew install --formula clerk/protect-cli/clerk-protect

# Upgrade
brew upgrade clerk/protect-cli/clerk-protect
```

Use the full name `clerk/protect-cli/clerk-protect`. Recent Homebrew refuses a third-party tap's
package otherwise ("Refusing to load … from untrusted tap"). Release archives for Linux and Windows,
and building from source, are on the [protect-cli releases page](https://github.com/clerk/protect-cli/releases)
and in its [README](https://github.com/clerk/protect-cli#install). On macOS, don't use `go install`: the
device key needs a Swift component it can't build.

## Sign in

Signing in needs **a person at a browser on this computer**. You cannot complete it for them.

```bash
clerk-protect login           # opens Protect Labs in the browser and waits
clerk-protect whoami          # who is signed in, to which instance, with which permissions
```

What happens, so you can explain it:

1. `login` opens Protect Labs and prints a key fingerprint. If the user isn't signed in to Labs, they
   open it from the Clerk Dashboard: the application and instance, then **Configure → Protect → Labs →
   Open Labs**. They must do this in the browser `login` opened.
2. They check that the fingerprint on the page matches the terminal, and approve. The terminal
   finishes.
3. The approval comes back on `127.0.0.1`, so the browser must be on the same computer.
   `--no-browser` prints the address to open by hand.

Run `login` on the user's own machine, not in a sandbox. The key lives in the Secure Enclave on a Mac
or the TPM on Windows, and login needs a browser and a local callback. A sandboxed run that reports
"not signed in" is not proof the user is signed out; rerun the command on the host.

Access is whatever the user has in Protect Labs for that instance. It renews while used: any command
that talks to Protect (`whoami` is enough) at least every half hour, for up to eight hours. After that,
`login` again. Exit code `3` always means "sign in again". Ask the user to run `clerk-protect login`;
don't loop retrying.

### Which instance

A command acts on the first of: `--instance ins_…`; the selected profile's instance; the instance
signed in to last. Profiles save typing:

```bash
clerk-protect profile set prod --instance ins_…   # name an instance
clerk-protect profile use prod                    # make it the default
clerk-protect --profile staging rules list        # or CLERK_PROTECT_PROFILE=staging
clerk-protect profile show                        # what commands would act on, and why
```

A profile is not a sign-in. Each instance needs its own `login`. **Always confirm the instance with
the user before you change anything.** `profile show` and `whoami` tell you which one is selected.

## What you can do

| Area | Commands |
|---|---|
| Who and where | `login`, `logout`, `whoami`, `profile …`, `keys status`, `keys list` |
| Custom rules | `rulesets list`, `rules list\|get\|create\|update\|enable\|disable\|delete\|reorder\|validate`, `schema`, `fields` |
| Protections | `protections list\|show\|enable\|bindings\|disable\|reset` |
| Lookup tables | `tables list\|get\|create\|update\|delete`, `tables rows list\|get\|search\|add\|update\|set\|delete` |
| Investigate | `investigate "question"`, `investigate schema`, `insights …`, `trace`, `matches` |
| Test a change | `replay create\|list\|get\|watch\|export\|apply` |
| The web console | `console open` (Protect Labs in the browser, signed in as this computer) |

Every command takes `--json` for machine-readable output. Recipes for common tasks are in
[references/recipes.md](references/recipes.md).

## Rules for agents

- **Read before you change.** List what exists (`rules list`, `protections show NAME`) and show the
  user. Then propose the change.
- **Changes need the user's yes.** Creating, updating, enabling, disabling, deleting or reordering
  rules, changing protections, and starting or applying a replay all change live protection for real
  users. Interactively the CLI asks; non-interactively it refuses unless `--yes` is passed. Pass
  `--yes` only after the user has approved that specific change, never by default.
- **Validate, then measure, then apply.** Check a rule with `rules validate`. Score it against recent
  traffic with `replay create --watch`. Show the user what it would have done, and apply only when they
  agree. A `challenge` rule is gentler than a `block` while you learn.
- **Investigations record a reason as the user's.** `investigate` saves the question, `--purpose`,
  and any `--justification` or `--investigating` with the signed-in person's name. Ask the user for
  the purpose and any ticket reference; don't write them yourself. The CLI also records that an agent
  made the request (from `AI_AGENT`, `CLERK_PROTECT_AGENT` or `CLAUDECODE`, or `--agent NAME`).
- **Use `--json` to read results**, and quote what the CLI printed rather than paraphrasing numbers.
- **Exit codes:**

  | Code | Meaning |
  |---|---|
  | 0 | ok |
  | 1 | failed (including a rule that doesn't validate) |
  | 2 | a mistake in the command (fix the flags) |
  | 3 | sign in again (ask the user) |
  | 4 | an investigation was declined |
  | 5 | an investigation needs more information |

## Investigating decisions

Prefer, in this order:

1. **`investigate`** for a question in plain language, when your version has it (`clerk-protect
   investigate --help`). It is not available on every instance yet; when it isn't, the command says
   so. Fall back to `insights` then.
   ```bash
   clerk-protect investigate schema
   clerk-protect investigate --no-interactive --format json \
     --purpose "<the user's reason>" \
     --shape "one row per country with blocked count, top 10" \
     "Which countries had the most blocked sign-ups in the last 24 hours?"
   ```
   Rows come on stdout, and the query and summary on stderr. On exit `5`, show the user the questions
   and resend the same question with `--prior-request <id>` and one `--context "Q: … A: …"` per answer.
2. **`insights`** for counts and breakdowns you can express as filters: `insights facets`,
   `insights timeseries --group-by D`, `insights search`, and `insights entity --dimension ip
   --value 1.2.3.4`. `insights dimensions` lists what you can filter on.
3. **`trace`** to watch decisions live. Pass `--json` or `--no-tui` when you are reading the output.
4. **`matches`** for how often each protection or rule matched over time.

More in [references/recipes.md](references/recipes.md#investigate).
