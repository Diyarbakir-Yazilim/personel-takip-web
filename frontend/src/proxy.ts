import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('role')?.value;

  const { pathname } = request.nextUrl;

 
  if (pathname.startsWith('/admin')) {
 
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }


    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}


export const config = {
  matcher: ['/admin/:path*'],
};