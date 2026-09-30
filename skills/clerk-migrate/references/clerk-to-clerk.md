# Clerk to Clerk

Moving users between Clerk instances. Development → production is the common case; any instance to any other works the same way.

## The commands

```sh
clerk migrate export clerk --instance dev                        # prints a run ID
clerk migrate import <export-run-id> --instance prod --dry-run
clerk migrate import <export-run-id> --instance prod --yes       # after the user says yes
```

`--instance` picks the instance per command, so there is **no key swapping**. Do not comment keys in and out of a `.env` file, do not ask the user to paste two secret keys, and do not call `/v1/instance` yourself. `--instance dev|prod|<instance_id>` is the whole mechanism. The export envelope names its source, so the import needs no `--source`.

To move between two different **applications**, pass `--app` as well:

```sh
clerk migrate export clerk --app app_source123 --instance prod
clerk migrate import <export-run-id> --app app_dest456 --instance prod --dry-run
```

Every command prints its target first. Read those lines back to the user before the import writes anything.

**Always name the source on the export.** With `--secret-key`, `--app`, `--instance` or `CLERK_SECRET_KEY`, the export runs against exactly that. Without any of them, a human gets a picker of every instance on their account (the linked application's instances listed first). An agent gets whatever resolves: usually the linked project, which is usually the destination. An export without `--instance` can read the destination and import it back into itself.

## What survives, and what does not

The `clerk` source carries more than any other, because both ends share a schema:

- Every email and phone, already split into verified and unverified
- Username, first and last name
- All three metadata blocks, each in its original place
- `created_at`, so users keep their original signup dates
- `legal_accepted_at`, `banned`, and the organization and self-delete permissions

**Passwords and MFA do not survive `clerk migrate export clerk`.** The Backend API never returns password digests, TOTP secrets, or backup codes. Say this before the migration:

> Users who signed in with a password on the source instance will need to use "Forgot password" on the destination.

The export's field coverage report shows the size of that gap. A Clerk Dashboard export does carry digests and TOTP secrets; import it with `--source clerk`.

**Social sign-ins are not copied.** Enable the same providers on the destination; Clerk links a returning user by verified email.

## Rate limits and the development limit

The destination's key sets the pace, because the writes go there.

| Destination | Requests per second | User limit                                   |
| ----------- | ------------------- | -------------------------------------------- |
| Production  | 100                 | none                                         |
| Development | 10                  | **100 by default**, enforced by the checks   |

Production → development hits the limit. The import's checks read the destination's user count and reject users past the headroom, which stops the import unless `--allow-partial` is passed. Clerk can raise a development instance's limit on request, and the CLI cannot see the raised value, so ask the user. For a realistic copy of production in a dev instance, a subset of the file is usually the answer.

## Re-running and undoing

Every imported user carries `external_id` set to their source Clerk user ID.

- **The checks reject users already in the destination**, matched on source ID, email, phone or username. A second import cannot fork a user into two accounts.
- **Re-running the same import continues it.** A partial or interrupted run resumes; a complete one prints "Already imported in run …".
- **`clerk migrate undo <run-id> --yes`** deletes exactly the users that run created. It refuses with exit `2` if the key now addresses a different instance, so pass the same `--app`/`--instance` as the import.

## Flow

1. Confirm which instance is the source and which is the destination. Ask if there is any doubt.
2. Export from the source with `--instance` (and `--app`), and report the count and coverage.
3. Tell the user passwords and MFA are not included.
4. Dry-run the import against the destination and relay the checks. They catch an identifier the destination requires but the source did not collect.
5. Get a yes, then import with `--yes`. For a production destination, consider handing the command to the human instead.
6. Report created, failed and skipped counts from `clerk migrate runs <run-id>`.
