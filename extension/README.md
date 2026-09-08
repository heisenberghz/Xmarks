# X (Twitter) Bookmarks Exporter — Phase 1

This folder contains the **Component 1 (Scraper & Exporter)** implementation of the X Bookmarks Manager.

---

## Method A: Standalone Console Scraper (Fastest, zero installation)

If you want to quickly scrape and download your bookmarks right now:

1. In Google Chrome, go to [https://x.com/i/bookmarks](https://x.com/i/bookmarks).
2. Ensure you are logged in and your bookmarks are displayed.
3. Open Chrome DevTools (`F12` or `Ctrl + Shift + I` / `Cmd + Option + I`).
4. Switch to the **Console** tab.
5. Copy the entire contents of [`extension/standalone/console-scraper.js`](./standalone/console-scraper.js) and paste it into the Console, then press **Enter**.
6. The script will scroll humanly, harvest visible tweets, deduplicate, and display live counts:
   ```
   [X Bookmarks Scraper] +12 new bookmarks (Total: 48)
   ```
7. When it reaches the end (or if you run `window.__X_SCRAPER__.stop()`), Chrome will automatically download `bookmarks-export-<timestamp>.json`.

---

## Method B: Load Chrome Extension (Manifest V3)

1. Open Chrome and go to `chrome://extensions/`.
2. Toggle **Developer mode** ON (in the top right corner).
3. Click **Load unpacked** (top left).
4. Select the `D:\X bookmarks manager\extension` directory.
5. Navigate to [https://x.com/i/bookmarks](https://x.com/i/bookmarks).
6. Click the extension icon in your Chrome toolbar.
7. Click **Scrape Bookmarks**.
8. You can close the popup while it scrapes — progress continues in the background. Reopening the popup will show the live count.
9. Click **Stop & Export** (or wait for it to finish) to download your bookmarks JSON.

---

## Automated Tests

To run the automated DOM and extractor tests:
```bash
npm test
```
All 14 unit tests cover:
- Text tweet parsing (`@handle`, display name, tweet ID, ISO timestamp)
- Multi-photo tweet parsing
- Video poster thumbnail extraction
- Quoted tweet separation (preventing handle/permalink clobbering)
- Rate-limit and login prompt detection
- Virtual scroll unmounting and deduplication logic
- Manifest V3 structure and permission validation
