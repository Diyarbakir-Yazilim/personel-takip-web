import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value;

    // Backend'e logout isteğini ilet
    if (token) {
      const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000/v1';
      await fetch(`${backendUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => {});
    }

    const response = NextResponse.json({ success: true });

    // Tarayıcıdaki access_token cookie'sini temizle
    response.cookies.delete('access_token');

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'BFF Logout internal server error', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}