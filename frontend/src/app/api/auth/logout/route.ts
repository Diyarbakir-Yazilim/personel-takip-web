import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access_token')?.value;

    // Backend'e logout isteğini ilet
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000/v1';
    
    await fetch(`${backendUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
      },
    }).catch(() => {});

    const response = NextResponse.json({ success: true });

    // Tarayıcıdaki TÜM auth çerezlerini eksiksiz temizle
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    response.cookies.delete('role');

    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'BFF Logout internal server error', details: (error as Error)?.message || String(error) },
      { status: 500 }
    );
  }
}