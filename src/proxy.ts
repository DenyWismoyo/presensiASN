import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

/**
 * Route yang memerlukan autentikasi (dashboard & semua sub-route)
 */
const PROTECTED_ROUTES = [
  "/",
  "/presensi",
  "/laporan",
  "/izin",
  "/kalender",
  "/approval",
  "/statistik",
  "/pegawai",
  "/pengaturan",
  "/profil",
];

/**
 * Route yang boleh diakses tanpa autentikasi
 */
const PUBLIC_ROUTES = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Izinkan route publik
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Izinkan asset statis dan API Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Cek apakah ada session token di cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Cek juga di header Authorization (untuk API calls)
  const authHeader = request.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const isAuthenticated = Boolean(sessionToken || bearerToken);

  // Jika route protected dan tidak ada session → redirect ke login
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match semua request path kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
