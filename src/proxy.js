import { createMiddleware } from "@arcjet/next";
import arcjetClient from "@/lib/arcjet";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|healthz).*)"],
};

const arcjetMiddleware = createMiddleware(arcjetClient);

async function verifyAuthToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret);
    return { success: true, payload };
  } catch {
    return { success: false };
  }
}

export default async function middleware(req) {
  // Run Arcjet first
  const arcjetResponse = await arcjetMiddleware(req);
  if (arcjetResponse) return arcjetResponse;

  const url = req.nextUrl;
  const pathname = url.pathname;

  const protectedRoutes = ["/dashboard", "/profile", "/"];
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));

  let response = NextResponse.next();

  if (isProtected) {
    const token = req.cookies.get("auth_token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const user = await verifyAuthToken(token);

    if (!user.success) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // attach user to request context
    response.headers.set("x-user-id", user.payload.userId);
  }

  return response;
}
