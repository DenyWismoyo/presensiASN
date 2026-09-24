import { useEffect, useState } from 'react';
import { dequeueAllMutations, enqueueOfflineMutation } from '@/lib/offline/db';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = async () => {
      setIsOnline(true);
      await syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount just in case
    if (navigator.onLine) {
      syncOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineQueue = async () => {
    if (isSyncing || typeof window === 'undefined') return;
    
    setIsSyncing(true);
    try {
      const pendingMutations = await dequeueAllMutations();
      
      if (pendingMutations.length === 0) {
        setIsSyncing(false);
        return;
      }
      
      console.log(`[Offline Sync] Mencoba mengirim ${pendingMutations.length} antrian mutasi...`);
      
      for (const mutation of pendingMutations) {
        try {
          // Gunakan API endpoint sinkronisasi karena Server Actions sulit di-invoke dinamis dari client side queue
          const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              actionName: mutation.actionName,
              payload: mutation.payload,
            }),
          });
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            // 5xx biasanya kesalahan jaringan / server mati, 4xx biasanya kesalahan validasi bisnis (jgn loop terus)
            if (res.status >= 500) {
              throw new Error("Server error, will retry later");
            } else {
              console.warn(`[Offline Sync] Ditolak oleh bisnis logic (${mutation.actionName}):`, errorData);
            }
          } else {
            console.log(`[Offline Sync] Berhasil: ${mutation.actionName}`);
          }
        } catch (error) {
          console.error(`[Offline Sync] Gagal sinkronisasi ${mutation.actionName}:`, error);
          // Jika murni masalah jaringan (bukan ditolak server), antrikan lagi
          await enqueueOfflineMutation(mutation.actionName, mutation.payload);
        }
      }
      console.log("[Offline Sync] Selesai sinkronisasi.");
    } finally {
      setIsSyncing(false);
    }
  };

  return { isOnline, isSyncing, syncOfflineQueue };
}
