import { getQueue, removeFromQueue, QueueItem } from './db';

let isFlushing = false;

export async function flushQueue(): Promise<void> {
  // Eğer şu an zaten bir flush işlemi yürütülüyorsa tekrar çalıştırma
  if (isFlushing) {
    console.log('[Sync] Senkronizasyon zaten devam ediyor...');
    return;
  }

  // Tarayıcı çevrimdışıysa hiç başlama
  if (!navigator.onLine) {
    console.log('[Sync] Cihaz çevrimdışı, kuyruk gönderilemiyor.');
    return;
  }

  isFlushing = true;

  try {
    const queue: QueueItem[] = await getQueue();

    if (queue.length === 0) {
      console.log('[Sync] Kuyrukta bekleyen istek yok.');
      return;
    }

    console.log(`[Sync] ${queue.length} adet bekleyen istek senkronize ediliyor...`);

    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.payload),
        });

        if (response.ok) {
          if (item.id !== undefined) {
            await removeFromQueue(item.id);
            console.log(`[Sync] İstek #${item.id} başarıyla gönderildi ve silindi.`);
          }
        } else if (response.status >= 400 && response.status < 500) {
          console.error(`[Sync] İstek geçersiz veya reddedildi (Status: ${response.status}). Kuyruktan siliniyor.`);
          if (item.id !== undefined) {
            await removeFromQueue(item.id);
          }
        } else {
          console.error(`[Sync] Sunucu hatası (Status: ${response.status}). Tekrar denenecek.`);
          break;
        }
      } catch (networkError) {
        console.error('[Sync] Ağ hatası nedeniyle senkronizasyon durduruldu:', networkError);
        break;
      }
    }
  } catch (error) {
    console.error('[Sync] Kuyruk okunurken veya işlenirken bir hata oluştu:', error);
  } finally {
    isFlushing = false;
  }
}

export function initBackgroundSync(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    if (navigator.onLine) {
      console.log('[Sync] Ağ bağlantısı sağlandı. Otomatik senkronizasyon başlatılıyor...');
      flushQueue();
    }
  };

  // Dinleyiciyi ekle
  window.addEventListener('online', handleOnline);

  // Uygulama açılışında internet varsa doğrudan kontrol et
  if (navigator.onLine) {
    flushQueue();
  }

  // Unmount durumunda temizlemek için unsubscribe döndür
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}