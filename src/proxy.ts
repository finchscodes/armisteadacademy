import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session";

// Routes an unauthenticated visitor can still reach.
const PUBLIC_PATHS = ["/", "/login", "/register"];

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

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secretKey = getSecretKey();

  if (token && secretKey) {
    try {
      await jwtVerify(token, secretKey);
      return NextResponse.next();
    } catch {
      // Invalid/expired token — fall through to redirect.
    }
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
