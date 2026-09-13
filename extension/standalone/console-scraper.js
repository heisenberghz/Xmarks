/**
 * =========================================================================
 * X (Twitter) Bookmarks Manager — Standalone Console Scraper
 * =========================================================================
 * 
 * Instructions:
 * 1. Open Chrome and navigate to https://x.com/i/bookmarks or https://x.com/i/history
 * 2. Make sure you are logged in and the "Bookmarks" tab is SELECTED.
 * 3. Open Chrome DevTools (Press F12 or Ctrl+Shift+I / Cmd+Option+I), switch to "Console".
 * 4. Paste this entire script and press Enter.
 * 5. Watch the live progress in the console.
 * 6. To stop early: run `window.__X_SCRAPER__.stop()` in the console.
 * 7. When finished or stopped, Chrome automatically downloads `bookmarks-export-<timestamp>.json`.
 * =========================================================================
 */

(async function runXBookmarksScraper() {
  console.log('%c[X Bookmarks Scraper] Initializing...', 'color: #1d9bf0; font-weight: bold; font-size: 14px;');

  const path = window.location.pathname;
  const isBookmarksRoute = path.includes('/i/bookmarks') || path.includes('/i/history');

  // 1. Safety check: ensure on bookmarks or history route
  if (!isBookmarksRoute) {
    const msg = 'Error: You must be on https://x.com/i/bookmarks or https://x.com/i/history to run this scraper.';
    console.error(`%c[X Bookmarks Scraper] ${msg}`, 'color: red; font-weight: bold;');
    alert(msg);
    return;
  }

  // 2. Tab check helper: Ensure "Bookmarks" tab is selected on /i/history
  function checkBookmarksTabSelected() {
    const tabs = document.querySelectorAll('[role="tab"]');
    if (tabs.length === 0) {
      // Direct /i/bookmarks without tab bar is accepted
      return path.includes('/i/bookmarks');
    }

    let bookmarksTab = null;
    let likesTab = null;

    for (const tab of tabs) {
      const text = (tab.innerText || tab.textContent || '').trim().toLowerCase();
      if (text.includes('bookmark')) {
        bookmarksTab = tab;
      } else if (text.includes('like')) {
        likesTab = tab;
      }
    }

    if (bookmarksTab) {
      return bookmarksTab.getAttribute('aria-selected') === 'true';
    }

    if (likesTab && likesTab.getAttribute('aria-selected') === 'true') {
      return false;
    }

    return path.includes('/i/bookmarks');
  }

  if (!checkBookmarksTabSelected()) {
    const tabErrMsg = 'Please click the "Bookmarks" tab before running this scraper (currently on Likes or tab not selected).';
    console.error(`%c[X Bookmarks Scraper] ${tabErrMsg}`, 'color: red; font-weight: bold;');
    alert(tabErrMsg);
    return;
  }

  // State
  const collectedBookmarks = [];
  const seenIds = new Set();
  let isRunning = true;

  // Expose manual stop control to user in console
  window.__X_SCRAPER__ = {
    stop: () => {
      console.log('%c[X Bookmarks Scraper] Manual stop requested by user. Finalizing export...', 'color: orange; font-weight: bold;');
      isRunning = false;
    },
    getProgress: () => ({
      count: collectedBookmarks.length,
      isRunning
    })
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const getRandomDelay = (min = 800, max = 1500) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Tweet extraction logic
  function extractTweet(article) {
    if (!article) return null;
    try {
      const quoteContainer = article.querySelector('[aria-label*="Quote"], div[role="link"] [data-testid="tweetText"]')?.closest('[role="link"]');

      const queryPrimary = (selector) => {
        const elements = article.querySelectorAll(selector);
        for (const el of elements) {
          if (quoteContainer && quoteContainer.contains(el)) continue;
          return el;
        }
        return null;
      };

      const queryPrimaryAll = (selector) => {
        const elements = article.querySelectorAll(selector);
        const results = [];
        for (const el of elements) {
          if (quoteContainer && quoteContainer.contains(el)) continue;
          results.push(el);
        }
        return results;
      };

      // 1. Tweet ID and permalink
      let timestamp = '';
      let tweetId = '';
      let tweetUrl = '';

      const timeEl = queryPrimary('time');
      if (timeEl) {
        timestamp = timeEl.getAttribute('datetime') || '';
        const linkEl = timeEl.closest('a');
        if (linkEl && linkEl.getAttribute('href')) {
          const href = linkEl.getAttribute('href');
          const match = href.match(/\/status\/(\d+)/);
          if (match) {
            tweetId = match[1];
            tweetUrl = href.startsWith('http') ? href.split('?')[0] : `https://x.com${href.split('?')[0]}`;
          }
        }
      }

      if (!tweetId) {
        const statusLinks = queryPrimaryAll('a[href*="/status/"]');
        for (const link of statusLinks) {
          const href = link.getAttribute('href') || '';
          const match = href.match(/\/status\/(\d+)/);
          if (match) {
            tweetId = match[1];
            tweetUrl = href.startsWith('http') ? href.split('?')[0] : `https://x.com${href.split('?')[0]}`;
            break;
          }
        }
      }

      if (!tweetId) return null;

      // 2. Author info
      let authorName = '';
      let authorHandle = '';
      const userNameContainer = queryPrimary('[data-testid="User-Name"]');
      if (userNameContainer) {
        const allTextNodes = [];
        const walk = document.createTreeWalker(userNameContainer, NodeFilter.SHOW_TEXT, null);
        let node;
        while ((node = walk.nextNode())) {
          const text = node.textContent?.trim();
          if (text) allTextNodes.push(text);
        }
        const handleIndex = allTextNodes.findIndex((t) => t.startsWith('@'));
        if (handleIndex !== -1) {
          authorHandle = allTextNodes[handleIndex];
          if (handleIndex > 0) {
            authorName = allTextNodes.slice(0, handleIndex).join(' ').trim();
          }
        }
        if (!authorName) {
          const firstAnchor = userNameContainer.querySelector('a');
          if (firstAnchor) authorName = firstAnchor.textContent?.trim() || '';
        }
      }

      if (!authorHandle) {
        const anyHandleEl = queryPrimaryAll('span');
        for (const el of anyHandleEl) {
          const txt = el.textContent?.trim() || '';
          if (txt.startsWith('@') && txt.length > 1 && !txt.includes(' ')) {
            authorHandle = txt;
            break;
          }
        }
      }

      if (!authorName && authorHandle) {
        authorName = authorHandle.replace('@', '');
      }

      // 3. Tweet text
      let text = '';
      const tweetTextEl = queryPrimary('[data-testid="tweetText"]');
      if (tweetTextEl) {
        text = tweetTextEl.innerText || tweetTextEl.textContent || '';
      } else {
        const fallbackTextEl = queryPrimary('div[lang]');
        if (fallbackTextEl) text = fallbackTextEl.innerText || fallbackTextEl.textContent || '';
      }
      text = text.trim();

      // 4. Media
      const media = [];
      const mediaSet = new Set();
      const photoContainers = queryPrimaryAll('[data-testid="tweetPhoto"] img, img[src*="pbs.twimg.com/media"]');
      for (const img of photoContainers) {
        const src = img.getAttribute('src');
        if (src && !src.includes('/profile_images/') && !src.includes('/emoji/') && !mediaSet.has(src)) {
          mediaSet.add(src);
          media.push(src);
        }
      }

      const videoElements = queryPrimaryAll('video');
      for (const video of videoElements) {
        const poster = video.getAttribute('poster');
        if (poster && !mediaSet.has(poster)) {
          mediaSet.add(poster);
          media.push(poster);
        }
      }

      return {
        id: tweetId,
        text: text,
        author_name: authorName,
        author_handle: authorHandle,
        timestamp: timestamp,
        url: tweetUrl || (authorHandle ? `https://x.com/${authorHandle.replace('@', '')}/status/${tweetId}` : `https://x.com/i/status/${tweetId}`),
        media: media
      };
    } catch (err) {
      return null;
    }
  }

  // Harvest all currently visible tweets in the DOM
  function harvestCurrentBatch() {
    const articles = document.querySelectorAll('article[data-testid="tweet"], article[role="article"]');
    let newlyFound = 0;
    for (const article of articles) {
      const tweet = extractTweet(article);
      if (tweet && !seenIds.has(tweet.id)) {
        seenIds.add(tweet.id);
        collectedBookmarks.push(tweet);
        newlyFound++;
      }
    }
    return newlyFound;
  }

  // Trigger JSON file download
  function downloadJson() {
    const filename = `bookmarks-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const jsonStr = JSON.stringify(collectedBookmarks, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
    console.log(`%c[X Bookmarks Scraper] Successfully exported ${collectedBookmarks.length} bookmarks to ${filename}!`, 'color: #00ba7c; font-weight: bold; font-size: 14px;');
  }

  // Check for error banners & tab switches
  function checkErrors() {
    if (!checkBookmarksTabSelected()) {
      return 'Please click the Bookmarks tab before running this scraper';
    }
    const bodyText = document.body ? (document.body.innerText || '') : '';
    if (document.querySelector('[data-testid="login"], [data-testid="sheetDialog"]') || (bodyText.includes('Log in to X') && !document.querySelector('article'))) {
      return 'Error: Login required';
    }
    if (bodyText.includes('Something went wrong. Try reloading.') || bodyText.includes('Rate limit exceeded')) {
      return 'Error: Rate limited by X, try again later';
    }
    return null;
  }

  // Initial harvest
  console.log('[X Bookmarks Scraper] Scraping started. Type window.__X_SCRAPER__.stop() to stop at any time.');
  harvestCurrentBatch();
  console.log(`[X Bookmarks Scraper] Initial pass: ${collectedBookmarks.length} bookmarks collected.`);

  let consecutiveStalls = 0;
  const MAX_STALLS = 5;

  // Main scraping loop
  while (isRunning) {
    const err = checkErrors();
    if (err) {
      console.error(`%c[X Bookmarks Scraper] ${err}`, 'color: red; font-weight: bold;');
      alert(err);
      break;
    }

    // Scroll down by 850px
    window.scrollBy({ top: 850, left: 0, behavior: 'smooth' });

    // Randomized human-like delay
    const delay = getRandomDelay(900, 1600);
    await sleep(delay);

    const newlyHarvested = harvestCurrentBatch();
    if (newlyHarvested > 0) {
      consecutiveStalls = 0;
      console.log(`[X Bookmarks Scraper] +${newlyHarvested} new bookmarks (Total: ${collectedBookmarks.length})`);
    } else {
      const isSpinnerVisible = !!document.querySelector('[role="progressbar"], [data-testid="spinner"], svg[aria-label="Loading…"]');
      if (isSpinnerVisible) {
        console.log('[X Bookmarks Scraper] Waiting for X timeline to load more items...');
        await sleep(2000);
      } else {
        consecutiveStalls++;
        console.log(`[X Bookmarks Scraper] No new tweets detected (${consecutiveStalls}/${MAX_STALLS})...`);
        if (consecutiveStalls >= MAX_STALLS) {
          console.log('%c[X Bookmarks Scraper] Reached the end of your bookmarks timeline!', 'color: #00ba7c; font-weight: bold;');
          break;
        }
      }
    }
  }

  if (collectedBookmarks.length > 0) {
    downloadJson();
  } else {
    console.warn('%c[X Bookmarks Scraper] No bookmarks were collected. Make sure the Bookmarks tab is open with tweets visible.', 'color: orange;');
  }
})();
