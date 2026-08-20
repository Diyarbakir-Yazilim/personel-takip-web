'use client';

import { useEffect } from 'react';
import { initBackgroundSync } from '@/services/syncService';

/**
 * Mounts the single background-sync registration for the whole app.
 * All listener logic lives in syncService.initBackgroundSync so the
 * trigger set (online / queue-changed / initial) has one owner.
 */
export default function NetworkSyncListener() {
  useEffect(() => initBackgroundSync(), []);

  return null;
}
