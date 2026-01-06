#!/usr/bin/env python3
"""
Clerk Invitations API

Manage organization invitations in your Clerk application.

Usage:
    python invitations.py list <org_id> [--limit N] [--offset N] [--status "pending"]
    python invitations.py create <org_id> --email "user@example.com" --role "org:member"
    python invitations.py get <org_id> --invitation-id <invitation_id>
    python invitations.py revoke <org_id> --invitation-id <invitation_id>
"""

import argparse
import sys

from clerk_api import get_client, print_result, print_error, ClerkAPIError


def list_invitations(
    org_id: str,
    limit: int = 10,
    offset: int = 0,
    status: str = None,
) -> dict:
    """
    List invitations for an organization.
    
    Args:
        org_id: The organization ID
        limit: Maximum number of invitations to return (default: 10, max: 500)
        offset: Number of invitations to skip
        status: Filter by status ("pending", "accepted", "revoked")
        
    Returns:
        List of invitation objects
    """
    client = get_client()
    params = {
        "limit": limit,
        "offset": offset,
    }
    if status:
        params["status"] = status
    
    return client.get(f"/organizations/{org_id}/invitations", params=params)


def get_invitation(org_id: str, invitation_id: str) -> dict:
    """
    Get a specific invitation by ID.
    
    Args:
        org_id: The organization ID
        invitation_id: The invitation ID
        
    Returns:
        Invitation object
    """
    client = get_client()
    return client.get(f"/organizations/{org_id}/invitations/{invitation_id}")


def create_invitation(
    org_id: str,
    email_address: str,
    role: str,
    inviter_user_id: str = None,
    redirect_url: str = None,
    public_metadata: dict = None,
) -> dict:
    """
    Create an invitation to join an organization.
    
    The invited email will receive an email invitation to join the organization.
    
    Args:
        org_id: The organization ID
        email_address: Email address to send the invitation to
        role: Role to assign upon accepting (e.g., "org:admin", "org:member")
        inviter_user_id: User ID of the person sending the invitation
        redirect_url: URL to redirect to after accepting
        public_metadata: Public metadata for the invitation
        
    Returns:
        Created invitation object
    """
    client = get_client()
    
    data = {
        "email_address": email_address,
        "role": role,
    }
    if inviter_user_id is not None:
        data["inviter_user_id"] = inviter_user_id
    if redirect_url is not None:
        data["redirect_url"] = redirect_url
    if public_metadata is not None:
        data["public_metadata"] = public_metadata
    
    return client.post(f"/organizations/{org_id}/invitations", data=data)


def revoke_invitation(org_id: str, invitation_id: str, requesting_user_id: str = None) -> dict:
    """
    Revoke a pending invitation.
    
    This immediately invalidates the invitation, preventing the recipient
    from using it to join the organization.
    
    Args:
        org_id: The organization ID
        invitation_id: The invitation ID to revoke
        requesting_user_id: User ID of the person revoking
        
    Returns:
        Revoked invitation object
    """
    client = get_client()
    
    data = {}
    if requesting_user_id is not None:
        data["requesting_user_id"] = requesting_user_id
    
    return client.post(
        f"/organizations/{org_id}/invitations/{invitation_id}/revoke",
        data=data if data else None,
    )


def main():
    parser = argparse.ArgumentParser(
        description="Manage Clerk organization invitations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # List invitations
    list_parser = subparsers.add_parser("list", help="List invitations")
    list_parser.add_argument("org_id", help="Organization ID")
    list_parser.add_argument("--limit", type=int, default=10, help="Max invitations to return")
    list_parser.add_argument("--offset", type=int, default=0, help="Invitations to skip")
    list_parser.add_argument("--status", help="Filter by status (pending, accepted, revoked)")
    
    # Get invitation
    get_parser = subparsers.add_parser("get", help="Get an invitation by ID")
    get_parser.add_argument("org_id", help="Organization ID")
    get_parser.add_argument("--invitation-id", dest="invitation_id", required=True, help="Invitation ID")
    
    # Create invitation
    create_parser = subparsers.add_parser("create", help="Create an invitation")
    create_parser.add_argument("org_id", help="Organization ID")
    create_parser.add_argument("--email", required=True, help="Email address to invite")
    create_parser.add_argument("--role", required=True, help="Role to assign (e.g., org:member)")
    create_parser.add_argument("--inviter-user-id", dest="inviter_user_id", help="Inviter user ID")
    create_parser.add_argument("--redirect-url", dest="redirect_url", help="Redirect URL after accepting")
    
    # Revoke invitation
    revoke_parser = subparsers.add_parser("revoke", help="Revoke an invitation")
    revoke_parser.add_argument("org_id", help="Organization ID")
    revoke_parser.add_argument("--invitation-id", dest="invitation_id", required=True, help="Invitation ID")
    revoke_parser.add_argument("--requesting-user-id", dest="requesting_user_id", help="Requesting user ID")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    try:
        if args.command == "list":
            result = list_invitations(
                args.org_id,
                limit=args.limit,
                offset=args.offset,
                status=args.status,
            )
        elif args.command == "get":
            result = get_invitation(args.org_id, args.invitation_id)
        elif args.command == "create":
            result = create_invitation(
                args.org_id,
                email_address=args.email,
                role=args.role,
                inviter_user_id=args.inviter_user_id,
                redirect_url=args.redirect_url,
            )
        elif args.command == "revoke":
            result = revoke_invitation(
                args.org_id,
                args.invitation_id,
                requesting_user_id=args.requesting_user_id,
            )
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


if __name__ == "__main__":
    main()

