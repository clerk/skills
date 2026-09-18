# Clerk to Clerk

Moving users between Clerk instances — development → production is the common case, but any instance to any other works the same way.

## Two commands

```sh
clerk migrate export clerk --instance dev --output exports/clerk-export.json
clerk migrate import --transformer clerk --file exports/clerk-export.json --instance prod
```

`--instance` picks the instance per command, so there is **no key swapping**. Do not comment keys in and out of a `.env` file, do not ask the user to paste two secret keys, and do not detect the instance type by calling `/v1/instance` yourself — `--instance dev|prod|<instance_id>` is the whole mechanism. (If you find instructions describing a `.env` dance, they describe the old standalone tool.)

To move between two different **applications**, pass `--app` as well:

```sh
clerk migrate export clerk --app app_source123 --instance prod --output exports/source.json
clerk migrate import --transformer clerk --file exports/source.json --app app_dest456 --instance prod
```

Confirm what each side resolved to before running the import — `clerk whoami` and `clerk doctor --json` show the linked application, and the export prints the instance it read from.

**Always name the source on the export.** With `--secret-key`, `--app`, `--instance` or `CLERK_SECRET_KEY`, the export runs against exactly that. Without any of them, a human gets a picker of every instance on their account (the linked application's instances listed first); an agent gets whatever resolves — usually the linked project, which is usually the destination. An agent that omits `--instance` on the export can end up exporting the destination and importing it back into itself.

## What survives, and what does not

The `clerk` transformer carries more than any other, because both ends share a schema:

- Every email and phone, already split into verified and unverified
- Username, first and last name
- TOTP secret and backup codes, when the export contains them
- All three metadata blocks
- `created_at`, so users keep their original signup dates instead of all appearing to have joined today
- `legal_accepted_at`, `banned`, and the organization and self-delete permissions

**Passwords do not survive.** Clerk's API never returns password digests, TOTP secrets, or backup codes — only the `*_enabled` booleans. Say this before the migration, not after:

> Users who signed in with a password on the source instance will need to use "Forgot password" on the destination.

The export's field coverage report shows the size of that gap: a `0/150 have a password` row means every one of those users hits a reset flow.

## Rate limits differ by direction

The destination instance's key sets the pace, and it is the *destination* that matters because that is where the writes go.

| Destination     | Requests per second | User limit                                        |
| --------------- | ------------------- | ------------------------------------------------- |
| Production      | 100                 | none                                              |
| Development     | 10                  | **100 by default** — the run warns before passing it |

Production → development is the direction that hits the limit. The import reads the destination's current user count and warns when the file would take it past 100; a human is asked whether to continue, while `-y` and agent mode proceed and the excess users fail with `You have reached your limit of N users`. Clerk can raise a development instance's limit on request, and the CLI cannot see the raised value, so ask the user rather than assuming either way. If they want a realistic copy of production in a dev instance, a subset of the file is usually the answer.

## Re-running and undoing

Every imported user carries `external_id` set to their source Clerk user ID, so:

- **Re-running is safe to reason about** — a user already imported fails as a duplicate rather than silently forking into two accounts.
- **`clerk migrate delete -y`** removes exactly the users the last import created from this directory, matched on those external IDs. The CLI records that run in its own config, keyed by project, so run `delete` from the same directory.
- **A run that died halfway** continues with `--resume-after <userId>`, using the last successful `userId` from `logs/import-<timestamp>.log`. Do not restart from the top.

## Flow

1. Confirm which instance is the source and which is the destination. Ask if there is any doubt; this is the step where a mistake writes production users into the wrong place.
2. Export from the source, and report the count and coverage.
3. Tell the user passwords are not included.
4. Import into the destination **without `-y`**, following [Step 3 of the import flow](../SKILL.md#step-3-get-confirmation-then-run) — for a production destination, hand the command to the human so they see the Migration Readiness report and confirm. It cross-references the file against the destination's live settings and catches an identifier the destination requires but the source did not collect.
5. Report imported and failed counts, and where the log is.
