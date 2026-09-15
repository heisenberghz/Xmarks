/**
 * Extracts structured bookmark data from an X (Twitter) tweet element.
 * Designed with selector fallback chains and defensive edge-case handling.
 */

/**
 * Extracts a single tweet's data from its DOM container.
 * @param {Element} article - The tweet DOM element (usually an <article>)
 * @param {Object} [options] - Options for extraction
 * @param {boolean} [options.logFallbacks=false] - Whether to log selector fallback usage
 * @returns {Object|null} ScrapedBookmark object or null if extraction failed
 */
export function extractTweetData(article, options = {}) {
  if (!article || typeof article.querySelector !== 'function') {
    return null;
  }

  try {
    // 1. Isolate main tweet area from any nested quoted tweets
    // Quoted tweets typically appear inside a child element with role="link" or aria-label containing "Quote"
    const quoteContainer = article.querySelector('[aria-label*="Quote"], div[role="link"] [data-testid="tweetText"]')?.closest('[role="link"]');

    // Helper to query element ensuring it's not inside the quote container
    const queryPrimary = (selector) => {
      const elements = article.querySelectorAll(selector);
      for (const el of elements) {
        if (quoteContainer && quoteContainer.contains(el)) {
          continue;
        }
        return el;
      }
      return null;
    };

    const queryPrimaryAll = (selector) => {
      const elements = article.querySelectorAll(selector);
      const results = [];
      for (const el of elements) {
        if (quoteContainer && quoteContainer.contains(el)) {
          continue;
        }
        results.push(el);
      }
      return results;
    };

    // 2. Extract Timestamp, Tweet ID, and Permalink
    let timestamp = '';
    let tweetId = '';
    let tweetUrl = '';

    // Primary: <time> element has ISO datetime attribute and is usually nested in a status link
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

    // Fallback for ID and URL: Any status link in the primary container
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

    // If we cannot find a tweet ID, this is not a valid tweet card or is an ad/poll placeholder
    if (!tweetId) {
      if (options.logFallbacks) {
        console.warn('[Extractor] Could not extract tweet ID from element', article);
      }
      return null;
    }

    // 3. Extract Author Avatar, Name and @Handle
    let avatarUrl = '';
    let authorName = '';
    let authorHandle = '';

    // Avatar: look for profile image (the one we intentionally exclude from tweet media)
    const avatarImg = queryPrimary('img[src*="/profile_images/"]');
    if (avatarImg) {
      avatarUrl = avatarImg.getAttribute('src') || '';
    }

    const userNameContainer = queryPrimary('[data-testid="User-Name"]');
    if (userNameContainer) {
      // Find handle: text matching @username
      const allTextNodes = [];
      const walk = document.createTreeWalker(userNameContainer, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walk.nextNode())) {
        const text = node.textContent?.trim();
        if (text) allTextNodes.push(text);
      }

      const handleIndex = allTextNodes.findIndex(t => t.startsWith('@'));
      if (handleIndex !== -1) {
        authorHandle = allTextNodes[handleIndex];
        // Display name is typically the text appearing before the @handle
        if (handleIndex > 0) {
          authorName = allTextNodes.slice(0, handleIndex).join(' ').trim();
        }
      }

      // Fallback: If authorName still empty, find first anchor text in User-Name
      if (!authorName) {
        const firstAnchor = userNameContainer.querySelector('a');
        if (firstAnchor) {
          authorName = firstAnchor.textContent?.trim() || '';
        }
      }
    }

    // Fallback for Author if User-Name testid wasn't present or complete
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

    // 4. Extract Tweet Text
    let text = '';
    const tweetTextEl = queryPrimary('[data-testid="tweetText"]');
    if (tweetTextEl) {
      text = tweetTextEl.innerText || tweetTextEl.textContent || '';
    } else {
      // Fallback: Check for lang attribute or dir="auto"
      const fallbackTextEl = queryPrimary('div[lang]');
      if (fallbackTextEl) {
        text = fallbackTextEl.innerText || fallbackTextEl.textContent || '';
      }
    }
    text = text
      .replace(/\u00A0/g, ' ')
      .replace(/(https?:\/\/)\s*(\r?\n)+\s*([a-zA-Z0-9_\-.~%+@]+)/gi, '$1$3')
      .trim();

    // 5. Extract Media (Images & Video Posters)
    const media = [];
    const mediaSet = new Set();

    // Tweet photos
    const photoContainers = queryPrimaryAll('[data-testid="tweetPhoto"] img, img[src*="pbs.twimg.com/media"]');
    for (const img of photoContainers) {
      const src = img.getAttribute('src');
      if (src && !src.includes('/profile_images/') && !src.includes('/emoji/') && !mediaSet.has(src)) {
        mediaSet.add(src);
        media.push(src);
      }
    }

    // Tweet videos: grab poster image as reliable visual representation
    const videoElements = queryPrimaryAll('video');
    for (const video of videoElements) {
      const poster = video.getAttribute('poster');
      if (poster && !mediaSet.has(poster)) {
        mediaSet.add(poster);
        media.push(poster);
      }
    }

    // Construct ScrapedBookmark record per specification Section 4.4
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
    if (options.logFallbacks) {
      console.error('[Extractor] Error parsing tweet element:', err);
    }
    return null;
  }
}
