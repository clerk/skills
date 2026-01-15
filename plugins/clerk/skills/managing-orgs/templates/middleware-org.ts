// middleware.ts
// Require organization for specific routes
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isOrgRoute = createRouteMatcher(['/org(.*)', '/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isOrgRoute(req)) {
    const { orgId } = await auth();
    if (!orgId) {
      // Redirect to org selection page
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
