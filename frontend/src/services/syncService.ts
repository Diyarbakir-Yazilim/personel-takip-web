/**
 * Background synchronization of the `pending_scans` IndexedDB queue.
 *
 * Replay rules (per record, FIFO order):
 * - 2xx -> success, remove from queue.
 * - 401 -> token expired/invalid: STOP the whole flush. Records are
 *          kept and replayed after the user re-authenticates.
 * - other 4xx -> permanent rejection. The record is DROPPED so a single
 *                poison message can never block the rest of the queue.
 * - 5xx -> transient server error: increment `attempts`, stop this
 *          cycle, retry on the next one. After MAX_ATTEMPTS the
 *          record is dropped as a dead letter.
 * - network error -> stop this cycle silently; the `online` listener
 *                    will trigger the next attempt.
 */

import {
  getPendingScans,
  removePendingScan,
  updatePendingScan,
  QUEUE_CHANGED_EVENT,
  QUEUE_FLUSHED_EVENT,
  type PendingScan,
} from './db';

import { getStoredToken } from '@/lib/auth';

const MAX_ATTEMPTS = 8;

let isFlushing = false;

export async function flushQueue(): Promise<void> {
  if (isFlushing) return;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }

  const token = getStoredToken();

  if (!token) {
    // Without a token every replay would 401; wait for a session.
    return;
  }

  isFlushing = true;

  let drainedAny = false;

  try {
    const queue: PendingScan[] = await getPendingScans();

    if (queue.length === 0) {
      return;
    }

    console.log(
      `[Sync] ${queue.length} bekleyen kayıt senkronize ediliyor...`,
    );

    for (const item of queue) {
      if (item.id === undefined) continue;

      let response: Response;

      try {
        response = await fetch(item.url, {
          method: item.method,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.payload),
        });
      } catch (networkError) {
        console.warn(
          '[Sync] Ağ hatası, senkronizasyon durduruldu:',
          networkError,
        );

        break;
      }

      /*
       * 2xx
       * Başarılı işlem -> kaydı kuyruktan kaldır.
       */
      if (response.ok) {
        await removePendingScan(item.id);

        drainedAny = true;

        console.log(
          `[Sync] İstek #${item.id} başarıyla gönderildi ve silindi.`,
        );

        continue;
      }

      /*
       * 401
       * Token geçersiz -> kaydı SİLME.
       * Tüm flush işlemini durdur.
       */
      if (response.status === 401) {
        console.warn(
          '[Sync] Oturum geçersiz (401), senkronizasyon durduruldu.',
        );

        break;
      }

      /*
       * Diğer 4xx
       * Kalıcı hata -> kaydı kuyruktan kaldır.
       */
      if (response.status >= 400 && response.status < 500) {
        console.warn(
          `[Sync] Kayıt #${item.id} sunucu tarafından reddedildi (${response.status}), kuyruktan çıkarıldı.`,
        );

        await removePendingScan(item.id);

        drainedAny = true;

        continue;
      }

      /*
       * 5xx
       * Geçici sunucu hatası -> attempts artır.
       */
      if (response.status >= 500) {
        const attempts = item.attempts + 1;

        if (attempts >= MAX_ATTEMPTS) {
          console.error(
            `[Sync] Kayıt #${item.id} ${MAX_ATTEMPTS} denemede gönderilemedi, kuyruktan çıkarıldı.`,
          );

          await removePendingScan(item.id);

          drainedAny = true;
        } else {
          await updatePendingScan(item.id, {
            attempts,
          });

          console.warn(
            `[Sync] Sunucu hatası (${response.status}), sonraki döngüde tekrar denenecek.`,
          );
        }

        // FIFO: bu kayıt başarısız olduysa sonraki kayıtları
        // aynı döngüde göndermiyoruz.
        break;
      }

      /*
       * Beklenmeyen HTTP status.
       * Güvenli tarafta kalıp bu döngüyü durdur.
       */
      console.warn(
        `[Sync] Beklenmeyen HTTP status: ${response.status}. Senkronizasyon durduruldu.`,
      );

      break;
    }
  } catch (error) {
    console.error('[Sync] Kuyruk işlenirken hata oluştu:', error);
  } finally {
    isFlushing = false;

    if (drainedAny && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(QUEUE_FLUSHED_EVENT),
      );
    }
  }
}

/**
 * Single registration point for background sync triggers:
 * - browser regains connectivity (`online`)
 * - a new record is queued while the browser is actually online
 * - initial mount with connectivity
 *
 * Returns an unsubscribe function for React effect cleanup.
 */
export function initBackgroundSync(): () => void {
  if (typeof window === 'undefined') {
    return () => { };
  }

  const handleOnline = () => {
    console.log(
      '[Sync] Bağlantı sağlandı, senkronizasyon başlatılıyor...',
    );

    void flushQueue();
  };

  const handleQueueChanged = () => {
    if (navigator.onLine) {
      void flushQueue();
    }
  };

  window.addEventListener('online', handleOnline);

  window.addEventListener(
    QUEUE_CHANGED_EVENT,
    handleQueueChanged,
  );

  if (navigator.onLine) {
    void flushQueue();
  }

  return () => {
    window.removeEventListener('online', handleOnline);

    window.removeEventListener(
      QUEUE_CHANGED_EVENT,
      handleQueueChanged,
    );
  };
}