/**
 * Proxy Middleware with Organization Support
 *
 * Protects routes and ensures users have an active organization selected.
 * Use this for B2B/multi-tenant applications.
 * Place this in your project root as `proxy.ts` (Next.js 16+) or `middleware.ts` (Next.js ≤15).
 */
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

