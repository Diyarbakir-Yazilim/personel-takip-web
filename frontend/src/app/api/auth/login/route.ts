import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[BFF Login] Request body:', body);

    // Forward login payload to NestJS backend
    const backendRes = await fetch('http://localhost:5000/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('[BFF Login] Backend status:', backendRes.status);

    const contentType = backendRes.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await backendRes.json();
    } else {
      const rawText = await backendRes.text();
      console.error('[BFF Login] Backend returned non-JSON response:', rawText);
      return NextResponse.json(
        { error: 'Backend did not return JSON', raw: rawText },
        { status: 502 }
      );
    }

    if (!backendRes.ok) {
      console.log('[BFF Login] Backend returned error structure:', data);
      return NextResponse.json(data, { status: backendRes.status });
    }

    // Extract access_token from backend response
    const token = data.access_token;

    // Prepare response returning user details to client
    const response = NextResponse.json({
      success: true,
      user: data.user,
    });

    // Store token securely in an HttpOnly cookie
    if (token) {
      response.cookies.set('access_token', token, {
        httpOnly: true, // Prevents client-side JS access (XSS mitigation)
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day lifetime
      });
    }

    return response;
  } catch (error: any) {
    console.error('[BFF Login] Unhandled error caught:', error);
    return NextResponse.json(
      { error: 'BFF Login internal server error', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}