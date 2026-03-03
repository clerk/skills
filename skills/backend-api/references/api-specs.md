# API Specs Reference

Shared rules for agents that interact with the Clerk Backend API OpenAPI specs.

## Output directory

The `-o`/`--out` global option controls where generated files and caches are written. Resolve it as:
1. If `-o [dir]` or `--out [dir]` was passed, use `<project_root>/<dir>/.clerk/`.
2. Otherwise, use `<project_root>/.clerk/`.

All paths below use `<outdir>` to mean the resolved directory.

## Spec resolution

The latest spec is bundled at `assets/api-spec.yml`. Use this by default — no network fetch needed.

**`--no-cache`** — Fetch the latest spec from GitHub and update `assets/api-spec.yml`:
```bash
curl -s https://raw.githubusercontent.com/clerk/openapi-specs/main/bapi/latest.yml -o assets/api-spec.yml
```
Then use the freshly fetched spec. If combined with `-v`/`--version`, fetch that version instead and update its cache file.

**`-v`/`--version`/`version` (specific version):**
1. Check `<outdir>/.cache/openapi/<version>.yml` — if it exists, use it.
2. Otherwise, fetch it and cache it:
```bash
mkdir -p <outdir>/.cache/openapi
curl -s https://raw.githubusercontent.com/clerk/openapi-specs/main/bapi/${version}.yml -o <outdir>/.cache/openapi/${version}.yml
```
If `--no-cache` is also set, always fetch even if the cache file exists.

**Skip for `help` mode** — only load spec data when the command actually needs it.

## Rules

- Always disregard endpoints/schemas related to `platform`.

## Extracting from specs

Use the bundled spec or cached version file as input to these scripts:

### Extract tags
```bash
cat ${spec_file} | node scripts/openapi/extract-tags.js
```

### Extract tag endpoints
```bash
cat ${spec_file} | bash scripts/openapi/extract-tag-endpoints.sh "${tag_name}"
```

### Extract endpoint detail
```bash
cat ${spec_file} | bash scripts/openapi/extract-endpoint-detail.sh "${path}" "${method}"
```
- `${path}` — e.g. `/users/{user_id}`
- `${method}` — lowercase, e.g. `get`

## Executing requests

```bash
bash scripts/openapi/execute-request.sh [--admin] ${METHOD} "${path}" ['${body_json}']
```
- `--admin` — bypass scope restrictions
- `${METHOD}` — uppercase HTTP method
- `${path}` — resolved path with parameters filled in (e.g. `/users/user_abc123`)
- `${body_json}` — optional JSON body for POST/PUT/PATCH

### Scope enforcement (write operations only)

For write operations (POST/PUT/PATCH/DELETE), check if `CLERK_BAPI_SCOPES` includes the required scope. If not, ask the user upfront: "This is a write/delete operation and your current scopes don't allow it. Run with --admin to bypass?" Do NOT attempt the request first and fail — ask before executing.
