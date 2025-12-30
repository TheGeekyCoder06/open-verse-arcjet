import { createMiddleware } from "@arcjet/next";
import aj from "./lib/arcjet";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "./lib/auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|healthz).*)"],
};

const arcjetMiddleware = createMiddleware(aj);

export async function proxy(request) {
  const pathname = request.nextUrl.pathname;

  // 🚫 Skip Arcjet email-based rules on pages where no email exists yet
  const skipArcjetRoutes = ["/login", "/signup"];
  const shouldSkipArcjet = skipArcjetRoutes.some((r) =>
    pathname.startsWith(r)
  );

  let response = NextResponse.next();
  let arcjetResponse = null;

  if (!shouldSkipArcjet) {
    arcjetResponse = await arcjetMiddleware(request);
  }

  // 🔒 Protected routes
  const protectedRoutes = ["/"];

  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtectedRoute) {
    const token = (await cookies()).get("auth_token")?.value;
    const user = token ? await verifyAuthToken(token) : null;

    if (!user && pathname !== "/login") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      response = NextResponse.redirect(loginUrl);
    }
  }

  // ↩️ Apply Arcjet headers if present
  if (arcjetResponse?.headers) {
    arcjetResponse.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
  }

  if (arcjetResponse && arcjetResponse.status !== 200) {
    return arcjetResponse;
  }

  return response;
}
