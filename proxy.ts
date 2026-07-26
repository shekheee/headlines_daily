import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isAuthRoute = nextUrl.pathname.startsWith("/auth");
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

  // Allow auth API routes always
  if (isApiAuth) return;

  // Redirect logged-in users away from sign-in page
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL("/admin", nextUrl));
  }

  // Protect admin routes
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/auth/signin", nextUrl));
    }
    // Only ADMIN and EDITOR can access admin panel
    if (role !== "ADMIN" && role !== "EDITOR" && role !== "REPORTER") {
      return Response.redirect(new URL("/", nextUrl));
    }
    // Only ADMIN can access user management
    if (nextUrl.pathname.startsWith("/admin/users") && role !== "ADMIN") {
      return Response.redirect(new URL("/admin", nextUrl));
    }
  }
});

// Only run auth middleware where it's actually needed. The old catch-all matcher
// ran this edge function on EVERY request (all article pages, every crawler hit,
// every API route), which burns Vercel Fluid Active CPU for no reason — the logic
// below only guards /admin and /auth. Scoping to those paths means public/crawler
// traffic no longer invokes middleware at all.
export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
};
