'use client';

import { useEffect } from 'react';
import { flushQueue } from '@/services/syncService';

export default function NetworkSyncListener() {
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Cihaz tekrar online oldu, senkronizasyon başlatılıyor...');
      flushQueue();
    };

    window.addEventListener('online', handleOnline);

    if (navigator.onLine) {
      flushQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null; 
}