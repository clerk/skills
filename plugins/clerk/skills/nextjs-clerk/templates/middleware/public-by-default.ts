/**
 * Public-by-Default Proxy Middleware Template
 *
 * Makes all routes public by default and only protects specific routes.
 * Use this when most of your app is public but some routes need auth.
 * Place this in your project root as `proxy.ts` (Next.js 16+) or `middleware.ts` (Next.js ≤15).
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only these routes require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/api/user(.*)",
]);

// Explicitly public routes (webhooks, etc.)
const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/public(.*)",
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

