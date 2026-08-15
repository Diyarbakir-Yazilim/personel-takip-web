import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string; action: string } }
) {
  const { id, action } = context.params;
  const backendUrl = (
    process.env.BACKEND_API_URL || "http://localhost:5000/v1"
  ).replace(/\/$/, "");

  const authorization = request.headers.get("authorization");
  const body = await request.text();

  const response = await fetch(`${backendUrl}/tasks/${id}/${action}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: body,
    cache: "no-store",
  });

  const responseBody = await response.text();

  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      "content-type":
        response.headers.get("content-type") || "application/json",
    },
  });
}
