#!/bin/bash
# Generate middleware for existing Next.js project
# Usage: bash middleware.sh [template]
# Templates: basic (default), organizations, public-by-default

set -e

TEMPLATE=${1:-"basic"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIDDLEWARE_FILE="middleware.ts"

# Check if we're in a Next.js project
if [ ! -f "package.json" ]; then
  echo "❌ Error: No package.json found. Run this from your Next.js project root."
  exit 1
fi

# Check if src directory exists
if [ -d "src" ]; then
  MIDDLEWARE_FILE="src/middleware.ts"
fi

echo "🛡️ Generating Clerk middleware..."
echo "   Template: $TEMPLATE"
echo "   Output: $MIDDLEWARE_FILE"
echo ""

case $TEMPLATE in
  "basic")
    cat > "$MIDDLEWARE_FILE" << 'EOF'
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define protected routes - users must be signed in to access these
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/protected(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
EOF
    ;;

  "organizations")
    cat > "$MIDDLEWARE_FILE" << 'EOF'
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/protected(.*)",
]);

// Routes that require an active organization
const isOrgRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/org(.*)",
]);

// Admin-only routes
const isAdminRoute = createRouteMatcher([
  "/dashboard/settings(.*)",
  "/dashboard/billing(.*)",
  "/api/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId, orgRole } = await auth();

  // Protect authenticated routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Require organization for org routes
  if (isOrgRoute(req) && userId && !orgId) {
    const selectOrgUrl = new URL("/select-org", req.url);
    selectOrgUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
    return Response.redirect(selectOrgUrl);
  }

  // Check admin access
  if (isAdminRoute(req) && orgRole !== "org:admin") {
    return Response.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
EOF
    ;;

  "public-by-default")
    cat > "$MIDDLEWARE_FILE" << 'EOF'
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only these routes require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/api/user(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Only protect routes that explicitly need it
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
EOF
    ;;

  *)
    echo "❌ Unknown template: $TEMPLATE"
    echo "   Available templates: basic, organizations, public-by-default"
    exit 1
    ;;
esac

echo "✅ Middleware generated at $MIDDLEWARE_FILE"
echo ""
echo "📋 Protected routes:"
echo "   - /dashboard/*"
echo "   - /api/protected/*"

if [ "$TEMPLATE" = "organizations" ]; then
  echo ""
  echo "🏢 Organization settings:"
  echo "   - /dashboard/* requires an organization"
  echo "   - /dashboard/settings/* requires admin role"
fi

echo ""
echo "📝 Customize the route matchers in $MIDDLEWARE_FILE as needed."

