import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[BFF Login] Request body:', body);

    // Forward login payload to NestJS backend
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000/v1';
    const backendRes = await fetch(`${backendUrl}/auth/login`, {
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

    // Response objesini oluşturuyoruz
    const response = NextResponse.json({
      success: true,
      user: data.user,
    });

    // 1. Backend'den gelen Set-Cookie başlıklarını okuyalım
    const rawSetCookies = backendRes.headers.getSetCookie();
    if (rawSetCookies && rawSetCookies.length > 0) {
      rawSetCookies.forEach((cookieStr) => {
        response.headers.append('set-cookie', cookieStr);
      });
    }

    // 2. access_token değerini bul ve çereze yaz
    let accessTokenValue = data?.access_token || data?.token;

    if (!accessTokenValue && rawSetCookies) {
      const accessCookieStr = rawSetCookies.find((c) => c.startsWith('access_token='));
      if (accessCookieStr) {
        accessTokenValue = accessCookieStr.split(';')[0].split('=')[1];
      }
    }

    if (accessTokenValue) {
      response.cookies.set('access_token', accessTokenValue, {
        httpOnly: true,
        secure: false, // Localhost için false
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60, // 15 dakika
      });
    }

    // 3. REFRESH TOKEN EKLENDİ: refresh_token değerini bul ve çereze yaz
    let refreshTokenValue = data?.refresh_token;

    if (!refreshTokenValue && rawSetCookies) {
      const refreshCookieStr = rawSetCookies.find((c) => c.startsWith('refresh_token='));
      if (refreshCookieStr) {
        refreshTokenValue = refreshCookieStr.split(';')[0].split('=')[1];
      }
    }

    if (refreshTokenValue) {
      response.cookies.set('refresh_token', refreshTokenValue, {
        httpOnly: true,
        secure: false, // Localhost için false
        sameSite: 'lax',
        path: '/',
        maxAge: 3 * 24 * 60 * 60, // 3 gün (259200 saniye)
      });
    }

    // 4. Middleware yönlendirmesi ve rol kontrolü için role çerezi
    if (data?.user?.role) {
      response.cookies.set('role', String(data.user.role), {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 3 * 24 * 60 * 60,
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