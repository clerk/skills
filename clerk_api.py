#!/usr/bin/env python3
"""
Clerk Backend API Client

A lightweight HTTP client for interacting with Clerk's Backend API.
Uses the CLERK_SECRET_KEY environment variable for authentication.
"""

import json
import os
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode


class ClerkAPIError(Exception):
    """Exception raised for Clerk API errors."""
    
    def __init__(self, status_code: int, message: str, errors: list = None):
        self.status_code = status_code
        self.message = message
        self.errors = errors or []
        super().__init__(f"[{status_code}] {message}")


class ClerkClient:
    """HTTP client for Clerk Backend API."""
    
    BASE_URL = "https://api.clerk.com/v1"
    
    def __init__(self, secret_key: str = None):
        """
        Initialize the Clerk client.
        
        Args:
            secret_key: Clerk secret key. If not provided, reads from CLERK_SECRET_KEY env var.
        """
        self.secret_key = secret_key or os.environ.get("CLERK_SECRET_KEY")
        if not self.secret_key:
            raise ValueError(
                "CLERK_SECRET_KEY environment variable is not set. "
                "Please set it to your Clerk secret key (starts with sk_)."
            )
    
    def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: dict = None, 
        params: dict = None
    ) -> dict:
        """
        Make an HTTP request to the Clerk API.
        
        Args:
            method: HTTP method (GET, POST, PATCH, DELETE)
            endpoint: API endpoint (e.g., "/users")
            data: Request body for POST/PATCH requests
            params: Query parameters
            
        Returns:
            Parsed JSON response
            
        Raises:
            ClerkAPIError: If the API returns an error
        """
        url = f"{self.BASE_URL}{endpoint}"
        
        # Add query parameters
        if params:
            # Filter out None values
            filtered_params = {k: v for k, v in params.items() if v is not None}
            if filtered_params:
                url += "?" + urlencode(filtered_params)
        
        # Prepare request
        headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }
        
        body = None
        if data is not None:
            body = json.dumps(data).encode("utf-8")
        
        request = Request(url, data=body, headers=headers, method=method)
        
        try:
            with urlopen(request) as response:
                response_body = response.read().decode("utf-8")
                if response_body:
                    return json.loads(response_body)
                return {}
        except HTTPError as e:
            error_body = e.read().decode("utf-8")
            try:
                error_data = json.loads(error_body)
                message = error_data.get("message", str(e))
                errors = error_data.get("errors", [])
            except json.JSONDecodeError:
                message = error_body or str(e)
                errors = []
            raise ClerkAPIError(e.code, message, errors)
        except URLError as e:
            raise ClerkAPIError(0, f"Network error: {e.reason}")
    
    def get(self, endpoint: str, params: dict = None) -> dict:
        """Make a GET request."""
        return self._make_request("GET", endpoint, params=params)
    
    def post(self, endpoint: str, data: dict = None, params: dict = None) -> dict:
        """Make a POST request."""
        return self._make_request("POST", endpoint, data=data, params=params)
    
    def patch(self, endpoint: str, data: dict = None) -> dict:
        """Make a PATCH request."""
        return self._make_request("PATCH", endpoint, data=data)
    
    def delete(self, endpoint: str) -> dict:
        """Make a DELETE request."""
        return self._make_request("DELETE", endpoint)


def get_client() -> ClerkClient:
    """Get a Clerk client instance using environment variables."""
    return ClerkClient()


def format_output(data: any) -> str:
    """Format data as pretty-printed JSON."""
    return json.dumps(data, indent=2, default=str)


def print_result(data: any):
    """Print formatted result to stdout."""
    print(format_output(data))


def print_error(error: Exception):
    """Print error to stderr."""
    if isinstance(error, ClerkAPIError):
        print(f"Error [{error.status_code}]: {error.message}", file=sys.stderr)
        if error.errors:
            for err in error.errors:
                print(f"  - {err}", file=sys.stderr)
    else:
        print(f"Error: {error}", file=sys.stderr)


if __name__ == "__main__":
    # Test the client
    try:
        client = get_client()
        print("Clerk client initialized successfully!")
        print(f"API Base URL: {client.BASE_URL}")
    except ValueError as e:
        print_error(e)
        sys.exit(1)

