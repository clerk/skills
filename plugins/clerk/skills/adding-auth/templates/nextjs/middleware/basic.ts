/**
 * Basic Proxy Middleware Template
 *
 * Protects routes that match the specified patterns.
 * Place this in your project root as `proxy.ts` (Next.js 16+) or `middleware.ts` (Next.js ≤15).
 */
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
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

