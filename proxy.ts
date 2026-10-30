import { NextRequest, NextResponse } from "next/server";

import { getUserFromToken } from "./lib/helpers";
import {
  apiOriginOf,
  buildCsp,
  createNonce,
  CSP_HEADER,
} from "./lib/helpers/csp.helper";
import { API_BASE_URL, authRoutes, isPublicPath, ROUTES } from "./routes";

// Renders the page with a fresh CSP nonce. The policy goes on the request
// (Next.js reads the nonce from it for its own scripts) and on the response
// (what the browser applies). Redirects render nothing, so they skip this.
const nextWithCsp = (request: NextRequest) => {
  const csp = buildCsp({
    nonce: createNonce(),
    apiOrigin: apiOriginOf(API_BASE_URL),
    isDev: process.env.NODE_ENV === "development",
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSP_HEADER, csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(CSP_HEADER, csp);
  return response;
};

export const proxy = async (request: NextRequest) => {
  const { nextUrl, url } = request;
  const path = nextUrl.pathname;
  // const token = request.cookies.get("session")?.value;
  const userData = await getUserFromToken();
  const isLoggedIn = !!userData;

  // Org screens sit under a dynamic `/<slug>` segment and cannot be listed,
  // so anything not explicitly public requires a session.
  const isPrivateRoute = !isPublicPath(path);

  const isAuthRoute = authRoutes.some((route) => {
    const pattern = route.replace(/\[.*?\]/g, "[^/]+");
    return new RegExp(`^${pattern}$`).test(path);
  });

  // `onboardingCompleted` in the token only describes the org that was active
  // when it was issued, so it never drives routing: /setup and
  // /organizations/new stay open to create or finish any org. Per-org status
  // comes from GET /me/orgs (see ActiveOrgProvider).
  // No org at all yet → the first-run wizard.
  if (
    isLoggedIn &&
    isPrivateRoute &&
    userData?.activeOrgId === null &&
    path !== ROUTES.SETUP
  ) {
    return NextResponse.redirect(new URL(ROUTES.SETUP, url));
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL(ROUTES.ROOT, url));
  }

  if (!isLoggedIn && isPrivateRoute) {
    const loginUrl = new URL(ROUTES.LOGIN, url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  return nextWithCsp(request);
};

export const config = {
  // Static assets skip the auth check, or a signed-out visitor (e.g. on the
  // login page) gets the favicon redirected to /login.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
