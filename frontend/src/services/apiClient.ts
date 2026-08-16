import { addToQueue } from './db';

interface RequestOptions {
  method?: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
}

export async function apiRequest<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<{ success: boolean; data?: T; queued?: boolean }> {
  const method = options.method || 'POST';
  const payload = (options.body as Record<string, unknown>) || {};

  // 1. Cihaz halihazırda offline ise doğrudan IndexedDB kuyruğuna yaz
  if (!navigator.onLine) {
    console.log('[API] Cihaz çevrimdışı, istek kuyruğa ekleniyor:', url);
    await addToQueue({ url, method, payload });
    return { success: true, queued: true };
  }

  // 2. Cihaz online ise isteği sunucuya atmayı dene
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Hata koda: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    // 3. Ağ aniden koptuysa isteği yakala ve yine kuyruğa yaz
    console.warn('[API] Ağ hatası alındı, istek kuyruğa yedekleniyor:', error);
    await addToQueue({ url, method, payload });
    return { success: true, queued: true };
  }
}