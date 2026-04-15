# API Command

Make authenticated HTTP requests to Clerk's Backend API (default) or Platform API.

## Overview

`clerk api` provides direct access to Clerk's REST APIs from the terminal. It automatically resolves credentials from the linked project or auth session, handles authentication headers, and supports both read and write operations.

## Endpoint Discovery

### clerk api ls

List available API endpoints. This reads a locally cached endpoint catalog — it does **not** call Clerk's data APIs. On first run or cache expiry, it fetches the OpenAPI spec to refresh the cache.

```bash
# List all available endpoints
clerk api ls --mode agent

# Filter to endpoints matching a keyword
clerk api ls users --mode agent
clerk api ls organizations --mode agent
clerk api ls sessions --mode agent
```

Use `api ls` before making calls to discover the correct endpoint path and supported methods.

## Making API Calls

### Flags

| Flag | Type | Description |
|------|------|-------------|
| `[endpoint]` | string | API path (e.g., `/users`). Omit for interactive mode (human only). |
| `[filter]` | string | Filter keyword (used with `ls`). |
| `-X, --method <method>` | string | HTTP method. Default: `GET`, or `POST` if a body is provided. |
| `-d, --data <json>` | string | Inline JSON request body. |
| `--file <path>` | string | Read request body from a file. |
| `--include` | boolean | Show response headers alongside body. |
| `--app <id>` | string | Application ID for key resolution. |
| `--secret-key <key>` | string | Override the secret key directly. |
| `--instance <id>` | string | Instance to target: `dev`, `prod`, or instance ID. **Default: `dev`.** |
| `--platform` | boolean | Use Platform API instead of Backend API. |
| `--dry-run` | boolean | Print the request without executing it. |
| `--yes` | boolean | Skip confirmation for mutating requests (POST, PUT, PATCH, DELETE). |

### Auth resolution

Credentials are resolved in this order:

1. `--secret-key` flag (highest priority)
2. `CLERK_SECRET_KEY` environment variable
3. Linked app credentials (from `clerk link`)

When `--platform` is set, the CLI uses a separate auth path: `CLERK_PLATFORM_API_KEY` env var or the OAuth token from `clerk auth login`.

### Instance targeting

Default is `dev`. **Always pass `--instance prod` when targeting production** to avoid accidentally reading or modifying development data.

## Examples

### Read operations (GET)

```bash
# List users
clerk api /users --mode agent

# List users in production
clerk api /users --instance prod --mode agent

# Get a specific user
clerk api /users/user_abc123 --mode agent

# List organizations
clerk api /organizations --mode agent

# Show response headers
clerk api /users --include --mode agent
```

### Write operations

```bash
# Create a user (POST inferred from --data)
clerk api /users -d '{"email_address":["user@example.com"],"password":"S3cure!Pass"}' --yes --mode agent

# Update a user (explicit PUT)
clerk api /users/user_abc123 -X PUT -d '{"first_name":"Alice"}' --yes --mode agent

# Delete a user
clerk api /users/user_abc123 -X DELETE --yes --mode agent

# Request body from file
clerk api /users --file new-user.json --yes --mode agent
```

### Dry run

Preview the request without executing it. Outputs a curl-equivalent command.

```bash
clerk api /users -d '{"email_address":["user@example.com"]}' --dry-run --mode agent
```

### Platform API

Access organization-level resources using the Platform API instead of the Backend API.

```bash
clerk api /organizations --platform --mode agent
```

### Explicit secret key

Bypass the auth resolution chain with a direct key.

```bash
clerk api /users --secret-key sk_test_xxx --mode agent
```

## Common API Paths

| Resource | Endpoint | Methods |
|----------|----------|---------|
| Users | `/users` | GET, POST |
| User by ID | `/users/<user_id>` | GET, PUT, DELETE |
| Sessions | `/sessions` | GET |
| Session by ID | `/sessions/<session_id>` | GET, POST (revoke) |
| Organizations | `/organizations` | GET, POST |
| Organization by ID | `/organizations/<org_id>` | GET, PUT, DELETE |
| Organization members | `/organizations/<org_id>/memberships` | GET, POST |
| Invitations | `/invitations` | GET, POST |
| Invitation by ID | `/invitations/<invitation_id>` | GET, POST (revoke) |
| Allowlist | `/allowlist_identifiers` | GET, POST |
| Blocklist | `/blocklist_identifiers` | GET, POST |

Use `clerk api ls <keyword> --mode agent` to discover additional endpoints.

## Pagination

GET endpoints that return lists are paginated. Pass `limit` and `offset` as query parameters:

```bash
# First 10 users
clerk api '/users?limit=10' --mode agent

# Next page (skip first 10)
clerk api '/users?limit=10&offset=10' --mode agent
```

Check the response for `total_count` to determine if more pages exist. Use `clerk api ls <resource> --mode agent` to discover the full parameter set for an endpoint.

## Notes

- Response is always JSON
- `--dry-run` outputs a curl-equivalent without executing
- Mutating requests (POST, PUT, PATCH, DELETE) prompt for confirmation unless `--yes` is passed
