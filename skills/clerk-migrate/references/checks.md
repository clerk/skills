# Import checks

Every `clerk migrate import` runs its checks against the destination instance before writing anything. `--dry-run` stops after them. The checks sort users four ways.

```
Checks
  120 users checked
  ✗ 12 users rejected
      12: only has an unverified email, and this instance requires an email
         u_17, u_22, u_40, u_51, u_88, and 7 more
  ⚠ Imported, but not everything comes across
      6 users have a username, which this instance does not use: it is stored, and works only once usernames are turned on
      Clerk won't store: department (120 users)
  ✓ 108 users to import

Or change the instance instead
  Make Email optional at sign-up
    clerk config patch --app app_… --instance ins_… --json '{"auth_email":{"required_for_sign_up":false}}'
```

## Skipped by the source

Users their source asked to leave out: Supabase's deleted and anonymous users, Better Auth's anonymous users, Firebase users with no email or phone, and any user a custom source gives a `skipReason`. The checks print them as `- N users skipped, as the source asked`, with a count per reason. They never stop the import and need no `--allow-partial`. `--json` lists them as `checks.skipped`, and the run records each as `skipped` with `code: "source_skip"`.

## Rejected

Users Clerk would refuse. Each gets the first reason that applies, in this order:

1. It failed schema validation (`invalid: …`): no identifier at all, or an unknown password hasher.
2. It has only emails Clerk refuses (malformed, or a domain such as `.local` that can't receive mail), or only phones not in E.164 form while numeric usernames are on.
3. It lacks an identifier the instance requires. An email or phone counts only when it is **verified**, or reserved with `--reserve-unverified`: an unverified-only email does not satisfy a required email, because Clerk attaches unverified identifiers after the user exists.
4. It has no identifier the instance accepts, once the turned-off ones are removed.
5. It lacks a first or last name the instance requires.
6. It has TOTP or backup codes, and the instance has them off.
7. It has no password, and a password is the instance's only way to sign in.
8. It has no legal acceptance, and the instance requires it. `--skip-legal-checks` imports them without it.
9. Its username breaks the instance's rules (length, no letters, special characters).
10. Its password does not match the shape its hasher names. The CLI checks `bcrypt`, `scrypt_firebase`, `argon2i`/`argon2id` and `scrypt_werkzeug`.
11. Supabase only: its only provider is not enabled in Clerk (or Clerk doesn't offer it), and it has no verified or reserved email or phone that can sign in by code or link instead.

Users who pass all of those are then checked against each other and the instance:

12. Its source ID, email, phone or username repeats an earlier user in the file, or a user an earlier attempt of this run already created.
13. The instance already has a user with its source ID, email, phone or username. Users a continued run created do not count.
14. Development instances only: it falls past the user-limit headroom, counted in file order.

Any reject stops the import with exit `2`, and the CLI prints the same command with `--allow-partial` added. Users the source skipped don't count. With `--allow-partial`, the rest import and each reject is recorded in the run as `skipped` with its reason.

## Imported, but not everything comes across

Warnings, not rejects:

- fields Clerk stores but the instance does not use yet: a password, username, or first or last name with its setting off. Nothing is lost; it works once the setting is on.
- fields the instance is not set up to store (an email or phone when that identifier is off), and users without a field the instance requires that they still import without
- fields Clerk has no place for (`Clerk won't store: …`)
- passwords a source had to drop. The user imports without one, and the run line carries `passwordDropped: true`.
- emails, names, usernames or non-E.164 phones Clerk refuses, dropped from users who still have another identifier
- temporary bans, which import as permanent: Clerk bans don't expire
- users imported without legal acceptance under `--skip-legal-checks`
- a development instance whose user count could not be read, so the limit was checked as if it were empty

## The `clerk config patch` fixes

When a check traces back to an instance setting, the CLI prints a `clerk config patch …` command for each fix under **Or change the instance instead** (a Dashboard link instead when Clerk did not confirm the instance, and an `--app APP_ID` placeholder when no app is known). It never applies them. Treat each as an offer: an instance that requires an email may be set up the way its owner wants, and fixing the export may be the right answer. Ask the user before running any of them.

If the CLI cannot read the instance settings, it skips the required-field checks and says so. "Could not read" is not "switched off"; tell the user which one applies.

## Passwords and `--require-password`

`--require-password` leaves users without a password digest out of the import. The run records each as `skipped` with the reason `no password (--require-password)`, `import --json` counts them as `withoutPassword`, and a continued run does not retry them.

Pass it only when the user asks to leave out the users who have no password. An instance that requires a password still accepts imported users without one: the import sends them with `skip_password_requirement`, and they set a password when they reset it. "Passwords are required" describes the instance setting. It is not a request to skip anyone, and "they can reset their passwords" means import them.

An unrecognized password hasher rejects that user as `invalid: Unknown password hasher "…"`, and the message lists every hasher the CLI accepts. Like any reject, it stops the import unless `--allow-partial` is passed.

## Development-instance limit

New development instances allow 100 users. The checks read the live count and reject users past the headroom. Clerk can raise a development instance's limit on request, and the CLI cannot see the raised value, so ask the user rather than assuming either way. When Clerk has raised it, set `CLERK_MIGRATE_DEV_USER_LIMIT` to the new limit. `--allow-partial` imports up to the headroom. For a real user base, import into production.

## Exit codes

| Command                 | `0`                              | `1`                  | `2`                                                      |
| ----------------------- | -------------------------------- | -------------------- | -------------------------------------------------------- |
| `import --dry-run`      | the real run would go ahead      | n/a                  | the real run would be refused                            |
| `import`                | no user failed                   | some users failed, or a runtime, API or auth error | usage error, reject without `--allow-partial`, no consent, or a refused re-run |
| `undo`                  | every user deleted               | some deletes failed, or a runtime error | usage error, a refusal, or no consent             |

A `0` from `import` is not always every user: skips under `--allow-partial`, users the run did not send, identifiers left to attach, "Already imported", and "No users left to import" all exit `0`. Read the counts from `--json` (`result.failed`, `result.skipped`, `result.notSent`, `result.pending`) before reporting success. `130` means the run was interrupted; re-run it to continue.
