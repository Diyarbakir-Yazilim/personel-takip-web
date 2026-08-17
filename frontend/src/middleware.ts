import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Route protection mapping path prefixes to allowed user roles.
 */
const ROLE_ROUTES: Record<string, string[]> = {
  '/admin': ['ADMIN', 'admin'],
  '/settings': ['ADMIN', 'admin'],
  '/reports': ['ADMIN', 'MANAGER', 'admin', 'manager'],
  '/dashboard': ['ADMIN', 'MANAGER', 'WORKER', 'admin', 'manager', 'worker'],
};

/**
 * Public routes accessible without authentication.
 */
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

/**
 * Next.js Middleware for authentication and role-based access control (RBAC).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass static files, Next.js internal assets, and public files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract token from HTTP cookies or Authorization header
  const token =
    request.cookies.get('token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  const fallbackRole = request.cookies.get('role')?.value;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // 1. Unauthenticated User Accessing Protected Route -> Redirect to /login
  if (!token) {
    if (!isPublicRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. Authenticated User Accessing Public Route -> Redirect to /dashboard
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Verify JWT and Enforce Role-Based Route Protection
  try {
    let userRole = fallbackRole;

    if (process.env.JWT_SECRET) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      userRole = (payload.role as string) || fallbackRole || 'WORKER';
    }

    const matchedRoute = Object.keys(ROLE_ROUTES).find((route) =>
      pathname.startsWith(route)
    );

    if (matchedRoute) {
      const allowedRoles = ROLE_ROUTES[matchedRoute];

      if (!userRole || !allowedRoles.includes(userRole)) {
        // Redirect unauthorized user to /unauthorized
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    const response = NextResponse.next();
    if (userRole) {
      response.headers.set('x-user-role', userRole);
    }

    return response;
  } catch (error) {
    // Expired or invalid token: clear cookies and redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('token');
    response.cookies.delete('role');
    return response;
  }
}

/**
 * Configure matching paths for middleware execution.
 */
export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/reports/:path*',
    '/login',
  ],
};