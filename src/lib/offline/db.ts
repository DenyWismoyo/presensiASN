import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PresensiDB extends DBSchema {
  offlineMutations: {
    key: string;
    value: {
      id: string;
      actionName: 'checkIn' | 'checkOut' | 'submitLKH';
      payload: any;
      timestamp: number;
      retryCount: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<PresensiDB>> | null = null;

export function getDB() {
  if (!dbPromise && typeof window !== 'undefined') {
    dbPromise = openDB<PresensiDB>('PresensiOfflineDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('offlineMutations')) {
          const store = db.createObjectStore('offlineMutations', { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Menyimpan request mutasi ke dalam IndexedDB untuk diproses nanti
 */
export async function enqueueOfflineMutation(
  actionName: 'checkIn' | 'checkOut' | 'submitLKH',
  payload: any
) {
  const db = await getDB();
  if (!db) return;

  const id = crypto.randomUUID();
  await db.put('offlineMutations', {
    id,
    actionName,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
  });
  console.log(`[Offline Queue] Mutation ${actionName} tersimpan dengan ID ${id}`);
}

/**
 * Mengambil dan menghapus seluruh mutasi dari antrian (FIFO)
 */
export async function dequeueAllMutations() {
  const db = await getDB();
  if (!db) return [];

  const tx = db.transaction('offlineMutations', 'readwrite');
  const store = tx.objectStore('offlineMutations');
  const items = await store.getAll();
  
  if (items.length > 0) {
    await store.clear();
  }
  
  // Urutkan berdasarkan waktu paling lama
  return items.sort((a, b) => a.timestamp - b.timestamp);
}
