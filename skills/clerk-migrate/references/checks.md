# Import checks

Every `clerk migrate import` runs its checks against the destination instance before writing anything. `--dry-run` stops after them. The checks sort users three ways.

```
Checks
  120 users checked
  ✗ 12 users rejected
      12: only has an unverified email, and this instance requires an email
         u_17, u_22, u_40, u_51, u_88, and 7 more
  ⚠ Imported, but not everything comes across
      6 users have a username, which this instance is not set up to store
      Clerk won't store: department (120 users)
  ✓ 108 users to import

Or change the instance instead
  Make Email optional at sign-up
    clerk config patch --app app_… --instance ins_… --json '{"auth_email":{"required_for_sign_up":false}}'
```

## Rejected

Users Clerk would refuse. Each gets the first reason that applies:

1. It failed schema validation (for example, no identifier at all).
2. Its source ID, email or phone repeats an earlier user in the file.
3. It lacks an identifier the instance requires. An email or phone counts only when it is **verified**: an unverified-only email does not satisfy a required email, because Clerk attaches unverified identifiers after the user exists.
4. Its password does not match the shape its hasher names. The CLI checks `bcrypt`, `scrypt_firebase`, `argon2i`/`argon2id` and `scrypt_werkzeug`.
5. Supabase only: its only provider is not enabled in Clerk.
6. The instance already has a user with its source ID, email, phone or username. Users a continued run created do not count.
7. Development instances only: it falls past the 100-user headroom, counted in file order.

Any reject stops the import with exit `2`, and the CLI prints the same command with `--allow-partial` added. With `--allow-partial`, the rest import and each reject is recorded in the run as `skipped` with its reason.

## Imported, but not everything comes across

Warnings, not rejects:

- fields the instance is not set up to store (a username when usernames are off)
- fields Clerk has no place for (`Clerk won't store: …`)
- passwords a source had to drop. The user imports without one, and the run line carries `passwordDropped: true`.

## The `clerk config patch` fixes

When a check traces back to an instance setting, the CLI prints a `clerk config patch …` command for each fix under **Or change the instance instead**. It never applies them. Treat each as an offer: an instance that requires an email may be set up the way its owner wants, and fixing the export may be the right answer. Ask the user before running any of them.

If the CLI cannot read the instance settings, it skips the required-field checks and says so. "Could not read" is not "switched off"; tell the user which one applies.

## Passwords and `--require-password`

`--require-password` leaves users without a password digest out of the run entirely. The run does not record them as skipped, so `runs <id>` does not list them.

An unrecognized password hasher aborts the whole run before anything is sent.

## Development-instance limit

New development instances allow 100 users. The checks read the live count and reject users past the headroom. Clerk can raise a development instance's limit on request, and the CLI cannot see the raised value, so ask the user rather than assuming either way. `--allow-partial` imports up to the headroom. For a real user base, import into production.

## Exit codes

| Command                 | `0`                              | `1`                  | `2`                                                      |
| ----------------------- | -------------------------------- | -------------------- | -------------------------------------------------------- |
| `import --dry-run`      | the real run would go ahead      | n/a                  | the real run would be refused                            |
| `import`                | every user created               | some users failed    | usage error, reject without `--allow-partial`, or no consent |
