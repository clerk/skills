---
name: clerk-api
description: Manage Clerk users, organizations, and invitations via the Backend API. Use when the user asks about managing authentication users, creating or updating organizations, inviting members, listing users, or any Clerk-related administrative operations.
---

# Clerk API Skill

This skill allows you to interact with Clerk's Backend API to manage users, organizations, and invitations.

## Setup

Before using this skill, ensure the `CLERK_SECRET_KEY` environment variable is set to your Clerk secret key:

```bash
export CLERK_SECRET_KEY=sk_live_xxxxx  # or sk_test_xxxxx for development
```

You can find your secret key in the [Clerk Dashboard](https://dashboard.clerk.com) under API Keys.

## Available Operations

### Users

Manage users in your Clerk application.

**List users:**
```bash
python users.py list [--limit N] [--offset N] [--query "search term"]
```

**Get a specific user:**
```bash
python users.py get <user_id>
```

**Get total user count:**
```bash
python users.py count
```

**Update a user:**
```bash
python users.py update <user_id> [--first-name "John"] [--last-name "Doe"] [--username "johndoe"]
```

**Update user metadata:**
```bash
python users.py update-metadata <user_id> --public '{"key": "value"}' --unsafe '{"key": "value"}'
```

**Delete a user:**
```bash
python users.py delete <user_id>
```

### Organizations

Manage organizations and memberships.

**List organizations:**
```bash
python organizations.py list [--limit N] [--offset N] [--query "search term"]
```

**Get an organization:**
```bash
python organizations.py get <org_id>
```

**Create an organization:**
```bash
python organizations.py create --name "Acme Corp" [--slug "acme"] [--created-by <user_id>]
```

**Update an organization:**
```bash
python organizations.py update <org_id> [--name "New Name"] [--slug "new-slug"]
```

**Delete an organization:**
```bash
python organizations.py delete <org_id>
```

**Add a member to an organization:**
```bash
python organizations.py add-member <org_id> --user-id <user_id> --role "org:admin"
```

**Update a member's role:**
```bash
python organizations.py update-member <org_id> --user-id <user_id> --role "org:member"
```

**Remove a member from an organization:**
```bash
python organizations.py remove-member <org_id> --user-id <user_id>
```

### Invitations

Manage organization invitations.

**List invitations for an organization:**
```bash
python invitations.py list <org_id>
```

**Create an invitation:**
```bash
python invitations.py create <org_id> --email "user@example.com" --role "org:member"
```

**Revoke an invitation:**
```bash
python invitations.py revoke <org_id> --invitation-id <invitation_id>
```

## Common Workflows

### Onboard a new team

1. Create an organization:
   ```bash
   python organizations.py create --name "Engineering Team"
   ```

2. Invite team members:
   ```bash
   python invitations.py create <org_id> --email "alice@company.com" --role "org:admin"
   python invitations.py create <org_id> --email "bob@company.com" --role "org:member"
   ```

### Find and update a user

1. Search for the user:
   ```bash
   python users.py list --query "alice@example.com"
   ```

2. Update their profile:
   ```bash
   python users.py update <user_id> --first-name "Alice" --last-name "Smith"
   ```

### Audit organization membership

1. List all organizations:
   ```bash
   python organizations.py list
   ```

2. For each organization, the response includes member count and details.

## Error Handling

All scripts return JSON output. Errors are printed to stderr with the HTTP status code and message.

Common error codes:
- `401`: Invalid or missing secret key
- `404`: Resource not found
- `422`: Validation error (check the error details)
- `429`: Rate limited (wait and retry)

## API Reference

For detailed API documentation, see:
- [Clerk Backend API Reference](https://clerk.com/docs/reference/backend-api)
- [User Object](https://clerk.com/docs/reference/backend-api/tag/Users)
- [Organization Object](https://clerk.com/docs/reference/backend-api/tag/Organizations)

