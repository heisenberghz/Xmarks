/**
 * Chrome Extension Service Worker (Manifest V3)
 * Handles file downloads, live bookmark persistence into IndexedDB,
 * cross-tab synchronization, and dashboard launching.
 */

const DB_NAME = 'x_bookmarks_db';
const DB_VERSION = 1;
const STORE_NAME = 'bookmarks';

function openDB() {
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

async function saveLiveBookmark(raw) {
  if (!raw || !raw.id) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(String(raw.id));

    getReq.onsuccess = () => {
      const existing = getReq.result;
      const nowIso = new Date().toISOString();
      let recordToSave;

      if (existing) {
        recordToSave = {
          ...existing,
          text: raw.text || existing.text,
          author_name: raw.author_name || existing.author_name,
          author_handle: raw.author_handle || existing.author_handle,
          avatar_url: raw.avatar_url || existing.avatar_url,
          media: Array.isArray(raw.media) && raw.media.length > 0 ? raw.media : existing.media,
        };
      } else {
        recordToSave = {
          id: String(raw.id).trim(),
          text: raw.text || '',
          author_name: raw.author_name || '',
          author_handle: raw.author_handle || '',
          avatar_url: raw.avatar_url || '',
          timestamp: raw.timestamp || nowIso,
          url: raw.url || `https://x.com/i/status/${raw.id}`,
          media: Array.isArray(raw.media) ? raw.media : [],
          tags: Array.isArray(raw.tags) ? raw.tags : [],
          notes: raw.notes || '',
          imported_at: nowIso,
          order: Date.now(),
        };
      }

      store.put(recordToSave);
      tx.oncomplete = () => {
        // Broadcast to open dashboard tabs
        chrome.runtime
          .sendMessage({ action: 'LIVE_BOOKMARK_ADDED', bookmark: recordToSave })
          .catch(() => {});
        resolve(recordToSave);
      };
      tx.onerror = () => reject(tx.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

async function saveBatchDirectly(bookmarks) {
  if (!Array.isArray(bookmarks) || bookmarks.length === 0) return 0;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const nowIso = new Date().toISOString();
    let count = 0;

    for (let i = 0; i < bookmarks.length; i++) {
      const raw = bookmarks[i];
      if (!raw || !raw.id) continue;
      const item = {
        id: String(raw.id).trim(),
        text: raw.text || '',
        author_name: raw.author_name || '',
        author_handle: raw.author_handle || '',
        avatar_url: raw.avatar_url || '',
        timestamp: raw.timestamp || nowIso,
        url: raw.url || `https://x.com/i/status/${raw.id}`,
        media: Array.isArray(raw.media) ? raw.media : [],
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        notes: raw.notes || '',
        imported_at: raw.imported_at || nowIso,
        order: raw.order !== undefined ? raw.order : Date.now() - i,
      };
      store.put(item);
      count++;
    }

    tx.oncomplete = () => {
      chrome.runtime
        .sendMessage({ action: 'BOOKMARKS_BATCH_SYNCED', count })
        .catch(() => {});
      resolve(count);
    };
    tx.onerror = () => reject(tx.error);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 1. JSON File Download (fallback / backup)
  if (message.action === 'DOWNLOAD_JSON') {
    const filename = message.filename || `bookmarks-export-${Date.now()}.json`;
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(message.jsonContent);

    chrome.downloads.download(
      {
        url: dataUrl,
        filename: filename,
        saveAs: false,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Download error:', chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('[Background] Download started with ID:', downloadId);
          sendResponse({ success: true, downloadId });
        }
      }
    );
    return true;
  }

  // 2. Live Capture: Save single bookmarked tweet
  if (message.action === 'LIVE_BOOKMARK_CAPTURED') {
    saveLiveBookmark(message.tweet)
      .then((saved) => sendResponse({ success: true, bookmark: saved }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // 3. Batch Sync: Save multiple bookmarks directly from scraper
  if (message.action === 'SYNC_BOOKMARKS_BATCH') {
    saveBatchDirectly(message.bookmarks)
      .then((count) => sendResponse({ success: true, count }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // 4. Open Full Dashboard Tab
  if (message.action === 'OPEN_DASHBOARD') {
    const dashboardUrl = chrome.runtime.getURL('dashboard/index.html');
    chrome.tabs.query({}, (tabs) => {
      const existingTab = tabs.find((t) => t.url && t.url.startsWith(dashboardUrl));
      if (existingTab && existingTab.id) {
        chrome.tabs.update(existingTab.id, { active: true });
        if (existingTab.windowId) {
          chrome.windows.update(existingTab.windowId, { focused: true });
        }
        sendResponse({ success: true, tabId: existingTab.id });
      } else {
        chrome.tabs.create({ url: dashboardUrl }, (newTab) => {
          sendResponse({ success: true, tabId: newTab.id });
        });
      }
    });
    return true;
  }

  // 5. Open Side Panel
  if (message.action === 'OPEN_SIDE_PANEL') {
    if (chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentWindowId = tabs[0]?.windowId;
        if (currentWindowId) {
          chrome.sidePanel.open({ windowId: currentWindowId }, () => {
            sendResponse({ success: true });
          });
        } else {
          sendResponse({ success: false, error: 'No active window found' });
        }
      });
      return true;
    } else {
      // Fallback to full tab if side panel API is unavailable
      const dashboardUrl = chrome.runtime.getURL('dashboard/index.html');
      chrome.tabs.create({ url: dashboardUrl });
      sendResponse({ success: true, fallback: true });
      return true;
    }
  }
});
