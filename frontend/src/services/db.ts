/**
 * IndexedDB layer for the offline scan queue.
 *
 * Store: `pending_scans`
 * Each record represents ONE user action (task start/complete/flag) that was
 * performed while offline (or during a sudden network drop) and must be
 * replayed against the backend once connectivity is restored.
 *
 * Design notes:
 * - `clientEventId` is a client-generated UUID. The backend's batch-scan
 *   pipeline (POST /scans/batch) deduplicates on this value via Redis SETNX,
 *   so keeping it on every record makes a future migration to that endpoint
 *   a pure transport change.
 * - `attempts` supports poison-message handling in the sync service: a record
 *   that keeps failing with 5xx is eventually dropped instead of blocking the
 *   queue forever.
 * - Auth tokens are NEVER stored here (security): the sync service reads a
 *   fresh token at flush time.
 */

export type PendingScanAction = 'start' | 'complete' | 'flag';

export interface PendingScan {
  id?: number;
  /** Client-generated UUID used for idempotency / tracing. */
  clientEventId: string;
  taskId: string;
  action: PendingScanAction;
  /** Fully-resolved endpoint URL to replay against. */
  url: string;
  method: 'PATCH' | 'POST' | 'PUT' | 'DELETE';
  payload: Record<string, unknown>;
  /** ISO timestamp of the moment the user performed the action offline. */
  clientScannedAt: string;
  attempts: number;
  createdAt: number;
}

const DB_NAME = 'OfflineQueueDB';
const DB_VERSION = 2;
const STORE_NAME = 'pending_scans';
const LEGACY_STORE_NAME = 'outbox';

/** DOM event fired whenever the queue content changes (add/remove). */
export const QUEUE_CHANGED_EVENT = 'pending-scans-changed';
/** DOM event fired after a flush cycle that successfully drained records. */
export const QUEUE_FLUSHED_EVENT = 'pending-scans-flushed';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // v1 -> v2 migration: drop the generic legacy store.
      if (db.objectStoreNames.contains(LEGACY_STORE_NAME)) {
        db.deleteObjectStore(LEGACY_STORE_NAME);
      }

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by_taskId', 'taskId', { unique: false });
        store.createIndex('by_clientEventId', 'clientEventId', { unique: true });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      // If another tab upgrades the schema, release the connection.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

export function notifyQueueChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(QUEUE_CHANGED_EVENT));
  }
}

export async function addPendingScan(
  data: Omit<PendingScan, 'id' | 'attempts' | 'createdAt'>,
): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: Omit<PendingScan, 'id'> = {
      ...data,
      attempts: 0,
      createdAt: Date.now(),
    };

    const request = store.add(record);
    request.onsuccess = () => {
      notifyQueueChanged();
      resolve(request.result as number);
    };
    request.onerror = () => reject(request.error);
  });
}

/** Returns queue records in insertion (FIFO) order. */
export async function getPendingScans(): Promise<PendingScan[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => {
      const items = (request.result as PendingScan[]).sort(
        (a, b) => (a.id ?? 0) - (b.id ?? 0),
      );
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function removePendingScan(id: number): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).delete(id);

    request.onsuccess = () => {
      notifyQueueChanged();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/** Persists a partial update (currently used to increment `attempts`). */
export async function updatePendingScan(
  id: number,
  patch: Partial<PendingScan>,
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const existing = getRequest.result as PendingScan | undefined;
      if (!existing) {
        resolve();
        return;
      }

      const putRequest = store.put({ ...existing, ...patch, id });
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function countPendingScans(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
