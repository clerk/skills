# Clerk to Clerk

Moving users between Clerk instances. Development → production is the common case; any instance to any other works the same way.

## The commands

```sh
clerk migrate export clerk --instance dev                        # prints a run ID
clerk migrate import <export-run-id> --instance prod --dry-run
clerk migrate import <export-run-id> --instance prod --yes       # after the user says yes
```

`--instance` picks the instance per command, so there is **no key swapping**. Do not comment keys in and out of a `.env` file, do not ask the user to paste two secret keys, and do not call `/v1/instance` yourself. `--instance dev|prod|<instance_id>` is the whole mechanism, as long as the key comes from the linked project or `--app`. An exported `CLERK_SECRET_KEY` outranks the linked project and names its own instance, so a `--instance` that disagrees with it exits `2`: ask the user to unset it for these commands. The export envelope names its source, so the import needs no `--source`.

To move between two different **applications**, pass `--app` as well:

```sh
clerk migrate export clerk --app app_source123 --instance prod
clerk migrate import <export-run-id> --app app_dest456 --instance prod --dry-run
```

Every command prints its target first. Read those lines back to the user before the import writes anything.

**Always name the source instance on the export.** With `--secret-key`, `--app`, `--instance` or `CLERK_SECRET_KEY`, the export runs against exactly that. Without any of them, a human gets a picker of every instance on their account, with the linked application's instances listed last and marked "(linked: usually the destination)". An agent, `--json` or `-y` run refuses with exit `2` and names the three ways to pass the source instance. An import of an export run into the instance it came from is refused too.

## What survives, and what doesn't

The `clerk` source carries more than any other, because both ends share a schema:

- Every email and phone, already split into verified and unverified
- Username, first and last name
- All three metadata blocks, each in its original place. The old app's own `external_id`, if it set one, moves to `private_metadata.clerkExternalId`, and the export warns about it: anything that looks users up by `external_id` needs updating.
- `created_at`, so users keep their original signup dates
- `legal_accepted_at`, `banned`, and the organization and self-delete permissions

**Passwords and MFA do not survive `clerk migrate export clerk`.** The Backend API never returns password digests, TOTP secrets, or backup codes. Say this before the migration:

> Users who signed in with a password on the source instance will need to use "Forgot password" on the destination.

The export's field coverage report shows the size of that gap. A Clerk Dashboard export does carry digests and TOTP secrets; import it with `--source clerk`. It carries no metadata, bans or legal acceptance, though.

**Social sign-ins are not copied.** Enable the same providers on the destination; Clerk links a returning user by verified email.

## Rate limits and the development limit

The destination's key sets the pace, because the writes go there.

| Destination | Requests per second | User limit                                   |
| ----------- | ------------------- | -------------------------------------------- |
| Production  | 100                 | none                                         |
| Development | 10                  | **100 by default**, enforced by the checks   |

Production → development hits the limit. The import's checks read the destination's user count and reject users past the headroom, which stops the import unless `--allow-partial` is passed. Clerk can raise a development instance's limit on request, and the checks use the limit Clerk reports. For a realistic copy of production in a dev instance, a subset of the file is usually the answer.

## Re-running and undoing

Every imported user carries `external_id` set to their Clerk user ID on the source instance, and `private_metadata.clerkMigrateRun` set to the import's run ID.

- **The checks reject users already in the destination**, matched on source ID, email, phone or username. A second import cannot fork a user into two accounts.
- **Re-running the same import continues it.** A partial or interrupted run resumes; a complete one prints "Already imported in run …".
- **`clerk migrate undo <run-id> --yes`** deletes exactly the users that run created. It refuses with exit `2` if the key now addresses a different instance, so pass the same `--app`/`--instance` as the import. Users who signed in since also need `--include-signed-in`, with the user's yes. See [runs.md](runs.md#undoing-an-import).

## Flow

1. Confirm which instance is the source instance and which is the destination. Ask if there is any doubt.
2. Export from the source instance with `--instance` (and `--app`), and report the count and coverage.
3. Tell the user passwords and MFA are not included.
4. Dry-run the import against the destination and relay the checks. They catch an identifier the destination requires but the source instance did not collect.
5. Get a yes, then import with `--yes`. For a production destination, consider handing the command to the human instead.
6. Report created, failed and skipped counts from `clerk migrate runs <run-id>`.
