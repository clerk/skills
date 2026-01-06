#!/usr/bin/env python3
"""
Clerk Users API

Manage users in your Clerk application.

Usage:
    python users.py list [--limit N] [--offset N] [--query "search"]
    python users.py get <user_id>
    python users.py count
    python users.py update <user_id> [--first-name "John"] [--last-name "Doe"] [--username "johndoe"]
    python users.py update-metadata <user_id> --public '{"key": "value"}' --unsafe '{"key": "value"}'
    python users.py delete <user_id>
"""

import argparse
import json
import sys

from clerk_api import get_client, print_result, print_error, ClerkAPIError


def list_users(limit: int = 10, offset: int = 0, query: str = None) -> dict:
    """
    List users in the application.
    
    Args:
        limit: Maximum number of users to return (default: 10, max: 500)
        offset: Number of users to skip
        query: Search query to filter users by email, name, or username
        
    Returns:
        List of user objects
    """
    client = get_client()
    params = {
        "limit": limit,
        "offset": offset,
    }
    if query:
        params["query"] = query
    
    return client.get("/users", params=params)


def get_user(user_id: str) -> dict:
    """
    Get a specific user by ID.
    
    Args:
        user_id: The ID of the user (starts with "user_")
        
    Returns:
        User object
    """
    client = get_client()
    return client.get(f"/users/{user_id}")


def get_user_count() -> dict:
    """
    Get the total count of users.
    
    Returns:
        Object with total_count field
    """
    client = get_client()
    return client.get("/users/count")


def update_user(
    user_id: str,
    first_name: str = None,
    last_name: str = None,
    username: str = None,
    profile_image_url: str = None,
    primary_email_address_id: str = None,
    primary_phone_number_id: str = None,
) -> dict:
    """
    Update a user's profile.
    
    Args:
        user_id: The ID of the user to update
        first_name: New first name
        last_name: New last name
        username: New username
        profile_image_url: URL to new profile image
        primary_email_address_id: ID of email to set as primary
        primary_phone_number_id: ID of phone to set as primary
        
    Returns:
        Updated user object
    """
    client = get_client()
    
    data = {}
    if first_name is not None:
        data["first_name"] = first_name
    if last_name is not None:
        data["last_name"] = last_name
    if username is not None:
        data["username"] = username
    if profile_image_url is not None:
        data["profile_image_url"] = profile_image_url
    if primary_email_address_id is not None:
        data["primary_email_address_id"] = primary_email_address_id
    if primary_phone_number_id is not None:
        data["primary_phone_number_id"] = primary_phone_number_id
    
    if not data:
        raise ValueError("At least one field must be provided to update")
    
    return client.patch(f"/users/{user_id}", data=data)


def update_user_metadata(
    user_id: str,
    public_metadata: dict = None,
    unsafe_metadata: dict = None,
    private_metadata: dict = None,
) -> dict:
    """
    Update a user's metadata.
    
    Metadata is merged with existing values. Set a key to null to remove it.
    
    Args:
        user_id: The ID of the user to update
        public_metadata: Public metadata (visible to frontend)
        unsafe_metadata: Unsafe metadata (readable from frontend, not in JWT)
        private_metadata: Private metadata (backend only)
        
    Returns:
        Updated user object
    """
    client = get_client()
    
    data = {}
    if public_metadata is not None:
        data["public_metadata"] = public_metadata
    if unsafe_metadata is not None:
        data["unsafe_metadata"] = unsafe_metadata
    if private_metadata is not None:
        data["private_metadata"] = private_metadata
    
    if not data:
        raise ValueError("At least one metadata field must be provided")
    
    return client.patch(f"/users/{user_id}/metadata", data=data)


def delete_user(user_id: str) -> dict:
    """
    Delete a user permanently.
    
    WARNING: This action is irreversible.
    
    Args:
        user_id: The ID of the user to delete
        
    Returns:
        Deleted user object
    """
    client = get_client()
    return client.delete(f"/users/{user_id}")


def main():
    parser = argparse.ArgumentParser(
        description="Manage Clerk users",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # List users
    list_parser = subparsers.add_parser("list", help="List users")
    list_parser.add_argument("--limit", type=int, default=10, help="Max users to return")
    list_parser.add_argument("--offset", type=int, default=0, help="Users to skip")
    list_parser.add_argument("--query", type=str, help="Search query")
    
    # Get user
    get_parser = subparsers.add_parser("get", help="Get a user by ID")
    get_parser.add_argument("user_id", help="User ID")
    
    # Count users
    subparsers.add_parser("count", help="Get total user count")
    
    # Update user
    update_parser = subparsers.add_parser("update", help="Update a user")
    update_parser.add_argument("user_id", help="User ID")
    update_parser.add_argument("--first-name", dest="first_name", help="First name")
    update_parser.add_argument("--last-name", dest="last_name", help="Last name")
    update_parser.add_argument("--username", help="Username")
    update_parser.add_argument("--profile-image-url", dest="profile_image_url", help="Profile image URL")
    
    # Update metadata
    metadata_parser = subparsers.add_parser("update-metadata", help="Update user metadata")
    metadata_parser.add_argument("user_id", help="User ID")
    metadata_parser.add_argument("--public", dest="public_metadata", help="Public metadata JSON")
    metadata_parser.add_argument("--unsafe", dest="unsafe_metadata", help="Unsafe metadata JSON")
    metadata_parser.add_argument("--private", dest="private_metadata", help="Private metadata JSON")
    
    # Delete user
    delete_parser = subparsers.add_parser("delete", help="Delete a user")
    delete_parser.add_argument("user_id", help="User ID")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    try:
        if args.command == "list":
            result = list_users(
                limit=args.limit,
                offset=args.offset,
                query=args.query,
            )
        elif args.command == "get":
            result = get_user(args.user_id)
        elif args.command == "count":
            result = get_user_count()
        elif args.command == "update":
            result = update_user(
                args.user_id,
                first_name=args.first_name,
                last_name=args.last_name,
                username=args.username,
                profile_image_url=args.profile_image_url,
            )
        elif args.command == "update-metadata":
            public = json.loads(args.public_metadata) if args.public_metadata else None
            unsafe = json.loads(args.unsafe_metadata) if args.unsafe_metadata else None
            private = json.loads(args.private_metadata) if args.private_metadata else None
            result = update_user_metadata(
                args.user_id,
                public_metadata=public,
                unsafe_metadata=unsafe,
                private_metadata=private,
            )
        elif args.command == "delete":
            result = delete_user(args.user_id)
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

