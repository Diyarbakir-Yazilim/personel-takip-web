import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ROLE_ROUTES: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/settings': ['ADMIN'],
  '/reports': ['ADMIN', 'SUPERVISOR'],
  '/dashboard': ['ADMIN', 'SUPERVISOR', 'STAFF'],
};

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get('access_token')?.value ||
    request.cookies.get('token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  const fallbackRole = request.cookies.get('role')?.value?.toUpperCase();
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // 1. If No Token Present
  if (!token) {
    if (!isPublicRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. If Token Exists: Attempt Verification
  try {
    let userRole = fallbackRole || 'STAFF';

    if (process.env.JWT_SECRET) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (payload.role && typeof payload.role === 'string') {
        userRole = payload.role.toUpperCase();
      }
    }

    // If Token is VALID and user attempts to access a public page -> Redirect to Dashboard
    if (isPublicRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Role-Based Authorization Access Control
    const sortedRoutes = Object.keys(ROLE_ROUTES).sort((a, b) => b.length - a.length);
    const matchedRoute = sortedRoutes.find((route) => pathname.startsWith(route));

    if (matchedRoute) {
      const allowedRoles = ROLE_ROUTES[matchedRoute];

      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    const response = NextResponse.next();
    response.headers.set('x-user-role', userRole);
    return response;

  } catch (error) {
    // 3. If Token is INVALID or EXPIRED:
    
    // Allow access to public routes and clear stale authentication cookies
    if (isPublicRoute) {
      const response = NextResponse.next();
      response.cookies.delete('access_token');
      response.cookies.delete('token');
      response.cookies.delete('role');
      return response;
    }

    // Redirect unauthenticated users to /login and flush invalid cookies
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const response = NextResponse.redirect(loginUrl);

    response.cookies.delete('access_token');
    response.cookies.delete('token');
    response.cookies.delete('role');

    return response;
  }
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/reports/:path*',
    '/login',
  ],
};