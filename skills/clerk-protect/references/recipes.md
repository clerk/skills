# Clerk Protect CLI recipes

Common tasks with `clerk-protect`. Every command takes `--json`. Every change asks for confirmation:
interactively it prompts; otherwise it needs `--yes`, and you pass that only after the user approves the
specific change. Run `clerk-protect <command> --help` for every flag.

## Before anything

```bash
clerk-protect --version
clerk-protect whoami                 # signed in? which instance? what may I do?
clerk-protect profile show           # which instance commands act on, and why
```

Exit `3` means sign in again: ask the user to run `clerk-protect login`. It needs them at a browser.

## Custom rules

Rules are boolean expressions over the fields of a sign-in, sign-up or other event, with an action
(`block` or `challenge`). They live in rulesets and run in order.

```bash
clerk-protect rulesets list                          # the rulesets you can write into
clerk-protect schema                                 # every field a rule can use
clerk-protect schema SIGN_UP                         # the fields for one event type
clerk-protect rules list --ruleset SIGN_UP           # current rules, in evaluation order

# Check an expression before using it (exit 1 when it is not valid)
clerk-protect rules validate --ruleset SIGN_UP 'email.domain == "mailinator.com"'

# Create — asks first. Prefer challenge while you learn what a rule catches.
clerk-protect rules create --ruleset SIGN_UP \
  --expression 'email.domain == "mailinator.com"' \
  --action challenge --description "Disposable email domain"

clerk-protect rules disable RULE_ID --ruleset SIGN_UP   # off, kept
clerk-protect rules enable  RULE_ID --ruleset SIGN_UP
clerk-protect rules update  RULE_ID --ruleset SIGN_UP --action block
clerk-protect rules reorder --ruleset SIGN_UP --move RULE_ID --top --dry-run   # preview, then without --dry-run
clerk-protect rules delete  RULE_ID --ruleset SIGN_UP
```

Field names differ between versions and instances. Take them from `schema`, never from memory.
`rules create` also takes `--rate-limit-*`, `--challenge-*`, `--expires-in`/`--expires-at`, or
`--file rule.json`.

## Protections

Protections are ready-made defences you turn on and tune with settings ("bindings").

```bash
clerk-protect protections list
clerk-protect protections show NAME                     # its settings and what they mean
clerk-protect protections enable NAME                    # keeps existing settings
clerk-protect protections bindings NAME --bind threshold=10
clerk-protect protections disable NAME                   # off, settings kept
clerk-protect protections reset NAME                     # off, settings discarded
```

## Lookup tables

Tables hold lists that rules read with `in_table`, such as allowed IP ranges or known-bad domains.

```bash
clerk-protect tables list
clerk-protect tables create trusted_ips --column ip:IP:matchable:required --column note:STRING
clerk-protect tables rows add trusted_ips --value note="office" --matcher ip=CIDR:203.0.113.0/24
clerk-protect tables rows search trusted_ips --match ip=203.0.113.7   # which rows a rule would match
```

Deleting a table makes every rule that reads it match nothing. Check `rules list` first.

## Investigate

### In plain language

```bash
clerk-protect investigate schema                  # tables and columns you can ask about
clerk-protect investigate --no-interactive --format json \
  --purpose "<the user's words: why they want to know>" \
  --shape "one row per ASN with blocked count and distinct IPs, top 20" \
  "Which networks produced the most blocked sign-ins in the last 24 hours?"
```

- Rows go to stdout (`--format table|csv|json`). The query, the checks and a short summary go to
  stderr. `--json` prints every event of the stream as a JSON line instead.
- Exit `5`: Protect needs more information. Show the user the questions, then resend the same question
  with `--prior-request <id>` and `--context "Q: <question> A: <their answer>"` for each answer.
- Exit `4`: declined. The reason is on stderr; usually the question isn't about this instance's
  decisions.
- If it says it isn't available for this instance yet, use `insights` below.
- What you pass in `--purpose`, `--justification` and `--investigating` is recorded as the user's
  reason. Ask them for it.

### With filters

```bash
clerk-protect insights dimensions                                   # what you can filter and group on
clerk-protect insights facets --since 24h --filter decision=DENY     # top values of each dimension
clerk-protect insights timeseries --since 7d --group-by decision      # decisions over time
clerk-protect insights search --since 1h --filter ip=203.0.113.7    # the decisions themselves, newest first
clerk-protect insights entity --dimension ip --value 203.0.113.7    # everything about one value
clerk-protect insights flow --decision-id ID --at 2026-10-27T12:00:00Z   # every decision in one flow
```

Dimension names and values come from `insights dimensions`. Windows default to the last 24 hours.

### Live

```bash
clerk-protect trace --no-tui --filter decision=DENY         # one line per decision as it happens
clerk-protect trace --json                                 # one JSON object per decision
```

In a terminal, `trace` opens an interactive view (`?` for the keys). Pass `--no-tui` or `--json` when you
are reading its output.

### How often things match

```bash
clerk-protect matches --since 7d                           # each protection, as sparklines
clerk-protect matches --rule-id RULE_ID --since 24h
```

## Test a change before applying it

A replay scores a candidate change against traffic the instance already had, then applies exactly
that change if the user wants it.

```bash
clerk-protect replay list
clerk-protect replay create --file change.json --since 24h --watch   # asks first: it reads recent traffic
clerk-protect replay get REPLAY_ID --json                            # results, and the request it scored
clerk-protect replay apply REPLAY_ID                                 # asks first: changes live rules
```

The change file is the request the Protect Labs replay page sends. The simplest way to write one is to
build it there (`clerk-protect console open --path /replay`), or to start from an earlier replay's
`request` in `replay get … --json`.

## Open the web console

```bash
clerk-protect console open                  # Protect Labs, signed in as this computer's sign-in
clerk-protect console open --path /rules
```

## Scripts

- `--json` on every command. `--yes` to confirm a change non-interactively, only with the user's approval.
- `CLERK_PROTECT_PROFILE` selects a profile. `CLERK_PROTECT_CONFIG_DIR` moves everything the CLI stores.
- Signing in always needs a person at a browser, so it does not suit unattended CI longer than one
  sign-in (up to eight hours, renewed by use at least every half hour).
