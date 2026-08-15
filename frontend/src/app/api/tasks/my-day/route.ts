import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const backendUrl = (
    process.env.BACKEND_API_URL || "http://localhost:5000/v1"
  ).replace(/\/$/, "");

  const authorization = request.headers.get("authorization");

  const response = await fetch(`${backendUrl}/tasks/my-day`, {
    headers: authorization ? { Authorization: authorization } : {},
    cache: "no-store",
  });

  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type":
        response.headers.get("content-type") || "application/json",
    },
  });
}
