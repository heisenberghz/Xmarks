import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { extractTweetData } from '../extension/src/extractor.js';
import { simpleTweetHtml, mediaTweetHtml } from './fixtures/tweet_cards.js';

describe('Deduplication & Virtual DOM Batch Aggregation', () => {
  it('deduplicates re-rendered tweets and accumulates unique records', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="timeline"></div></body></html>', {
      url: 'https://x.com/i/bookmarks',
    });
    global.document = dom.window.document;
    global.NodeFilter = dom.window.NodeFilter;

    const timeline = document.getElementById('timeline');
    const seenIds = new Set();
    const collectedBookmarks = [];

    function processVisibleTweets() {
      const articles = timeline.querySelectorAll('article');
      for (const article of articles) {
        const data = extractTweetData(article);
        if (data && !seenIds.has(data.id)) {
          seenIds.add(data.id);
          collectedBookmarks.push(data);
        }
      }
    }

    // Step 1: First batch in viewport
    timeline.innerHTML = simpleTweetHtml;
    processVisibleTweets();

    expect(collectedBookmarks).toHaveLength(1);
    expect(collectedBookmarks[0].id).toBe('1789012345678901234');
    expect(seenIds.size).toBe(1);

    // Step 2: Virtual scroll moves down. Old tweet still partially visible, new media tweet appears
    timeline.innerHTML = simpleTweetHtml + mediaTweetHtml;
    processVisibleTweets();

    expect(collectedBookmarks).toHaveLength(2);
    expect(seenIds.size).toBe(2);
    expect(collectedBookmarks[1].id).toBe('1789999999999999999');

    // Step 3: Virtual scroll moves further down. First tweet unmounted, media tweet still present
    timeline.innerHTML = mediaTweetHtml;
    processVisibleTweets();

    // Length should remain 2, not duplicate
    expect(collectedBookmarks).toHaveLength(2);
    expect(seenIds.size).toBe(2);
  });
});
