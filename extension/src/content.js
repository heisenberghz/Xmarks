/**
 * Chrome Extension Content Script (Manifest V3)
 * Injected on x.com/i/bookmarks, x.com/i/history, twitter.com/i/bookmarks, twitter.com/i/history.
 * Manages scraping loop, deduplication, and export coordination.
 */

(() => {
  // Guard against multiple injections
  if (window.__X_BOOKMARK_EXPORTER_INJECTED__) return;
  window.__X_BOOKMARK_EXPORTER_INJECTED__ = true;

  // Internal state
  let isRunning = false;
  let collectedBookmarks = [];
  let seenIds = new Set();
  let status = 'Idle';
  let lastError = null;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const getRandomDelay = (min = 800, max = 1500) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Tab checking logic for /i/history
  function isBookmarksTabSelected() {
    const path = window.location.pathname;
    const tabs = document.querySelectorAll('[role="tab"]');

    if (tabs.length === 0) {
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

  // Pure extraction logic
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

      // 1. Tweet ID & URL
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
      let avatarUrl = '';
      let authorName = '';
      let authorHandle = '';

      // Avatar
      const avatarImg = queryPrimary('img[src*="/profile_images/"]');
      if (avatarImg) {
        avatarUrl = avatarImg.getAttribute('src') || '';
      }
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
      text = text
        .replace(/\u00A0/g, ' ')
        .replace(/(https?:\/\/)\s*(\r?\n)+\s*([a-zA-Z0-9_\-.~%+@]+)/gi, '$1$3')
        .replace(/((?:https?:\/\/|www\.|[a-zA-Z0-9-]+\.[a-z]{2,8}\/)[^\s<]*[/_\-])\s*(\r?\n)+\s*([a-zA-Z0-9_\-.~%+@]+)/gi, '$1$3')
        .replace(/((?:https?:\/\/|www\.|[a-zA-Z0-9-]+\.[a-z]{2,8}\/)[^\s<]*[a-zA-Z0-9])\s*(\r?\n)+\s*([a-zA-Z0-9_\-.~%+@]*\/[a-zA-Z0-9_\-.~%+@]+)/gi, '$1$3')
        .trim();

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
        avatar_url: avatarUrl,
        timestamp: timestamp,
        url: tweetUrl || (authorHandle ? `https://x.com/${authorHandle.replace('@', '')}/status/${tweetId}` : `https://x.com/i/status/${tweetId}`),
        media: media
      };
    } catch (err) {
      return null;
    }
  }

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

  function checkErrors() {
    const path = window.location.pathname;
    const isBookmarksRoute = path.includes('/i/bookmarks') || path.includes('/i/history');
    if (!isBookmarksRoute) {
      return "Could not find bookmarks — check you're on x.com/i/bookmarks or x.com/i/history";
    }

    // Check Bookmarks tab selection
    if (!isBookmarksTabSelected()) {
      return 'Please click the Bookmarks tab before running this scraper';
    }

    const bodyText = document.body ? (document.body.innerText || '') : '';
    if (document.querySelector('[data-testid="login"], [data-testid="sheetDialog"]') || (bodyText.includes('Log in to X') && !document.querySelector('article'))) {
      return 'Login required';
    }
    if (bodyText.includes('Something went wrong. Try reloading.') || bodyText.includes('Rate limit exceeded')) {
      return 'Rate limited by X, try again later';
    }
    return null;
  }

  async function triggerExport() {
    if (collectedBookmarks.length === 0) {
      status = 'Done — 0 bookmarks exported';
      return;
    }

    const filename = `bookmarks-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const jsonContent = JSON.stringify(collectedBookmarks, null, 2);

    try {
      chrome.runtime.sendMessage(
        { action: 'DOWNLOAD_JSON', filename, jsonContent },
        (res) => {
          if (!res || !res.success) {
            fallbackBlobDownload(jsonContent, filename);
          }
        }
      );
    } catch (e) {
      fallbackBlobDownload(jsonContent, filename);
    }

    status = `Done — ${collectedBookmarks.length} bookmarks exported`;
  }

  function fallbackBlobDownload(jsonContent, filename) {
    const blob = new Blob([jsonContent], { type: 'application/json' });
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
  }

  async function startScrapingLoop() {
    if (isRunning) return;
    isRunning = true;
    lastError = null;
    status = 'Scraping... (0 collected)';

    const initialErr = checkErrors();
    if (initialErr) {
      isRunning = false;
      lastError = initialErr;
      status = `Error: ${initialErr}`;
      return;
    }

    collectedBookmarks = [];
    seenIds.clear();

    harvestCurrentBatch();
    status = `Scraping... (${collectedBookmarks.length} collected)`;

    let consecutiveStalls = 0;
    const MAX_STALLS = 5;

    while (isRunning) {
      const err = checkErrors();
      if (err) {
        isRunning = false;
        lastError = err;
        status = `Error: ${err}`;
        break;
      }

      window.scrollBy({ top: 850, left: 0, behavior: 'smooth' });
      await sleep(getRandomDelay(900, 1600));

      const newlyFound = harvestCurrentBatch();
      if (newlyFound > 0) {
        consecutiveStalls = 0;
        status = `Scraping... (${collectedBookmarks.length} collected)`;
      } else {
        const isSpinner = !!document.querySelector('[role="progressbar"], [data-testid="spinner"], svg[aria-label="Loading…"]');
        if (isSpinner) {
          await sleep(2000);
        } else {
          consecutiveStalls++;
          if (consecutiveStalls >= MAX_STALLS) {
            break;
          }
        }
      }
    }

    isRunning = false;
    if (!lastError) {
      await triggerExport();
    }
  }

  function stopScraping() {
    if (isRunning) {
      isRunning = false;
      triggerExport();
    }
  }

  // Chrome runtime message handling
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_STATUS') {
      const path = window.location.pathname;
      const isRouteMatch = path.includes('/i/bookmarks') || path.includes('/i/history');
      sendResponse({
        isRunning,
        count: collectedBookmarks.length,
        status,
        lastError,
        isBookmarksPage: isRouteMatch,
        isTabSelected: isBookmarksTabSelected()
      });
      return false;
    }

    if (request.action === 'START_SCRAPE') {
      startScrapingLoop();
      sendResponse({ success: true });
      return false;
    }

    if (request.action === 'STOP_SCRAPE') {
      stopScraping();
      sendResponse({ success: true, count: collectedBookmarks.length });
      return false;
    }
  });
})();
