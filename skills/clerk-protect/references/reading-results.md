# Reading what `clerk-protect` returns

The CLI's numbers are easy to misread, and some mistakes in rules fail silently. Read this before you report a number to the user or propose a rule.

## Report facts, inferences and unknowns separately

- **Facts** are what the CLI printed. Quote them with their unit (decisions or flows), the window, and any filter.
- **Inferences** are what you conclude from them. Label them as yours.
- **Unknowns** are what the data can't tell you. Say them.

Some things the data never proves:

- **A passed challenge is not proof of a real person.** Coordinated sign-up farms pass challenges too.
- **A risk signal is not proof of fraud.** Established users trip device and network checks, for example on a VPN or a corporate network.
- **A completed attempt is not a legitimate one.** It means the sign-in or sign-up finished, nothing more.

Before you blame a protection for a failure, confirm its scope: which stage it checks, which request types, and whether that client is checked at all (`protections show NAME`).

## Decisions are not sign-ups

One sign-in or sign-up produces several decisions, one per checked step. `insights` counts decisions by default, so its counts overstate attempts.

- When the user asks about sign-ups, sign-ins or accounts, pass `--unit flows` and name the unit in the answer.
- `insights flow --decision-id ID --at TIME` shows every decision in one attempt.
- A `COMPLETION` decision is the last check before the account or session is created. A deny there means no account was created or no session started.
- For a rate-limit rule, set `--rate-limit-identity-key` to count each attempt once, for example `signup.signup_id` or `signin.signin_id`. A limit keyed on email or IP alone counts every checked request, so one sign-up can count several times.

## Windows

- Decisions are kept for 14 days. A question about last month gets "that data isn't kept", not zero.
- `insights` windows default to 24 hours. `--since` goes up to 14 days (`336h`).
- The Labs console can show a shorter window than the CLI for the same instance. Say which window you used.

## Challenges

Protect records that a challenge was issued, not whether it was solved. The closest proxy is `flow_outcome`: whether that attempt went on to complete. Say that it is a proxy.

## Not every block is Protect's

A user saying "I was blocked" is not proof that Protect did it.

- A Protect block shows the rule's message and a short reference, such as `7Q8ikxgt`. `insights trace-id REFERENCE` finds it.
- A "too many requests" (HTTP 429) error is Clerk's own rate limiting. It never appears in `insights`.
- The Clerk Dashboard's bot protection and other edge rules act on their own and don't appear in `insights` either.

If `insights search` shows no deny for that identifier or IP in the window, tell the user Protect didn't block it. Don't name a rule that didn't fire.

## Rule order

Rulesets run in a fixed order: the `ALL` ruleset first, then the request's own (`SIGN_IN`, `SIGN_UP`, …). Within one ruleset, custom and protection rules are sorted together by action, then priority, then position: every `block` rule runs before every `challenge` rule, whatever its position. Priority runs from 0 to 1000, lower first, and a rule that sets none counts as 100. The CLI has no `--priority` flag; set `priority` in a `--file` rule body, and read it with `rules get --json`. So:

- Within one ruleset, a `challenge` can't shadow a `block`. A `challenge` in `ALL` still runs before a `block` in `SIGN_UP`.
- `rules reorder` only changes stored position, which decides between rules with the same action and priority.
- In `clerk-protect` v0.5.0 and earlier, `rules reorder --help` says the first matching block or challenge decides, and `rules list` calls its order evaluation order. Both describe stored order; the sort above still applies.
- `rules reorder` only matters among rules of the same action. Moving a challenge above a block is accepted and changes nothing.

## Expressions

- Take field names from `clerk-protect schema`, never from memory.
- There is no `[a, b]` list literal. Use a set, `{"a", "b"}`, or a lookup table.
- `x != "value"` and negations are true when `x` is missing. A rule meant to exclude Gmail written as `email.domain != "gmail.com"` matches every phone-only sign-up too. Guard it: `email.domain != null && email.domain != "gmail.com"`. Positive tests (`==`, `in`, and methods such as `x.startsWith(…)`) don't match a missing value. The standalone function form, `startsWith(x, …)`, treats a missing value as an empty string, so prefer the method form.
- For disposable email domains, match `email.domain.apex`. Providers rotate subdomains.

## Lookup tables

- A column that a rule looks up must be created `matchable`. Otherwise `in_table` is quietly false. The CLI's default is not matchable.
- `in_table` is also false when the table or the column doesn't exist. An exemption written as `!in_table(…)` then matches everyone.
- Confirm a value matches with `tables rows search TABLE --match COL=VALUE`, and replay the rule before applying it.

## Reading a replay

Read `clerk-protect replay get REPLAY_ID --json` before you suggest applying anything:

- **`fidelity`** compares the replayed current rules against what was actually recorded. When few decisions match, the rules changed during the window and every other number is less reliable. Say so.
- **`transitions`** are the outcomes that change, from the current rules to the candidate, by rule.
- **`denied_completed_flows`** counts attempts that completed in reality and that the candidate would have denied, by sign-in and sign-up. It's the cost of shipping the change. Absent means nothing was denied or the attempts couldn't be resolved, which is not the same as zero.
- **`warnings`**, **`notes`** and **`truncated`** say how far to trust the numbers. Relay them.
- **`sample_percent`** is the share of traffic scored. Scale counts by it, and say you did.
- For each rule: `evaluated`, `matched`, `terminal` (the times it decided the outcome), `never_reached` (an earlier rule decided first), `rate_limited_not_exceeded` and `errors`. A rule with matches but no terminal outcomes changes nothing.
- **`samples`** in each transition are example decision ids. They carry no timestamp, and `insights flow` needs one (`--at`), so find the decision with `insights search` over the replay's window before opening its flow.

What a replay can't tell you:

- A completed flow is an attempt, not a person, and not a sign it was legitimate.
- `CHALLENGE` means the attempt would have met a challenge, not that it would have failed it.
- `DENY` is the simulated decision. It doesn't guarantee the attacker stays out after retrying.

## Replay windows

`--since 24h` is the maximum, not a safe default. A replay stops after 30 minutes, and a rate-limit rule widens the traffic it has to read by its own window, so on a busy instance a 24-hour replay with a daily limit doesn't finish. Start with one to six hours, and set `samplePercent` in the request on a busy instance.
