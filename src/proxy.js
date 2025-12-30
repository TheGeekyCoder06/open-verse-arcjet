
import {createMiddleware} from '@arcjet/next';
import arcjetClient from '@/lib/arcjet';

export const config = {
  // matcher tells Next.js which routes to run the middleware/proxy on.
  // This runs on all routes except for static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
  matcher: ["/((?!_next/static|_next/image|favicon.ico|healthz).*)"],
};

export default createMiddleware(arcjetClient);