/**
 * Chrome Extension Service Worker (Manifest V3)
 * Handles file downloads requested by content script.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    return true; // Keep channel open for async response
  }
});
