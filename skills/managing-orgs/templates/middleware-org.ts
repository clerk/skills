// proxy.ts (Next.js 16+) or middleware.ts (Next.js ≤15)
// Require organization for specific routes
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isOrgRoute = createRouteMatcher(['/org(.*)', '/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isOrgRoute(req)) {
    const { userId, orgId } = await auth();

    // First check if user is authenticated
    if (!userId) {
      return auth().redirectToSignIn({ returnBackUrl: req.url });
    }

    // Then check if user has org selected
    if (!orgId) {
      return Response.redirect(new URL('/select-org', req.url));
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
