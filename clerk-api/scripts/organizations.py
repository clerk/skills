#!/usr/bin/env python3
"""
Clerk Organizations API

Manage organizations and memberships in your Clerk application.

Usage:
    python organizations.py list [--limit N] [--offset N] [--query "search"]
    python organizations.py get <org_id>
    python organizations.py create --name "Org Name" [--slug "org-slug"] [--created-by <user_id>]
    python organizations.py update <org_id> [--name "New Name"] [--slug "new-slug"]
    python organizations.py delete <org_id>
    python organizations.py add-member <org_id> --user-id <user_id> --role "org:admin"
    python organizations.py update-member <org_id> --user-id <user_id> --role "org:member"
    python organizations.py remove-member <org_id> --user-id <user_id>
    python organizations.py list-members <org_id> [--limit N] [--offset N]
"""

import argparse
import json
import sys

from clerk_api import get_client, print_result, print_error, ClerkAPIError


def list_organizations(limit: int = 10, offset: int = 0, query: str = None) -> dict:
    """
    List organizations in the application.
    
    Args:
        limit: Maximum number of organizations to return (default: 10, max: 500)
        offset: Number of organizations to skip
        query: Search query to filter organizations by name
        
    Returns:
        List of organization objects
    """
    client = get_client()
    params = {
        "limit": limit,
        "offset": offset,
    }
    if query:
        params["query"] = query
    
    return client.get("/organizations", params=params)


def get_organization(org_id: str, include_members_count: bool = True) -> dict:
    """
    Get a specific organization by ID.
    
    Args:
        org_id: The ID of the organization (starts with "org_")
        include_members_count: Whether to include member count
        
    Returns:
        Organization object
    """
    client = get_client()
    params = {}
    if include_members_count:
        params["include_members_count"] = "true"
    return client.get(f"/organizations/{org_id}", params=params)


def create_organization(
    name: str,
    slug: str = None,
    created_by: str = None,
    max_allowed_memberships: int = None,
    public_metadata: dict = None,
    private_metadata: dict = None,
) -> dict:
    """
    Create a new organization.
    
    Args:
        name: Name of the organization (required)
        slug: URL-friendly identifier (auto-generated from name if not provided)
        created_by: User ID of the creator (becomes admin)
        max_allowed_memberships: Maximum number of members allowed
        public_metadata: Public metadata for the organization
        private_metadata: Private metadata (backend only)
        
    Returns:
        Created organization object
    """
    client = get_client()
    
    data = {"name": name}
    if slug is not None:
        data["slug"] = slug
    if created_by is not None:
        data["created_by"] = created_by
    if max_allowed_memberships is not None:
        data["max_allowed_memberships"] = max_allowed_memberships
    if public_metadata is not None:
        data["public_metadata"] = public_metadata
    if private_metadata is not None:
        data["private_metadata"] = private_metadata
    
    return client.post("/organizations", data=data)


def update_organization(
    org_id: str,
    name: str = None,
    slug: str = None,
    max_allowed_memberships: int = None,
    public_metadata: dict = None,
    private_metadata: dict = None,
) -> dict:
    """
    Update an organization.
    
    Args:
        org_id: The ID of the organization to update
        name: New name
        slug: New slug
        max_allowed_memberships: New max members limit
        public_metadata: New public metadata (merged with existing)
        private_metadata: New private metadata (merged with existing)
        
    Returns:
        Updated organization object
    """
    client = get_client()
    
    data = {}
    if name is not None:
        data["name"] = name
    if slug is not None:
        data["slug"] = slug
    if max_allowed_memberships is not None:
        data["max_allowed_memberships"] = max_allowed_memberships
    if public_metadata is not None:
        data["public_metadata"] = public_metadata
    if private_metadata is not None:
        data["private_metadata"] = private_metadata
    
    if not data:
        raise ValueError("At least one field must be provided to update")
    
    return client.patch(f"/organizations/{org_id}", data=data)


def delete_organization(org_id: str) -> dict:
    """
    Delete an organization permanently.
    
    WARNING: This action is irreversible. All memberships and invitations
    will also be deleted.
    
    Args:
        org_id: The ID of the organization to delete
        
    Returns:
        Deleted organization object
    """
    client = get_client()
    return client.delete(f"/organizations/{org_id}")


def list_members(org_id: str, limit: int = 10, offset: int = 0) -> dict:
    """
    List members of an organization.
    
    Args:
        org_id: The organization ID
        limit: Maximum number of members to return
        offset: Number of members to skip
        
    Returns:
        List of membership objects
    """
    client = get_client()
    params = {
        "limit": limit,
        "offset": offset,
    }
    return client.get(f"/organizations/{org_id}/memberships", params=params)


def add_member(org_id: str, user_id: str, role: str) -> dict:
    """
    Add a user as a member of an organization.
    
    Args:
        org_id: The organization ID
        user_id: The user ID to add
        role: The role to assign (e.g., "org:admin", "org:member")
        
    Returns:
        Created membership object
    """
    client = get_client()
    data = {
        "user_id": user_id,
        "role": role,
    }
    return client.post(f"/organizations/{org_id}/memberships", data=data)


def update_member(org_id: str, user_id: str, role: str) -> dict:
    """
    Update a member's role in an organization.
    
    Args:
        org_id: The organization ID
        user_id: The user ID to update
        role: The new role to assign
        
    Returns:
        Updated membership object
    """
    client = get_client()
    data = {"role": role}
    return client.patch(f"/organizations/{org_id}/memberships/{user_id}", data=data)


def remove_member(org_id: str, user_id: str) -> dict:
    """
    Remove a member from an organization.
    
    Args:
        org_id: The organization ID
        user_id: The user ID to remove
        
    Returns:
        Deleted membership object
    """
    client = get_client()
    return client.delete(f"/organizations/{org_id}/memberships/{user_id}")


def main():
    parser = argparse.ArgumentParser(
        description="Manage Clerk organizations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # List organizations
    list_parser = subparsers.add_parser("list", help="List organizations")
    list_parser.add_argument("--limit", type=int, default=10, help="Max orgs to return")
    list_parser.add_argument("--offset", type=int, default=0, help="Orgs to skip")
    list_parser.add_argument("--query", type=str, help="Search query")
    
    # Get organization
    get_parser = subparsers.add_parser("get", help="Get an organization by ID")
    get_parser.add_argument("org_id", help="Organization ID")
    
    # Create organization
    create_parser = subparsers.add_parser("create", help="Create an organization")
    create_parser.add_argument("--name", required=True, help="Organization name")
    create_parser.add_argument("--slug", help="URL-friendly slug")
    create_parser.add_argument("--created-by", dest="created_by", help="Creator user ID")
    create_parser.add_argument("--max-members", dest="max_members", type=int, help="Max members")
    create_parser.add_argument("--public-metadata", dest="public_metadata", help="Public metadata JSON")
    
    # Update organization
    update_parser = subparsers.add_parser("update", help="Update an organization")
    update_parser.add_argument("org_id", help="Organization ID")
    update_parser.add_argument("--name", help="New name")
    update_parser.add_argument("--slug", help="New slug")
    update_parser.add_argument("--max-members", dest="max_members", type=int, help="Max members")
    
    # Delete organization
    delete_parser = subparsers.add_parser("delete", help="Delete an organization")
    delete_parser.add_argument("org_id", help="Organization ID")
    
    # List members
    members_parser = subparsers.add_parser("list-members", help="List organization members")
    members_parser.add_argument("org_id", help="Organization ID")
    members_parser.add_argument("--limit", type=int, default=10, help="Max members to return")
    members_parser.add_argument("--offset", type=int, default=0, help="Members to skip")
    
    # Add member
    add_parser = subparsers.add_parser("add-member", help="Add a member to organization")
    add_parser.add_argument("org_id", help="Organization ID")
    add_parser.add_argument("--user-id", dest="user_id", required=True, help="User ID")
    add_parser.add_argument("--role", required=True, help="Role (e.g., org:admin)")
    
    # Update member
    update_member_parser = subparsers.add_parser("update-member", help="Update member role")
    update_member_parser.add_argument("org_id", help="Organization ID")
    update_member_parser.add_argument("--user-id", dest="user_id", required=True, help="User ID")
    update_member_parser.add_argument("--role", required=True, help="New role")
    
    # Remove member
    remove_parser = subparsers.add_parser("remove-member", help="Remove a member")
    remove_parser.add_argument("org_id", help="Organization ID")
    remove_parser.add_argument("--user-id", dest="user_id", required=True, help="User ID")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    try:
        if args.command == "list":
            result = list_organizations(
                limit=args.limit,
                offset=args.offset,
                query=args.query,
            )
        elif args.command == "get":
            result = get_organization(args.org_id)
        elif args.command == "create":
            public_meta = json.loads(args.public_metadata) if args.public_metadata else None
            result = create_organization(
                name=args.name,
                slug=args.slug,
                created_by=args.created_by,
                max_allowed_memberships=args.max_members,
                public_metadata=public_meta,
            )
        elif args.command == "update":
            result = update_organization(
                args.org_id,
                name=args.name,
                slug=args.slug,
                max_allowed_memberships=args.max_members,
            )
        elif args.command == "delete":
            result = delete_organization(args.org_id)
        elif args.command == "list-members":
            result = list_members(
                args.org_id,
                limit=args.limit,
                offset=args.offset,
            )
        elif args.command == "add-member":
            result = add_member(args.org_id, args.user_id, args.role)
        elif args.command == "update-member":
            result = update_member(args.org_id, args.user_id, args.role)
        elif args.command == "remove-member":
            result = remove_member(args.org_id, args.user_id)
        else:
            parser.print_help()
            sys.exit(1)
        
        print_result(result)
        
    except ClerkAPIError as e:
        print_error(e)
        sys.exit(1)
    except ValueError as e:
        print_error(e)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON - {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

