# Clerk Protect CLI recipes

Common tasks with `clerk-protect`. Every command takes `--json`. Every change asks for confirmation: interactively it prompts; otherwise it needs `--yes`, and you pass that only after the user approves the specific change. Run `clerk-protect <command> --help` for every flag.

## Before anything

```bash
clerk-protect --version
clerk-protect whoami                 # signed in? which instance? what may I do?
clerk-protect profile show           # which instance commands act on, and why
```

Exit `3` means sign in again: ask the user to run `clerk-protect login`. It needs them at a browser.

## Custom rules

Rules are boolean expressions over the fields of a sign-in, sign-up or other event, with an action (`block` or `challenge`). They live in rulesets. The `ALL` ruleset runs first, then the request's own. Within a ruleset every `block` rule runs before every `challenge` rule; among rules with the same action, position decides. See [Rule order](reading-results.md#rule-order).

```bash
clerk-protect rulesets list                          # the rulesets you can write into
clerk-protect schema                                 # every field a rule can use
clerk-protect schema SIGN_UP                         # the fields for one event type
clerk-protect rules list --ruleset SIGN_UP           # current rules

# Check an expression before using it (exit 1 when it is not valid)
clerk-protect rules validate --ruleset SIGN_UP 'email.domain.apex == "mailinator.com"'

# Create — asks first. Prefer challenge while you learn what a rule catches.
clerk-protect rules create --ruleset SIGN_UP \
  --expression 'email.domain.apex == "mailinator.com"' \
  --action challenge --description "Disposable email domain"

clerk-protect rules disable RULE_ID --ruleset SIGN_UP   # off, kept
clerk-protect rules enable  RULE_ID --ruleset SIGN_UP
clerk-protect rules update  RULE_ID --ruleset SIGN_UP --action block   # changes only what the flags name
clerk-protect rules reorder --ruleset SIGN_UP --move RULE_ID --top --dry-run   # preview, then without --dry-run (only changes order among rules with the same action)
clerk-protect rules delete  RULE_ID --ruleset SIGN_UP
```

Field names differ between versions and instances. Take them from `schema`, never from memory. `rules create` also takes `--rate-limit-*`, `--challenge-*`, `--expires-in`/`--expires-at`, or `--file rule.json`. For a rate limit on sign-ups, set `--rate-limit-identity-key signup.signup_id` so each sign-up counts once. Read [Expressions](reading-results.md#expressions) before writing one.

Two things `rules update` with flags does that are easy to miss:

- The `--rate-limit-*` flags are one setting, and so are the `--challenge-*` flags. Giving any of them replaces the whole rate limit or challenge setting, so repeat every part you want to keep, such as `--rate-limit-identity-key`.
- In v0.5.0 and earlier, a flag update clears a stored `priority`. Before updating a rule, check `rules get RULE_ID --ruleset R --json`; if it has a priority, update it with `--file`: start from that JSON, change what you need, and keep `priority`. The file is the whole rule, so anything it leaves out is cleared.

## Protections

Protections are ready-made defences you turn on and tune with settings ("bindings").

```bash
clerk-protect protections list
clerk-protect protections show NAME                     # its settings and what they mean
clerk-protect protections enable NAME                    # keeps existing settings
clerk-protect protections bindings signup_rate_limit_per_ip --bind limit=20
clerk-protect protections disable NAME                   # off, settings kept
clerk-protect protections reset NAME                     # off, settings discarded
```

Take setting names from `protections show NAME`. Some protections need a plan that includes Protect; an instance without it gets "requires a plan that includes Protect". Relay that to the user.

## Lookup tables

Tables hold lists that rules read with `in_table`, such as allowed IP ranges or known-bad domains.

```bash
clerk-protect tables list
clerk-protect tables create trusted_ips --column ip:IP:matchable:required --column note:STRING
clerk-protect tables rows add trusted_ips --value note="office" --matcher ip=CIDR:203.0.113.0/24
clerk-protect tables rows search trusted_ips --match ip=203.0.113.7   # which rows a rule would match
```

Create a column that rules look up as `matchable`, or `in_table` is quietly false. Deleting a table makes every `in_table` that reads it false, so an exemption written as `!in_table(…)` then matches everyone. Check `rules list` first. More in [Lookup tables](reading-results.md#lookup-tables).

## Investigate

### In plain language

```bash
clerk-protect investigate schema                  # tables and columns you can ask about
clerk-protect investigate --no-interactive --format json \
  --purpose "<the user's words: why they want to know>" \
  --shape "one row per ASN with blocked count and distinct IPs, top 20" \
  "Which networks produced the most blocked sign-ins in the last 24 hours?"
```

- Rows go to stdout (`--format table|csv|json`). The query, the checks and a short summary go to stderr. `--json` prints every event of the stream as a JSON line instead.
- Exit `5`: Protect needs more information. Show the user the questions, then resend the same question with `--prior-request <id>` and `--context "Q: <question> A: <their answer>"` for each answer.
- Exit `4`: declined. The reason is on stderr; usually the question isn't about this instance's decisions.
- If it says it isn't available for this instance yet, use `insights` below.
- What you pass in `--purpose`, `--justification` and `--investigating` is recorded as the user's reason. Ask them for it.

### With filters

```bash
clerk-protect insights dimensions                                   # what you can filter and group on
clerk-protect insights facets --since 24h --filter decision=DENY     # top values of each dimension
clerk-protect insights facets --since 24h --unit flows --filter flow_kind=SIGN_UP   # attempts, not decisions
clerk-protect insights timeseries --since 168h --group-by decision      # decisions over time
clerk-protect insights search --since 1h --filter source_ip=203.0.113.7   # the decisions themselves, newest first
clerk-protect insights entity --dimension source_ip --value 203.0.113.7   # everything about one value
clerk-protect insights flow --decision-id ID --at 2026-10-27T12:00:00Z   # every decision in one flow
clerk-protect insights trace-id 7Q8ikxgt                             # the decision behind a blocked screen's reference (v0.5.0+)
```

Dimension names and values come from `insights dimensions`. Windows default to the last 24 hours and reach back 14 days at most. Counts are decisions unless you pass `--unit flows`; see [Decisions are not sign-ups](reading-results.md#decisions-are-not-sign-ups). `insights --since` takes hours (`168h`, up to `336h`); `matches` also accepts days (`7d`), and replay windows are hours (`6h`, up to `24h`). The flows unit has its own dimensions: run `insights dimensions --unit flows`.

### Live

```bash
clerk-protect trace --no-tui --filter decision=DENY         # one line per decision as it happens
clerk-protect trace --json                                 # one JSON object per decision
```

In a terminal, `trace` opens an interactive view (`?` for the keys). Pass `--no-tui` or `--json` when you are reading its output.

### How often things match

```bash
clerk-protect matches --since 7d                           # each protection, as sparklines
clerk-protect matches --rule-id RULE_ID --since 24h
```

## Test a change before applying it

A replay scores a candidate change against traffic the instance already had, then applies exactly that change if the user wants it.

A minimal `change.json` that adds one rule:

```json
{
  "ruleset": "SIGN_UP",
  "since": "6h",
  "samplePercent": 25,
  "addRules": [
    {
      "id": "disposable_email_challenge",
      "expression": "email.domain.apex == \"mailinator.com\"",
      "action": "CHALLENGE",
      "description": "Disposable email domain"
    }
  ]
}
```

```bash
clerk-protect replay list
clerk-protect replay create --file change.json --watch   # asks first: it reads recent traffic
clerk-protect replay get REPLAY_ID --json                # the report, and the request it scored
clerk-protect replay apply REPLAY_ID                     # asks first: changes live rules
```

Give each added rule an `id`, so the report can attribute outcomes to it. Start with one to six hours; 24 hours is the maximum and often too slow on a busy instance. Besides `addRules`, a request can carry `disableRules`, `replaceRules`, `reorderRules`, `enableProtection`, `completedFlowsOnly` and `limit`. The Protect Labs replay page builds the same request (`clerk-protect console open --path /replay`), and `replay get … --json` shows an earlier replay's `request` to start from.

Before applying, read the report: see [Reading a replay](reading-results.md#reading-a-replay).

## Open the web console

```bash
clerk-protect console open                  # Protect Labs, signed in as this computer's sign-in
clerk-protect console open --path /rules
```

## Scripts

- `--json` on every command. `--yes` to confirm a change non-interactively, only with the user's approval.
- `CLERK_PROTECT_PROFILE` selects a profile. `CLERK_PROTECT_CONFIG_DIR` moves everything the CLI stores.
- Signing in always needs a person at a browser, so it does not suit unattended CI longer than one sign-in (up to eight hours; `whoami` shows when it ends).
