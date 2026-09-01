import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; action: string }> }
) {
  // In Next.js 15+, params is a Promise and must be awaited.
  const { id, action } = await context.params;

  const backendUrl = (
    process.env.BACKEND_API_URL || "http://127.0.0.1:5000/v1"
  ).replace(/\/$/, "");

  // Retrieve the token from the HttpOnly cookie, aligning with our general BFF proxy standard.
  const token = request.cookies.get("access_token")?.value;
  
  const headers = new Headers(request.headers);
  headers.delete("host");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Safely extract the request body.
  let body: string | undefined = undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const response = await fetch(`${backendUrl}/tasks/${id}/${action}`, {
      method: "PATCH",
      headers,
      body,
      cache: "no-store",
    });

    const responseBody = await response.text();

    const res = new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });

    // Forward any Set-Cookie headers coming from the backend to the browser.
    const rawSetCookies = response.headers.getSetCookie();
    if (rawSetCookies && rawSetCookies.length > 0) {
      rawSetCookies.forEach((cookieStr) => {
        res.headers.append("set-cookie", cookieStr);
      });
    }

    return res;
  } catch (error) {
    console.error(`Task Action Proxy Error for task ${id}/${action}:`, error);
    return NextResponse.json(
      { error: "Task action proxy forwarding error" },
      { status: 502 }
    );
  }
}