# Clerk Skills

This repo contains the Clerk API skill for Claude so the agent can manage Clerk users, organizations, and invitations through the Backend API.

## Quick Start

### 1. Set Your API Key

Get your secret key from the [Clerk Dashboard](https://dashboard.clerk.com) under **API Keys** and export it before running any scripts:

```bash
export CLERK_SECRET_KEY=sk_live_xxxxx  # use sk_test_ for development
```

### 2. Install the Skill

#### Option A: Claude.ai

1. Zip this repository directory
2. Go to Settings → Features in [claude.ai](https://claude.ai)
3. Upload the zip under Custom Skills

#### Option B: Claude API

Upload via the `/v1/skill` endpoint:

```bash
curl -X POST https://api.anthropic.com/v1/skill \
  -H "Authorization: Bearer $ANTHROPIC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "clerk-api", "files": [...]}'
```

#### Option C: Claude Code

Copy this directory into your project’s `.claude/skills/` folder, for example:

```bash
cp -r skills/ .claude/skills/clerk-api
```

### 3. Use the Skill

Once installed, Claude will automatically reach for this skill when you ask about:

- Managing users (`list all users`, `update user metadata`, etc.)
- Managing organizations (`create an org`, `add member`, etc.)
- Managing invitations (`invite user`, `revoke invitation`, etc.)

## Available Operations

### Users

| Operation | Description |
|-----------|-------------|
| `list_users()` | List/search users |
| `get_user(user_id)` | Get user by ID |
| `get_user_count()` | Get total user count |
| `update_user(user_id, ...)` | Update user profile |
| `update_user_metadata(user_id, ...)` | Update public/unsafe/private metadata |
| `delete_user(user_id)` | Delete a user permanently |

### Organizations

| Operation | Description |
|-----------|-------------|
| `list_organizations()` | List/search organizations |
| `get_organization(org_id)` | Get organization by ID |
| `create_organization(name, ...)` | Create new organization |
| `update_organization(org_id, ...)` | Update organization |
| `delete_organization(org_id)` | Delete organization permanently |
| `list_members(org_id)` | List organization members |
| `add_member(org_id, user_id, role)` | Add member to organization |
| `update_member(org_id, user_id, role)` | Update member's role |
| `remove_member(org_id, user_id)` | Remove member from organization |

### Invitations

| Operation | Description |
|-----------|-------------|
| `list_invitations(org_id)` | List organization invitations |
| `get_invitation(org_id, invitation_id)` | Get invitation by ID |
| `create_invitation(org_id, email, role)` | Invite user to organization |
| `revoke_invitation(org_id, invitation_id)` | Revoke pending invitation |

## Security Considerations

- Never share your Clerk secret key—it has full admin access
- Use test keys (`sk_test_`) in development and switch to `sk_live_` only for production
- Audit Claude’s operations in the Clerk Dashboard logs
- Consider restricted keys if you only need read access

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `CLERK_SECRET_KEY environment variable is not set` | Export your Clerk secret key before running commands |
| `401 Unauthorized` | The secret key is invalid or expired; generate a new one |
| `404 Not Found` | The resource ID is incorrect |
| `422 Validation Error` | Review the error details for invalid parameters |

## Development

Test the Python scripts locally from the repository root:

```bash
export CLERK_SECRET_KEY=sk_test_xxxxx

# Test user operations
python users.py list

# Test organization operations
python organizations.py list
```

## Files

| File | Description |
|------|-------------|
| `SKILL.md` | Skill definition and invocation instructions for Claude |
| `clerk_api.py` | Minimal Clerk Backend API client |
| `users.py` | User management operations |
| `organizations.py` | Organization and membership operations |
| `invitations.py` | Invitation operations |
| `README.md` | This file |

## Support

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Backend API Reference](https://clerk.com/docs/reference/backend-api)
- [Claude Agent Skills Documentation](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
