import { NextRequest, NextResponse } from 'next/server';

async function handleProxy(request: NextRequest) {
  // Extract target route path (e.g. /api/proxy/auth/profile -> auth/profile)
  const path = request.nextUrl.pathname.replace('/api/proxy/', '');
  const targetUrl = `http://localhost:5000/v1/${path}`;

  // Retrieve access_token from HttpOnly cookie
  const token = request.cookies.get('access_token')?.value;

  const headers = new Headers(request.headers);
  headers.delete('host');

  // Inject Authorization Bearer header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
    });

    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      headers: {
        'Content-Type': backendRes.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'BFF Proxy forwarding error' },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;