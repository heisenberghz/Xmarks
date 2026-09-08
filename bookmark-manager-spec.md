# X (Twitter) Bookmarks Manager — Build Spec

## 1. Purpose

A personal tool to solve one problem: **the user has too many X/Twitter bookmarks and can't find things later.** No tagging, no search, just an endless flat list on X.

This tool has two parts:
1. A **Chrome extension** that scrapes the user's own bookmarks (via their logged-in browser session) and exports them as JSON.
2. A **local web app** that ingests that JSON, stores it in app-owned local storage, and gives the user real search, browsing, and manual tagging/notes.

This is a personal-use, local-first tool. No backend server, no multi-user auth, no cloud sync required for v1.

**Note on storage:** v1 uses simple app-owned storage (see Section 5.2). An alternative design — using an Obsidian vault (plain markdown files) as the storage layer instead — was explored and is documented in Section 8 as a possible Phase 2, once real usage shows whether the added portability/free tooling is worth the extra moving parts. Build v1 with app-owned storage first; only migrate if it proves worthwhile.

---

## 2. Non-goals (explicitly out of scope for v1)

- No auto-tagging / AI categorization in v1. Manual tags and notes only. (Revisit after the user has real data — see Section 8.)
- No official X API usage (cost/rate-limit prohibitive for this use case).
- No continuous/real-time sync — this is a manual "scrape → export → import" flow, run whenever the user wants to refresh.
- No multi-device sync, no cloud storage, no user accounts.
- No mobile app.

---

## 3. Architecture Overview

```
X bookmarks page (x.com/i/bookmarks)
        │
        │  content script scrapes visible DOM while auto-scrolling
        ▼
Chrome Extension (Manifest V3)
        │
        │  exports scraped records as a downloadable JSON file
        ▼
bookmarks-export.json
        │
        │  user imports file into the app (file picker / drag-drop)
        ▼
Local Web App
        │  - ingests + dedupes by tweet ID
        │  - stores in app-owned local storage (JSON store or embedded local DB)
        │  - search, browse, tag, note
        ▼
User
```

The scraper and the app are **fully decoupled**. If X changes its DOM and breaks the scraper, only the extension needs fixing — the app and its data are unaffected. This decoupling is a deliberate design choice; do not merge these into one codebase/process. It also means the storage layer (Section 5.2) can be swapped later — e.g. to an Obsidian vault, see Section 8 — without touching the scraper at all.

---

## 4. Component 1: Chrome Extension (Scraper)

### 4.1 Tech
- Manifest V3
- Vanilla JS content script (no framework needed — keep this component minimal and dependency-light, since it's the fragile part that will need maintenance)

### 4.2 Scope of injection
- Content script should only activate on `https://x.com/i/bookmarks*` (and `https://twitter.com/i/bookmarks*` for safety, in case of domain redirects).

### 4.3 Popup UI
- Single button: **"Scrape Bookmarks"**
- Status line below it showing live state:
  - `Idle`
  - `Scraping... (N collected)`
  - `Done — N bookmarks exported`
  - `Error: <reason>` (see error states below)
- No other UI needed in the extension. Keep it minimal — all real UX investment goes into the app (Section 5).

### 4.4 Scraping logic

**Selector strategy (risk mitigation for DOM fragility):**
- Prefer `data-testid` attributes over CSS class names — X's class names are auto-generated/obfuscated and change frequently; `data-testid` values are more stable across deploys.
- Known relevant `data-testid` values to target (verify against live DOM at build time, as these can shift): tweet container, tweet text, user name/handle, timestamp (`<time>` element with `datetime` attribute — use this for a reliable ISO timestamp rather than parsing relative text like "2h"), media containers.
- Build selector logic with **fallback chains**: try the primary `data-testid` selector; if it returns nothing, fall back to a secondary heuristic (e.g. structural position, `role` attributes, or `aria-label` patterns). Log (to console, for debugging) which selector path was used, to make future breakage easier to diagnose.

**Auto-scroll logic (risk mitigation for lazy-load timing):**
- Do NOT scroll on a fixed timer. Instead:
  1. Scroll down by a modest increment (e.g. ~800–1000px).
  2. Wait for new tweet elements to actually appear in the DOM (use a `MutationObserver` on the timeline container, or poll `document.querySelectorAll` for the tweet-container selector and compare count before/after with a short timeout).
  3. Only once new content is confirmed (or a timeout of ~3-4 seconds passes with no new content, meaning we may have hit the end or a stall), scroll again.
  4. Insert a human-like randomized delay between scroll actions (e.g. 800ms–1500ms) to avoid tripping rate-limiting or bot-detection heuristics.

**Extraction per tweet card:**
```
{
  id: string,          // tweet ID, extracted from the tweet's permalink URL
  text: string,         // full tweet text
  author_name: string,  // display name
  author_handle: string,// @handle
  timestamp: string,    // ISO 8601, from <time datetime="...">
  url: string,           // full tweet permalink
  media: string[]        // array of media URLs (images/video thumbnails), if present; empty array if none
}
```

**Deduplication:**
- Maintain a `Set` of already-collected tweet IDs during the scrape session.
- Skip any tweet card whose ID is already in the set (X's virtualized timeline can re-render already-seen tweets as you scroll).

**Stop conditions:**
- Success: scrolling reaches the bottom of the bookmarks list (detected via: several consecutive scroll attempts produce zero new tweets AND no loading spinner is present).
- Error states to detect and surface to the popup UI (do not fail silently, do not continue scraping blindly):
  - Login wall detected (e.g. a login/signup prompt element appears) → stop, report `Error: Login required`.
  - Rate-limit / "Something went wrong" message detected → stop, report `Error: Rate limited by X, try again later`.
  - No tweet elements found at all on load → stop, report `Error: Could not find bookmarks — check you're on the bookmarks page`.

### 4.5 Export mechanism
- Once scraping completes (success or manual stop), serialize collected records to JSON.
- Trigger a browser download of `bookmarks-export-<timestamp>.json` (use `chrome.downloads` API or a Blob + anchor-click download — either is fine, pick whichever is simpler to implement reliably in MV3).
- Do not attempt direct extension-to-app communication (e.g. localhost server, native messaging) in v1 — the manual file handoff is intentionally simple and has no moving parts to break. Revisit only if this handoff proves annoying in practice.

### 4.6 Permissions
Keep the manifest's permissions minimal:
- `host_permissions` scoped to `x.com` and `twitter.com` bookmarks path only — not all of X.
- `downloads` permission for export.
- No `storage`, no `tabs`, no broad host permissions unless a specific feature requires it.

---

## 5. Component 2: Local Web App

### 5.1 Tech
- Local-first web app (same general pattern as the user's existing HackRadar project — reuse that stack/approach for consistency).
- Persistent local storage, app-owned (local JSON store or embedded local DB — pick whichever matches the HackRadar precedent).
- No backend server required beyond what's needed to serve the app locally.

### 5.2 Data model

```
Bookmark {
  id: string             // tweet ID (primary key, used for dedup on import)
  text: string
  author_name: string
  author_handle: string
  timestamp: string       // ISO 8601
  url: string
  media: string[]
  tags: string[]          // user-assigned, manual in v1
  notes: string           // free text, user-assigned
  imported_at: string     // ISO 8601, when this record was ingested into the app
}
```

### 5.3 Import flow
- File picker or drag-and-drop to load a `bookmarks-export-*.json` file.
- On import: merge new records into the store, keyed by `id`. If a record with the same `id` already exists, skip it (do not overwrite existing tags/notes — those are user-authored and must never be clobbered by a re-import).
- Show a post-import summary: `N new bookmarks added, M duplicates skipped`.

### 5.4 Core views

**Main view — Grid**
- Masonry-style card grid (Pinterest-like), responsive column count based on viewport width.
- Persistent top bar:
  - Search input (live filter as you type — matches against `text`, `author_name`, `author_handle`, `tags`)
  - Tag filter chips (click to toggle filter; multiple tags = AND or OR — default to OR, since this is more forgiving for a first pass)
  - Total bookmark count
  - Import button

**Card (per bookmark), compact/dense:**
- Top row: author handle + display name, timestamp (right-aligned, small)
- Tweet text, truncated after ~3-4 lines with a "show more" expand
- Media thumbnail if present (compact, not full-width hero image — this is a dense layout, not a showcase)
- Tag chips along the bottom, small
- Hover reveals quick actions: open original tweet (external link), edit tags/notes, delete from local store

**Detail view (on card click)**
- Modal or side panel (side panel preferred, fits the "power-user dense" direction better than a modal takeover)
- Full tweet text (untruncated), media at larger size, link to original
- Editable tags field (add/remove chips) and notes field (free text), saved on change/blur

### 5.5 Search behavior
- Client-side full-text filtering (no need for a search index/library at this data scale — a personal bookmark collection is unlikely to exceed a few thousand records; simple substring/keyword matching across `text`, `author_name`, `author_handle`, `tags` is sufficient).
- Live-filters the grid as the user types, no separate "search" submit step.

### 5.6 Deletion
- Deleting a bookmark from the app only removes it from local storage — it does not affect the actual bookmark on X. Make this distinction clear in the UI (e.g. via a short confirm dialog: "Remove from this tool? This won't unbookmark it on X.").

---

## 6. UI/UX Direction

### 6.1 Overall feel
Power-user, information-dense tool — closer to a developer dashboard than a consumer app. Prioritize scannability and compactness over decorative whitespace.

### 6.2 Explicitly avoid
- Gradient backgrounds or gradient buttons
- Glow/blur decorative effects, glassmorphism
- Soft, overly-rounded "bubbly" card corners
- Generic AI-product purple/violet color palettes
- Heavy drop shadows as a primary visual device

### 6.3 Aim for instead
- Flat colors, solid fills
- Minimal, consistent border radius (sharp-ish, not squishy)
- One deliberate accent color, used specifically for tags and primary actions — everything else neutral (grays/blacks/whites, or a dark base if going dark mode)
- Compact type scale — smaller base font sizes than a typical consumer app, since density is the explicit goal
- Visual hierarchy achieved through spacing/weight/contrast, not decoration

### 6.4 Layout
- Grid/masonry card layout (Pinterest-style) for the main view, per user preference.
- Persistent top search/filter bar.
- Optional collapsible sidebar for tag list and quick filters, if screen space allows.

---

## 7. Known Risks & Mitigations (summary — see Section 4.4 for detail)

| Risk | Mitigation |
|---|---|
| X's DOM/class names change, breaking the scraper | Use `data-testid` attributes with fallback selector chains; log which path was used for easier debugging |
| Lazy-loading timing causes missed/duplicate tweets | Scroll-wait-check loop instead of fixed timers; dedup by tweet ID |
| X shows rate-limit or login interstitials during scraping | Detect these states explicitly, stop cleanly, surface a clear error — never continue scraping through an error state |
| Large bookmark collections make scraping slow | Accept this as a v1 tradeoff — it's a one-time or occasional operation, not continuous; show live progress count so the user knows it's working |

---

## 8. Future Phases (not in v1, noted for context)

- **Auto-tagging**: once the user has real bookmark data and has used manual tagging for a while, revisit whether keyword-based rules or an LLM-based tagger (e.g. via Claude API) is worth adding. Decision deferred until real usage patterns are visible — do not build this speculatively.
- **Direct extension→app sync**: if the manual JSON file handoff proves annoying, consider `chrome.storage` + local app polling, or a lightweight localhost bridge.
- **Incremental/ongoing capture**: a "bookmark this tweet" button injected on individual tweets (not just the bookmarks page), for capturing without needing a full re-scrape.
- **Obsidian vault as storage layer (Phase 2 candidate)**: instead of app-owned JSON/DB storage, each bookmark becomes a `.md` file with YAML frontmatter (id, author, timestamp, url, tags) and the tweet text as the note body, written into a user-chosen Obsidian vault folder. The app reads/writes those files directly instead of an internal database. Benefits: data becomes plain, portable, human-readable text with no lock-in, and the user gets Obsidian's own search/tag browser/graph view as a free secondary way to browse the same data, editable from either side. Tradeoffs: two things (app + Obsidian) can touch the same files, so the app should re-read from disk on focus rather than trust a stale in-memory copy; slightly more setup (pointing the app at a vault folder). Worth doing if the user starts actively wanting to browse/tag bookmarks *inside* Obsidian itself, or wants long-term portability of the data outside this app; not worth the added complexity if usage stays purely "store and search via the app."

---

## 9. Build Order (recommended)

1. Scraper logic as a standalone script, tested manually via browser console against the real bookmarks page — validate selector strategy and scroll logic before packaging anything.
2. Wrap validated scraper into the Chrome extension shell (popup, manifest, export-to-JSON).
3. Build the local app's data layer (storage schema, import/dedupe logic) — no UI yet, verify with the real exported JSON from step 2.
4. Build the app's UI (grid, search, detail view, tagging) per Section 6.
5. End-to-end test: fresh scrape → export → import → search/tag in the app.

