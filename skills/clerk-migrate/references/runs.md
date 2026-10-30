# Runs, re-running, and undo

Every export, import and undo is a run: a folder holding what it did, user by user. `clerk migrate runs` reads them, re-running an import continues one, and `clerk migrate undo` reverses one.

## Re-running an import

Running the same import again continues it. The CLI matches on the file's sha256, the source (a custom source by its file hash), and the instance ID:

| Latest matching run | Re-running does                                                          |
| ------------------- | ------------------------------------------------------------------------ |
| none                | starts a new run                                                         |
| interrupted         | continues the same run, skipping the users it created                    |
| `partial`           | continues the same run, retrying the users that failed or were rejected. Users the source skipped stay skipped. |
| `complete`          | nothing; prints "Already imported in run …" and exits `0`                |
| `undone`            | starts a new run                                                         |

`--new-run` skips the lookup and forces a fresh run.

Only one import of a file into an instance runs at a time. A second one exits `2` while the first is live, whatever source or `--runs-dir` it uses, and names the lock file. A Ctrl-C or a crash can leave the lock behind; the next import reclaims it. The file is safe to delete when no `clerk migrate import` is running.

A re-run refuses with exit `2`, and imports nothing, when:

- another process holds the run, or is importing this same file into the same instance
- the same file went into this instance under a different source, or an earlier version of a source you wrote, and that run was not undone. Undo it, or pass `--new-run` to import alongside it. The source's hash covers only its own file, not local files it imports.
- an undo of the matching run is unfinished. Finish the undo first.
- Clerk did not confirm which instance the key addresses (a stand-in `key_…` ID), and a run of this file exists under a real instance ID, so the CLI cannot tell whether it is the same instance. Try again, or pass `--new-run`.
- a Firebase run is continued with different hash parameters
- `--reserve-unverified` is passed to continue a run created without it. A continue keeps the mode the run recorded.

Importing an export run by its ID into the instance it was exported from is refused too: every user is already there.

## Run files

```sh
clerk migrate runs                        # every run, newest first
clerk migrate runs 20260929-141502-a1b2   # one run in full
clerk migrate runs --json
```

Each run folder holds `run.json` (kind, status, target, source, file and its sha256, counts, flags) and `users.ndjson`, one line per user outcome. A line carries `sourceId`, `clerkId` and `status`, plus `reason`, `error`, `code`, `passwordDropped`, `reserved` or `pending` when they apply. The last line for each `sourceId` wins.

| `status`   | Means                                                                          |
| ---------- | ------------------------------------------------------------------------------ |
| `created`  | Clerk created the user. `pending` lists identifiers still to attach.           |
| `creating` | sent, with no confirmed answer. `runs` shows it as "not confirmed".            |
| `failed`   | Clerk refused the create. `error` and `code` say why.                          |
| `skipped`  | left out: by the source (`code: "source_skip"`), by a reject under `--allow-partial`, or by `--require-password`. `reason` says why. |
| `deleted`  | removed by an undo                                                             |
| `exported` | written by an export run                                                       |

Grep it directly:

```sh
grep '"status":"failed"' .clerk/migrate/<run-id>/users.ndjson
```

A run is `partial` when any user failed, was skipped, was not confirmed, was not sent, or has identifiers left to attach, and `complete` otherwise. A user its source skipped (`code: "source_skip"`) doesn't count. A run whose only skips are those is `complete`. A run whose process died before recording a finish time is `interrupted`, but only `clerk migrate runs` works that out: its `run.json` still says `running`. Read `run.state` from `runs <run-id> --json` (or `runs[].state` from `runs --json`) rather than `status` from `run.json`.

A run records the instance ID from `GET /v1/instance`. When that call fails and nothing else names the instance, it records `key_<hash>` instead.

## Undoing an import

```sh
clerk migrate undo <run-id> --dry-run    # preview: how many, and how many signed in since
clerk migrate undo <run-id> --yes
clerk migrate undo <run-id> --yes --include-signed-in
```

`undo` deletes only the users that run created: the Clerk IDs it recorded, plus any create it never confirmed, found by `external_id` and the run's `clerkMigrateRun` marker. Users the import did not create stay untouched.

Show the user the preview, including how many imported users have signed in since, and get a yes before passing `--yes`. **`--yes` alone does not delete users who signed in since the import.** If there are any, it exits `2` and deletes nothing, and `--json` prints `"includeSignedIn": "required"`. Those are accounts people have used: pass `--include-signed-in` only after the user says yes to deleting them too. A user who signs in between the preview and the delete also stops the undo; run it again to see the new preview.

It refuses with exit `2`, and deletes nothing, when:

- the key addresses a different instance than the run imported into
- Clerk could not confirm the instance (a stand-in `key_…` ID on the run or for the current key), unless the run was recorded with this same key. Try again in a minute.
- the run is not an import (an export or an undo run)
- the run is already undone
- the import is still running in another process
- the run changed during the preview

A partial undo exits `1`. Running `undo` again retries the users that failed, in the same undo run. The import is marked `undone` only when every user is deleted.
