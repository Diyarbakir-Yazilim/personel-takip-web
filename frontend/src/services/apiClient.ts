/**
 * Offline-aware API client for task actions (start / complete / flag).
 *
 * Interception strategy:
 * 1. Device already offline -> write to IndexedDB `pending_scans`,
 *                            report `queued: true`.
 * 2. Online, request succeeds -> return server data as usual.
 * 3. Online, fetch REJECTS (network dropped mid-flight, DNS, etc.)
 *                            -> queue exactly like case 1.
 * 4. Online, server responds 4xx/5xx -> throw ApiError.
 *
 * A real server rejection must NOT be silently queued.
 */

import { addPendingScan } from "./db";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

type QueueMethod = "PATCH" | "POST" | "PUT" | "DELETE";

type QueueAction = "start" | "complete" | "flag";

export function getApiBaseUrl(): string {
  
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "";
  }
  return process.env.BACKEND_API_URL || "http://backend:5000/v1";
}

/**
 * Extract task information from:
 *
 * /tasks/:taskId/start
 * /tasks/:taskId/complete
 * /tasks/:taskId/flag
 *
 * Returns null for non-task endpoints.
 */
function getQueueMetadata(endpoint: string): {
  taskId: string;
  action: QueueAction;
} | null {
  const match = endpoint.match(
    /\/tasks\/([^/]+)\/(start|complete|flag)(?:\/)?$/,
  );

  if (!match) {
    return null;
  }

  return {
    taskId: decodeURIComponent(match[1]),
    action: match[2] as QueueAction,
  };
}

/**
 * Adds a failed task mutation to the offline queue.
 */
async function queueRequest(
  url: string,
  method: QueueMethod,
  payload: unknown,
  endpoint: string,
): Promise<void> {
  const metadata = getQueueMetadata(endpoint);

  if (!metadata) {
    throw new Error(
      "Bu istek offline kuyruğa eklenemiyor: taskId/action bilgisi bulunamadı.",
    );
  }

  await addPendingScan({
    clientEventId: crypto.randomUUID(),
    taskId: metadata.taskId,
    action: metadata.action,
    url,
    method,
    payload:
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {},
    clientScannedAt: new Date().toISOString(),
  });
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<{
  success: boolean;
  data?: T;
  queued?: boolean;
}> {
  const method = options.method || "GET";
  const payload = options.body;

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && payload && typeof payload !== "string") {
    headers.set("Content-Type", "application/json");
  }

  const baseUrl = getApiBaseUrl();

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  /**
   * GET is never placed into the offline queue.
   */
  const isMutation = method !== "GET";

  /**
   * 1. Device is already offline.
   */
  if (typeof navigator !== "undefined" && !navigator.onLine && isMutation) {
    console.log("[API] Cihaz çevrimdışı, istek kuyruğa ekleniyor:", url);

    await queueRequest(url, method as QueueMethod, payload, endpoint);

    return {
      success: true,
      queued: true,
    };
  }

  /**
   * Build fetch options.
   */
  const { body: _, ...restOptions } = options;

  const fetchOptions: RequestInit = {
    ...restOptions,
    method,
    headers,
    credentials: "include",
  };

  if (payload !== undefined && payload !== null) {
    fetchOptions.body =
      typeof payload === "string" ? payload : JSON.stringify(payload);
  }

  let response: Response;

  /**
   * IMPORTANT:
   * Only actual network/fetch errors are queued.
   *
   * HTTP 400/401/403/404/409/422/500 etc.
   * are NOT network errors and must NOT be queued.
   */
  try {
    response = await fetch(url, fetchOptions);
  } catch (error) {
    if (!isMutation) {
      throw error;
    }

    console.warn("[API] Ağ hatası alındı, istek kuyruğa yedekleniyor:", error);

    await queueRequest(url, method as QueueMethod, payload, endpoint);

    return {
      success: true,
      queued: true,
    };
  }

  /**
   * AUTO REFRESH TOKEN INTERCEPTOR (401 Handling)
   * If access token has expired (401), attempt to refresh it once and retry the original request.
   */
  if (response.status === 401 && !isRetry && !endpoint.includes("/auth/refresh")) {
    try {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        // Token refreshed successfully, retry the original request
        return apiRequest<T>(endpoint, options, true);
      }
    } catch (refreshError) {
      console.error("[API] Token yenileme isteği başarısız oldu:", refreshError);
    }
  }

  /**
   * Server actively rejected the request.
   *
   * DO NOT queue this request.
   */
  if (!response.ok) {
    let errorMessage = `HTTP Hata kodu: ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData?.message) {
        errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : String(errorData.message);
      }
    } catch {
      // Response may not contain JSON.
    }

    throw new Error(errorMessage);
  }

  /**
   * 204 No Content
   */
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return {
      success: true,
    };
  }

  /**
   * Normal successful response.
   */
  const data = (await response.json()) as T;

  return {
    success: true,
    queued: false,
    data,
  };
}