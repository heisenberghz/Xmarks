import { Bookmark } from '../types/bookmark';
import { sortBookmarks } from '../lib/search';

const DB_NAME = 'x_bookmarks_db';
const DB_VERSION = 1;
const STORE_NAME = 'bookmarks';

export function openBookmarksDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('imported_at', 'imported_at', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllBookmarksFromDB(): Promise<Bookmark[]> {
  const db = await openBookmarksDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const rawList = request.result as Bookmark[];
      const list = sortBookmarks(rawList, 'bookmarked');
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveBookmarkToDB(bookmark: Bookmark): Promise<void> {
  const db = await openBookmarksDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(bookmark);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveBookmarksBatchToDB(bookmarks: Bookmark[]): Promise<void> {
  if (bookmarks.length === 0) return;
  const db = await openBookmarksDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const item of bookmarks) {
      store.put(item);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteBookmarkFromDB(id: string): Promise<void> {
  const db = await openBookmarksDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
