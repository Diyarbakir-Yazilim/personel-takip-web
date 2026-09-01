import { NextRequest, NextResponse } from 'next/server';

async function handleProxy(request: NextRequest) {
  // Extract target route path (e.g. /api/proxy/auth/profile -> auth/profile)
  const path = request.nextUrl.pathname.replace('/api/proxy/', '');
  const backendUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:5000/v1';
  const targetUrl = `${backendUrl}/${path}`;

  // Retrieve token from HttpOnly cookie (çerez adını access_token yaptık)
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
    
    const response = new NextResponse(data, {
      status: backendRes.status,
      headers: {
        'Content-Type': backendRes.headers.get('Content-Type') || 'application/json',
      },
    });

    // Backend'den gelen Set-Cookie başlıklarını da tarayıcıya iletelim
    const rawSetCookies = backendRes.headers.getSetCookie();
    if (rawSetCookies && rawSetCookies.length > 0) {
      rawSetCookies.forEach((cookieStr) => {
        response.headers.append('set-cookie', cookieStr);
      });
    }

    return response;
  } catch (error) {
    console.error('BFF Proxy Error for path:', path, error);
    return NextResponse.json(
      { error: 'BFF Proxy forwarding error' },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;