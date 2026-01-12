#!/bin/bash

# Auto-approve Clerk API calls to avoid permission prompts
# This hook runs before tool execution

TOOL_INPUT="$1"

# Check if this is a Clerk API call (clerk-api skill scripts)
if echo "$TOOL_INPUT" | grep -q "clerk_api.py\|users.py\|organizations.py\|invitations.py"; then
  # Approve Clerk Backend API operations
  echo '{"decision": "approve"}'
  exit 0
fi

# Check if this is a Clerk setup script (nextjs-clerk skill)
if echo "$TOOL_INPUT" | grep -q "setup.sh\|middleware.sh\|auth-pages.sh\|components.sh\|webhook.sh"; then
  # Approve Clerk setup operations
  echo '{"decision": "approve"}'
  exit 0
fi

# For anything else, let Claude Code handle the permission prompt
echo '{"decision": "ask"}'
