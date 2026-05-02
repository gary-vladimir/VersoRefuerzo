// Edge middleware. Two jobs:
//   1. Redirect unauthenticated HTML requests to /login. API routes are NOT
//      redirected — they return 401 JSON via getServerUser() so XHR clients
//      get a parseable response instead of HTML.
//   2. Forward the current pathname as `x-pathname` so server components can
//      read it via `headers()`. Used by app/(app)/layout.tsx to skip the
//      onboarding redirect when already on /onboarding.
//
// Cookie validity is NOT verified here — middleware runs in the Edge runtime
// and cannot use Firebase Admin or Drizzle. Cryptographic verification
// happens server-side in `getServerUser()`.

import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS: RegExp[] = [
  /^\/login(\/|$)/,
  /^\/api\/auth(\/|$)/,
  /^\/api\/health(\/|$)/,
  /^\/_next(\/|$)/,
  /^\/favicon\.ico$/,
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get("__session");
  const isPublic = PUBLIC_PATHS.some((rx) => rx.test(pathname));
  const isApi = pathname.startsWith("/api/");

  if (!sessionCookie && !isPublic && !isApi) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (sessionCookie && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
