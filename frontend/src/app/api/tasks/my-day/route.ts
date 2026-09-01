import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const backendUrl = (
    process.env.BACKEND_API_URL || "http://127.0.0.1:5000/v1"
  ).replace(/\/$/, "");

  // Retrieve token from cookies with fallback to authorization header
  const token = request.cookies.get('access_token')?.value || request.cookies.get('token')?.value;
  
  const headers = new Headers(request.headers);
  headers.delete("host");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${backendUrl}/tasks/my-day`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const body = await response.text();

    const res = new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });

    // Forward any Set-Cookie headers coming from the backend to the browser
    const rawSetCookies = response.headers.getSetCookie();
    if (rawSetCookies && rawSetCookies.length > 0) {
      rawSetCookies.forEach((cookieStr) => {
        res.headers.append("set-cookie", cookieStr);
      });
    }

    return res;
  } catch (error) {
    console.error("My-Day Tasks Proxy Error:", error);
    return NextResponse.json(
      { error: "My-day tasks proxy forwarding error" },
      { status: 502 }
    );
  }
}