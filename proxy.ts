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

export const config = {
  matcher: [
    "/admin/:path*",
    "/auth/:path*",
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
