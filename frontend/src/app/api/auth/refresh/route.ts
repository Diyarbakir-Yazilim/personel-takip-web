import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Retrieve cookies (especially refresh_token) from the incoming request
    const cookieHeader = request.headers.get('cookie') || '';

    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000/v1';
    
    // 2. Forward the request to the backend's /auth/refresh endpoint
    const backendRes = await fetch(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader, // Forwarding the refresh token to the backend
      },
    });

    const contentType = backendRes.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await backendRes.json();
    } else {
      const rawText = await backendRes.text();
      return NextResponse.json(
        { error: 'Backend did not return JSON during refresh', raw: rawText },
        { status: 502 }
      );
    }

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    // 3. Prepare the successful response object
    const response = NextResponse.json({
      success: true,
      message: 'Token successfully refreshed',
    });

    // 4. Capture new Set-Cookie headers from the backend and proxy them to the browser
    const rawSetCookies = backendRes.headers.getSetCookie();
    if (rawSetCookies && rawSetCookies.length > 0) {
      rawSetCookies.forEach((cookieStr) => {
        response.headers.append('set-cookie', cookieStr);
      });
    }

    return response;
  } catch (error: any) {
    console.error('[BFF Refresh] Unhandled error:', error);
    return NextResponse.json(
      { error: 'BFF Refresh internal server error', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}