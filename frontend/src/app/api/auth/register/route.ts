import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000/v1';
    const backendRes = await fetch(`${backendUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const contentType = backendRes.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await backendRes.json();
    } else {
      const rawText = await backendRes.text();
      return NextResponse.json(
        { error: 'Backend did not return JSON', raw: rawText },
        { status: 502 }
      );
    }

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'BFF Register internal server error', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}