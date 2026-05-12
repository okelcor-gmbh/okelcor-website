import { NextRequest, NextResponse } from "next/server";
import { SHOP_REQUIRES_LOGIN } from "@/lib/flags";
import { canAccess, PATH_SECTION } from "@/lib/admin-permissions";

// Paths accessible to every authenticated admin regardless of role.
const ADMIN_ALWAYS_ALLOWED = [
  "/admin",
  "/admin/unauthorized",
  "/admin/profile",
  "/admin/change-password",
  "/admin/security",    // all roles can visit to manage own 2FA
];

function roleCanAccess(role: string, pathname: string): boolean {
  if (ADMIN_ALWAYS_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  if (role === "super_admin") return true;

  // Derive from the canonical ROLE_ACCESS map — single source of truth.
  const section = Object.entries(PATH_SECTION).find(([path]) =>
    pathname.startsWith(path)
  )?.[1];

  if (!section) return true;    // path not mapped — pass through
  if (!role) return false;      // unknown/missing role — deny
  return canAccess(role, section);
}

// ── Middleware ────────────────────────────────────────────────────────────────

const PROTECTED_ROUTES = ["/shop", "/checkout", "/account"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Prefetch requests are speculative — never redirect them. The actual
  // navigation will be checked. Redirecting prefetches causes Next.js to
  // cache the redirect and replay it even after the cookie is present.
  if (request.headers.get("Next-Router-Prefetch") === "1") {
    return NextResponse.next();
  }

  // ── Admin routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const role = request.cookies.get("admin_role")?.value ?? "";
    if (role && !roleCanAccess(role, pathname)) {
      return NextResponse.redirect(new URL("/admin/unauthorized", request.url));
    }

    return NextResponse.next();
  }

  // ── Customer protected routes ─────────────────────────────────────────────
  const isProtected = SHOP_REQUIRES_LOGIN && PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtected) {
    const token = request.cookies.get("customer_token")?.value;
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/shop/:path*",
    "/checkout/:path*",
    "/account/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
