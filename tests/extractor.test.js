import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { extractTweetData } from '../extension/src/extractor.js';
import {
  simpleTweetHtml,
  mediaTweetHtml,
  videoTweetHtml,
  quotedTweetHtml,
} from './fixtures/tweet_cards.js';

describe('extractTweetData', () => {
  let dom;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://x.com/i/bookmarks',
    });
    global.document = dom.window.document;
    global.NodeFilter = dom.window.NodeFilter;
  });

  it('correctly extracts simple text tweet', () => {
    const container = document.createElement('div');
    container.innerHTML = simpleTweetHtml;
    const article = container.querySelector('article');

    const result = extractTweetData(article);
    expect(result).not.toBeNull();
    expect(result.id).toBe('1789012345678901234');
    expect(result.author_name).toBe('Guillermo Rauch');
    expect(result.author_handle).toBe('@rauchg');
    expect(result.timestamp).toBe('2026-05-10T14:30:00.000Z');
    expect(result.text).toBe('Shipping faster than ever with local-first tooling.');
    expect(result.url).toBe('https://x.com/rauchg/status/1789012345678901234');
    expect(result.media).toEqual([]);
  });

  it('correctly extracts media tweet with multiple images', () => {
    const container = document.createElement('div');
    container.innerHTML = mediaTweetHtml;
    const article = container.querySelector('article');

    const result = extractTweetData(article);
    expect(result).not.toBeNull();
    expect(result.id).toBe('1789999999999999999');
    expect(result.author_name).toBe('shadcn');
    expect(result.author_handle).toBe('@shadcn');
    expect(result.timestamp).toBe('2026-05-12T09:15:00.000Z');
    expect(result.text).toBe('New component updates are live!');
    expect(result.media).toHaveLength(2);
    expect(result.media).toContain('https://pbs.twimg.com/media/F123456_thumb.jpg:large');
    expect(result.media).toContain('https://pbs.twimg.com/media/F789012_thumb.jpg:large');
  });

  it('correctly extracts video tweet poster as media thumbnail', () => {
    const container = document.createElement('div');
    container.innerHTML = videoTweetHtml;
    const article = container.querySelector('article');

    const result = extractTweetData(article);
    expect(result).not.toBeNull();
    expect(result.id).toBe('1795555555555555555');
    expect(result.author_name).toBe('Andrej Karpathy');
    expect(result.author_handle).toBe('@karpathy');
    expect(result.timestamp).toBe('2026-05-15T18:00:00.000Z');
    expect(result.media).toContain('https://pbs.twimg.com/tweet_video_thumb/video_thumb_99.jpg');
  });

  it('extracts parent tweet without being polluted by quoted tweet content', () => {
    const container = document.createElement('div');
    container.innerHTML = quotedTweetHtml;
    const article = container.querySelector('article');

    const result = extractTweetData(article);
    expect(result).not.toBeNull();
    expect(result.id).toBe('1801112223334445556');
    expect(result.author_name).toBe('swyx');
    expect(result.author_handle).toBe('@swyx');
    expect(result.text).toBe('Totally agree with this observation on AI workflows:');
  });

  it('returns null for empty or non-tweet elements', () => {
    const dummyDiv = document.createElement('div');
    dummyDiv.innerHTML = '<p>Just some banner text</p>';
    expect(extractTweetData(dummyDiv)).toBeNull();
  });
});
