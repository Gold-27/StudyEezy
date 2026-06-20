import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("session_token")?.value;
  const emailVerified = request.cookies.get("email_verified")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/auth");
  const isPublicPage = pathname === "/" || pathname === "/manifest.json" || pathname.startsWith("/icons");

  // Redirect unauthenticated user accessing a protected route
  if (!sessionToken && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Check verification state for authenticated users
  if (sessionToken) {
    const isVerified = emailVerified === "true";

    if (!isVerified) {
      // Enforce email verification redirect if not on verification route
      const isVerifyMode = request.nextUrl.searchParams.get("mode") === "verify";
      if (!isAuthPage || !isVerifyMode) {
        const verifyUrl = new URL("/auth", request.url);
        verifyUrl.searchParams.set("mode", "verify");
        return NextResponse.redirect(verifyUrl);
      }
    } else {
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/summaries/:path*",
    "/flashcards/:path*",
    "/quizzes/:path*",
    "/rooms/:path*",
    "/chat/:path*",
    "/auth",
  ],
};
