import { NextRequest, NextResponse } from "next/server";

import { getUserFromToken } from "./lib/helpers";
import { authRoutes, publicRoutes, ROUTES } from "./routes";

export const proxy = async (request: NextRequest) => {
  const { nextUrl, url } = request;
  const path = nextUrl.pathname;
  // const token = request.cookies.get("session")?.value;
  const userData = await getUserFromToken();
  const isLoggedIn = !!userData;

  // Org screens sit under a dynamic `/<slug>` segment and cannot be listed,
  // so anything not explicitly public requires a session.
  const isPrivateRoute = !publicRoutes.some((route) => path === route);

  const isAuthRoute = authRoutes.some((route) => {
    const pattern = route.replace(/\[.*?\]/g, "[^/]+");
    return new RegExp(`^${pattern}$`).test(path);
  });

  if (isLoggedIn && userData.onboardingCompleted) {
    if (path === ROUTES.SETUP) {
      return NextResponse.redirect(new URL(ROUTES.ROOT, url));
    }
  }

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

  return NextResponse.next();
};

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
