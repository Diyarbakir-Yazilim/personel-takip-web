import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const res = await fetch(`${backendUrl}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Profil bilgileri alınamadı.' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    
    const res = await fetch(`${backendUrl}/auth/profile`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Profil güncellenemedi.' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const response = NextResponse.json(data);

    const newToken = data.access_token || data.accessToken;
    const newRefreshToken = data.refresh_token || data.refreshToken;

    if (newToken) {
      response.cookies.set({
        name: 'access_token',
        value: newToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60,
      });
    }

    if (newRefreshToken) {
      response.cookies.set({
        name: 'refresh_token',
        value: newRefreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 3 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message || 'Sunucu hatası.' },
      { status: 500 }
    );
  }
}