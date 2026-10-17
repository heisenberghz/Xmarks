# 𝕏 Bookmarks Manager — Chrome Extension & Dashboard (v1.1)

All-in-one personal Chrome Extension with **Live Auto-Capture**, **Built-in Visual Dashboard**, and **Bulk Timeline Scraper** for your X (Twitter) bookmarks.

---

## 🚀 Features

1. **Integrated Offline Dashboard**:
   - The entire React + Tailwind web app runs directly inside the extension (`chrome-extension://...`).
   - Open as a **Full-Screen Tab** or in the **Chrome Side Panel** alongside Twitter.
   - **Zero terminal or dev servers needed.**
2. **⚡ Live Auto-Capture**:
   - When browsing on `x.com`, clicking the native **Bookmark** button (or pressing <kbd>B</kbd>) automatically captures the tweet and saves it straight into your manager database.
   - Shows a subtle, sleek confirmation toast: `🔖 Saved to X Bookmarks Manager`.
3. **🔄 Live Direct Sync & Bulk Scraper**:
   - Bulk scrapes your entire bookmark timeline from `x.com/i/bookmarks`.
   - Directly saves all bookmarks into the local database without manual file uploads, while also saving a `.json` backup.
4. **Private & Local-First**:
   - All bookmarks, notes, and tags stay stored locally in your browser's IndexedDB.

---

## 🛠️ How to Load into Chrome (Takes 30 Seconds)

1. Open Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** to **ON** (top right corner).
3. Click **Load unpacked** (top left corner).
4. Select the `D:\X bookmarks manager\extension` directory.
5. Click the puzzle icon (🧩) in your Chrome toolbar and **pin** the **X Bookmarks Manager** icon.

---

## 💡 Everyday Usage

### 1. View & Search Bookmarks (No Terminal Needed!)
- Click the extension icon in Chrome.
- Click **"🚀 Open Full Dashboard"** (or **"📑 Open in Side Panel"**).
- Your full Masonry Grid, search bar, tags, and notes editor open instantly!

### 2. Auto-Capture Tweets While Browsing
- Browse normally on `x.com`.
- Whenever you see a tweet you like, click the **Bookmark** ribbon button (or press <kbd>B</kbd>).
- It is saved directly to your local library!

### 3. Bulk Sync Your Entire Library
- Navigate to [https://x.com/i/bookmarks](https://x.com/i/bookmarks).
- Click the extension icon → **"Scrape Bookmarks Page"**.
- Watch the live counter. When done, your library is fully populated and synchronized!

---

## 🧪 Automated Tests

Run the full automated test suite (58 unit & DOM tests):
```bash
npm test
```
