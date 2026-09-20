# 🔖 X Bookmarks Manager & Scraper

A private, zero-API-cost, local-first tool to export, organize, search, and annotate your X (Twitter) bookmarks in a Pinterest-style masonry interface.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React 18](https://img.shields.io/badge/React-18.3-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)
![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite)
![Chrome MV3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-green?logo=google-chrome)
![Tests](https://img.shields.io/badge/Tests-41%20passing-brightgreen)
![Local--First](https://img.shields.io/badge/Privacy-100%25%20Local--First-success)

---

## 📸 Screenshots

| Dark Mode (Elevated Surface & Silver Hairline) | Light Mode (Crisp High-Contrast Black Border) |
|:---:|:---:|
| ![Dark Mode](./screenshots/Screenshot%20(366).png) | ![Light Mode](./screenshots/Screenshot%20(368).png) |

---

## 💡 Why This Exists

- **X (Twitter) bookmark search is locked behind Premium subscriptions**, and the official X API charges prohibitive pricing ($100+/month for basic developer tiers).
- Your bookmarks represent years of curated knowledge: tutorials, code snippets, engineering discussions, design systems, and threads.
- **X Bookmarks Manager** gives you back 100% ownership:
  - 🔒 **Zero Telemetry & Zero Cloud Servers**: Data stays in your browser's local `IndexedDB`.
  - 💸 **Zero API Fees**: Extracts bookmarks directly from your authenticated browser session.
  - ⚡ **Lightning-Fast Offline Search**: Sub-millisecond instant fuzzy filtering across thousands of tweets.

---

## ✨ Features

- 📥 **Two Scraper Options**:
  - **Method A (Zero-install Console Script)**: Paste a single snippet into Chrome DevTools on `x.com/i/bookmarks` and watch it harvest and download your bookmarks.
  - **Method B (Chrome Extension MV3)**: Load unpacked extension, click **Scrape Bookmarks**, monitor live progress in the popup, and download a clean JSON export.
- 📌 **Pinterest-Style Masonry Grid**:
  - Custom responsive multi-column masonry layout (`1` to `4` columns).
  - 16px rounded card corners (`rounded-2xl`) with nested 12px media containers (`rounded-xl`).
  - High-contrast card borders (crisp 1px black in Light Mode, silver hairline on elevated surface in Dark Mode).
  - Auto-linked URLs, `@mentions`, and `#hashtags`.
- 🌓 **High-Contrast Dark & Light Themes**:
  - Persistent theme switcher with system preference detection and anti-FOUC (Flash of Unstyled Content) boot script.
- 🔍 **Instant Search & Multi-Criteria Filtering**:
  - Real-time search across tweet text, author handles, display names, and your personal notes.
  - Filter by author handle or name.
  - Sort by newest or oldest bookmarked date.
- 🏷️ **Custom Tags & Inline Annotations**:
  - Tag bookmarks with custom labels (`#dev`, `#design`, `#ai`, `#readlater`).
  - Add personal markdown notes to any bookmark with auto-saving to IndexedDB (debounced).
- 🖼️ **Media Preview & Fullscreen Lightbox**:
  - Single and multi-image galleries with carousel navigation.
  - Video poster thumbnail preview with duration/play badge.
  - Click any image for a modal lightbox view.
- ⌨️ **Vim-Style Keyboard Navigation**:
  - <kbd>J</kbd> / <kbd>K</kbd> or arrow keys to navigate cards.
  - <kbd>/</kbd> to jump straight to the search bar.
  - <kbd>Esc</kbd> to clear search or dismiss modals.
  - <kbd>C</kbd> to deselect active bookmark.
- 📦 **Export & Portability**:
  - Export your entire library—including custom tags and notes—back to JSON anytime.

---

## 🏗️ Repository Architecture

```text
x-bookmarks-manager/
├── app/                              # Offline React + Vite + Tailwind web application
│   ├── src/
│   │   ├── components/               # TopNav, BookmarkCard, MasonryGrid, Lightbox, etc.
│   │   ├── lib/                      # db.ts (IndexedDB), search.ts, linkify.ts, useTheme.ts
│   │   ├── types/                    # Tweet and bookmark data types
│   │   └── index.css                 # Theme tokens, surfaces, and high-contrast styling
│   └── package.json                  # Web app dependencies & Vite config
│
├── extension/                        # Chrome Extension (Manifest V3)
│   ├── manifest.json                 # Extension manifest (MV3)
│   ├── popup.html & popup.js         # Extension popup UI with live harvest counter
│   ├── background.js                 # Service worker message relay
│   ├── content.js                    # In-page DOM scraper & virtual-scroll handler
│   └── standalone/
│       └── console-scraper.js        # Standalone zero-install DevTools scraper script
│
├── sample-data/
│   └── bookmarks-export-sample.json  # Sanitized mock bookmark dataset for immediate testing
│
├── screenshots/                      # Application preview screenshots
├── tests/                            # Vitest automated test suite (DOM extractor, scroller, etc.)
├── .gitignore                        # Strict rules to safeguard personal bookmark exports
└── package.json                      # Root workspace scripts & Vitest test runner
```

---

## 🚀 Quick Start Guide

### Step 1: Export Your Bookmarks

#### Option A: Standalone Console Script (Zero installation — fastest)
1. In Google Chrome, go to [x.com/i/bookmarks](https://x.com/i/bookmarks) while logged in.
2. Open Chrome DevTools (<kbd>F12</kbd> or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> / <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>I</kbd>).
3. Switch to the **Console** tab.
4. Copy the entire code from [`extension/standalone/console-scraper.js`](./extension/standalone/console-scraper.js), paste it into the Console, and press <kbd>Enter</kbd>.
5. The script will automatically scroll down, harvest visible tweets, deduplicate entries, and download `bookmarks-export-<timestamp>.json` when finished. (Run `window.__X_SCRAPER__.stop()` anytime to stop early).

#### Option B: Load the Chrome Extension (Manifest V3)
1. Open Chrome and navigate to `chrome://extensions/`.
2. Turn on **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** (top-left) and select the `extension/` directory of this repo.
4. Go to [x.com/i/bookmarks](https://x.com/i/bookmarks).
5. Click the extension icon in your Chrome toolbar and click **Scrape Bookmarks**.
6. When complete, click **Stop & Export** to download your JSON file.

---

### Step 2: Run the Web App

Make sure you have [Node.js](https://nodejs.org/) (v18+) installed.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/x-bookmarks-manager.git
cd x-bookmarks-manager

# 2. Install dependencies
npm install
cd app && npm install && cd ..

# 3. Start the local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Step 3: Import & Browse

1. On the web app, click **Import** or drag and drop your exported `bookmarks-export-*.json` file.
2. *Want to test without scraping first?* An example dataset is included at [`sample-data/bookmarks-export-sample.json`](./sample-data/bookmarks-export-sample.json) with sanitized public tweets.
3. Your bookmarks are saved locally into your browser's IndexedDB and will persist across sessions.

---

## 🧪 Running Tests

The test suite covers DOM tweet extraction, multi-image and video poster parsing, virtual scroll unmounting, deduplication, search ranking, and theme logic:

```bash
# Run Vitest across all 8 test suites (41 tests)
npm test
```

To run a production build of the web app:

```bash
npm run build
```

---

## 🔒 Privacy & Local-First Philosophy

- **100% Client-Side**: All data processing and storage happens entirely inside your browser.
- **No Remote Servers**: There are no external databases, analytics trackers, or third-party servers.
- **Git Safeguards**: Personal bookmark files (`bookmarks-export*.json`, `bookmarks*.json`, `*.local.json`) are strictly excluded in [`.gitignore`](./.gitignore) to prevent accidental commits of personal data.

---

## ⚖️ License

Distributed under the [MIT License](./LICENSE).

---

*Disclaimer: This project is an independent open-source tool and is not affiliated with, endorsed by, or associated with X Corp.*
