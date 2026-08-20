import { addToQueue } from './db';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  // Try to get token from cookies
  const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
  if (match) return match[2];
  // Fallback to localStorage
  return localStorage.getItem("token");
}

export function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  return baseUrl ? baseUrl.replace(/\/$/, "") : "/api/proxy";
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ success: boolean; data?: T; queued?: boolean }> {
  const method = options.method || 'GET';
  const payload = options.body;
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!headers.has("Content-Type") && payload && typeof payload !== "string") {
    headers.set("Content-Type", "application/json");
  }

  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  // 1. Cihaz halihazırda offline ise doğrudan IndexedDB kuyruğuna yaz (Sadece mutasyonlar için)
  if (!navigator.onLine && method !== 'GET') {
    console.log('[API] Cihaz çevrimdışı, istek kuyruğa ekleniyor:', url);
    await addToQueue({ url, method: method as 'POST' | 'PUT' | 'DELETE' | 'PATCH', payload: payload as Record<string, unknown> });
    return { success: true, queued: true };
  }

  // 2. Cihaz online ise isteği sunucuya atmayı dene
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { body: _body, ...restOptions } = options;
    const fetchOptions: RequestInit = {
      ...restOptions,
      method,
      headers,
    };
    if (payload) {
        fetchOptions.body = typeof payload === "string" ? payload : JSON.stringify(payload);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorMessage = `HTTP Hata kodu: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = Array.isArray(errorData.message) ? errorData.message.join(", ") : errorData.message;
        }
      } catch (e) {}
      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return { success: true };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    // 3. Ağ aniden koptuysa isteği yakala ve yine kuyruğa yaz (Sadece mutasyonlar için)
    if (method !== 'GET') {
        console.warn('[API] Ağ hatası alındı, istek kuyruğa yedekleniyor:', error);
        await addToQueue({ url, method: method as 'POST' | 'PUT' | 'DELETE' | 'PATCH', payload: payload as Record<string, unknown> });
        return { success: true, queued: true };
    }
    throw error;
  }
}