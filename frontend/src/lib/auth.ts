/**
 * Shared auth token helper.
 *
 * Reads the JWT from localStorage (primary) or the `token` cookie (fallback).
 * The token is intentionally NEVER persisted inside IndexedDB queue records:
 * queued offline actions are replayed with a token read at flush time,
 * so a rotated/refreshed token is always used and no credential is
 * duplicated into another storage medium.
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;

  const localToken =
    window.localStorage.getItem('access_token') ||
    window.localStorage.getItem('token');

  if (localToken) return localToken;

  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
