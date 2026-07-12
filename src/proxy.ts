import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session";

// Routes an unauthenticated visitor can still reach.
const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password"];

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always let static assets, images, API routes, and Next internals through.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|txt)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secretKey = getSecretKey();

  async function hasValidSession() {
    if (!token || !secretKey) return false;
    try {
      await jwtVerify(token, secretKey);
      return true;
    } catch {
      return false;
    }
  }

  // Only useful to someone who can't log in — send an already-logged-in
  // visitor back home instead.
  if (pathname === "/forgot-password" && (await hasValidSession())) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/reset-password/")) {
    return NextResponse.next();
  }

  if (await hasValidSession()) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/register";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match every route except Next.js internals and static files, which
     * are already excluded above but kept out of the matcher too for
     * performance (fewer requests even reach the middleware function).
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
