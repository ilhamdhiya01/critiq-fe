const DB_NAME = "critiq";
const DB_VERSION = 1;
const STORES = ["repos", "repo-scans"] as const;

type StoreName = (typeof STORES)[number];

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const withStore = async <T>(
  store: StoreName,
  mode: IDBTransactionMode,
  callback: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const request = callback(transaction.objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const dbOps = {
  getAll: <T>(store: StoreName): Promise<T[]> =>
    withStore(store, "readonly", (objectStore) => objectStore.getAll()),

  get: <T>(store: StoreName, id: string): Promise<T | undefined> =>
    withStore(store, "readonly", (objectStore) => objectStore.get(id)),

  put: <T>(store: StoreName, value: T): Promise<IDBValidKey> =>
    withStore(store, "readwrite", (objectStore) => objectStore.put(value)),

  delete: (store: StoreName, id: string): Promise<undefined> =>
    withStore(store, "readwrite", (objectStore) => objectStore.delete(id)),
};
