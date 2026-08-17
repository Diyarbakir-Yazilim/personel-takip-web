/**
 * Offline-aware API client for task actions (start / complete / flag).
 *
 * Interception strategy:
 * 1. Device already offline           -> write to IndexedDB `pending_scans`,
 *                                        report `queued: true` so the UI can
 *                                        apply an optimistic update.
 * 2. Online, request succeeds         -> return server data as usual.
 * 3. Online, fetch REJECTS (network
 *    dropped mid-flight, DNS, etc.)   -> queue exactly like case 1.
 * 4. Online, server responds 4xx/5xx  -> throw ApiError. A real server
 *    rejection (invalid transition, auth, validation) must surface to the
 *    user instead of being silently queued and replayed forever.
 */

import { addPendingScan, type PendingScanAction } from './db';
import { getStoredToken } from '@/lib/auth';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface TaskActionResult<T = unknown> {
  /** true when the action was stored locally instead of reaching the server. */
  queued: boolean;
  data?: T;
}

export function buildTaskActionUrl(taskId: string, action: PendingScanAction): string {
  return API_BASE_URL
    ? `${API_BASE_URL}/tasks/${taskId}/${action}`
    : `/api/tasks/${taskId}/${action}`;
}

function generateClientEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC4122-ish fallback for very old WebViews.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function queueTaskAction(
  taskId: string,
  action: PendingScanAction,
  payload: Record<string, unknown>,
): Promise<TaskActionResult<never>> {
  await addPendingScan({
    clientEventId: generateClientEventId(),
    taskId,
    action,
    url: buildTaskActionUrl(taskId, action),
    method: 'PATCH',
    payload,
    clientScannedAt: new Date().toISOString(),
  });

  return { queued: true };
}

export async function performTaskAction<T = unknown>(
  taskId: string,
  action: PendingScanAction,
  payload: Record<string, unknown> = {},
): Promise<TaskActionResult<T>> {
  const token = getStoredToken();
  if (!token) {
    throw new ApiError('Oturum açmanız gerekiyor.', 401);
  }

  // Case 1: known-offline device -> queue immediately (optimistic path).
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return queueTaskAction(taskId, action, payload);
  }

  try {
    const response = await fetch(buildTaskActionUrl(taskId, action), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Case 4: the server actively rejected the request -> surface the error.
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}) as { message?: string });
      throw new ApiError(
        errorData.message || `İşlem başarısız: ${response.statusText}`,
        response.status,
      );
    }

    const data = (await response.json()) as T;
    return { queued: false, data };
  } catch (error) {
    if (error instanceof ApiError) throw error;

    // Case 3: fetch itself rejected -> connection dropped mid-flight.
    console.warn('[API] Ağ hatası, istek çevrimdışı kuyruğa alındı:', error);
    return queueTaskAction(taskId, action, payload);
  }
}
