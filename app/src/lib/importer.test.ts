import { describe, it, expect } from 'vitest';
import { parseAndDedupeBookmarks } from './importer';
import { Bookmark } from '../types/bookmark';

describe('Importer & Deduplication Engine', () => {
  const existingBookmark: Bookmark = {
    id: '1001',
    text: 'Existing bookmark text',
    author_name: 'Existing Author',
    author_handle: '@existing',
    avatar_url: 'https://pbs.twimg.com/profile_images/existing_normal.jpg',
    timestamp: '2026-05-01T00:00:00.000Z',
    url: 'https://x.com/existing/status/1001',
    media: [],
    tags: ['important', 'ai'],
    notes: 'My custom personal note that should never be overwritten',
    imported_at: '2026-05-01T01:00:00.000Z',
  };

  it('correctly ingests new bookmarks and assigns default empty tags/notes', () => {
    const rawBatch = [
      {
        id: '2002',
        text: 'Brand new tweet',
        author_name: 'New Author',
        author_handle: '@newauthor',
        timestamp: '2026-05-10T12:00:00.000Z',
        url: 'https://x.com/newauthor/status/2002',
        media: ['https://pbs.twimg.com/media/test.jpg'],
      },
    ];

    const result = parseAndDedupeBookmarks(rawBatch, [existingBookmark]);

    expect(result.added).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.totalParsed).toBe(1);
    expect(result.bookmarks).toHaveLength(2);

    const addedItem = result.bookmarks.find((b) => b.id === '2002');
    expect(addedItem).toBeDefined();
    expect(addedItem?.tags).toEqual([]);
    expect(addedItem?.notes).toBe('');
    expect(addedItem?.media).toHaveLength(1);
  });

  it('skips duplicates and NEVER overwrites existing tags or notes', () => {
    const rawBatch = [
      {
        id: '1001', // Same ID as existingBookmark!
        text: 'Updated text on X that should not clobber user tags',
        author_name: 'Existing Author',
        author_handle: '@existing',
        tags: ['wrong_tag_from_scrape'],
        notes: 'scraped note',
      },
      {
        id: '3003',
        text: 'Another new tweet',
      },
    ];

    const result = parseAndDedupeBookmarks(rawBatch, [existingBookmark]);

    expect(result.added).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.totalParsed).toBe(2);

    // Existing bookmark should still have its original tags and notes
    const preservedItem = result.bookmarks.find((b) => b.id === '1001');
    expect(preservedItem).toBeDefined();
    expect(preservedItem?.tags).toEqual(['important', 'ai']);
    expect(preservedItem?.notes).toBe('My custom personal note that should never be overwritten');
  });

  it('deduplicates duplicate tweet IDs occurring inside the same import file', () => {
    const rawBatch = [
      { id: '4004', text: 'First occurrence' },
      { id: '4004', text: 'Second occurrence of same tweet' },
    ];

    const result = parseAndDedupeBookmarks(rawBatch, []);
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.totalParsed).toBe(2);
    expect(result.bookmarks).toHaveLength(1);
    expect(result.bookmarks[0].text).toBe('First occurrence');
  });

  it('handles JSON string inputs and throws on invalid syntax', () => {
    const jsonStr = JSON.stringify([{ id: '5005', text: 'From JSON string' }]);
    const result = parseAndDedupeBookmarks(jsonStr, []);
    expect(result.added).toBe(1);

    expect(() => parseAndDedupeBookmarks('not a json string', [])).toThrow();
    expect(() => parseAndDedupeBookmarks(JSON.stringify({ not: 'an array' }), [])).toThrow();
  });

  it('preserves incoming bookmarks sequence order', () => {
    const rawBatch = [
      { id: '1', text: 'First bookmark on X' },
      { id: '2', text: 'Second bookmark on X' },
      { id: '3', text: 'Third bookmark on X' },
    ];

    const result = parseAndDedupeBookmarks(rawBatch, []);
    expect(result.bookmarks.map((b) => b.id)).toEqual(['1', '2', '3']);
  });

  it('correctly aligns existing bookmarks into the incoming scrape order without shoving them to the bottom', () => {
    // Existing bookmark was id '2' with notes and tags
    const preExisting: Bookmark = {
      id: '2',
      text: 'Second bookmark on X',
      author_name: 'Author 2',
      author_handle: '@author2',
      avatar_url: '',
      timestamp: '2026-05-01T00:00:00.000Z',
      url: 'https://x.com/status/2',
      media: [],
      tags: ['my-important-tag'],
      notes: 'My special note',
      imported_at: '2026-05-01T00:00:00.000Z',
      order: 10, // old order
    };

    // Incoming fresh scrape has 3 tweets: 1 (top of X), 2 (middle), 3 (bottom of X)
    const freshScrape = [
      { id: '1', text: 'Top tweet on X' },
      { id: '2', text: 'Second tweet on X' },
      { id: '3', text: 'Third tweet on X' },
    ];

    const result = parseAndDedupeBookmarks(freshScrape, [preExisting]);

    // Order must be strictly ['1', '2', '3'] matching the top-to-bottom scrape!
    expect(result.bookmarks.map((b) => b.id)).toEqual(['1', '2', '3']);

    // Existing bookmark #2 must have its tags and notes preserved
    const item2 = result.bookmarks.find((b) => b.id === '2');
    expect(item2?.tags).toEqual(['my-important-tag']);
    expect(item2?.notes).toBe('My special note');
  });

  it('guarantees identical chronological order regardless of whether new or old batch is imported first (bidirectional stitching)', () => {
    // Batch New (Oct 17): tweets N1, N2, and Bridge
    const batchNew = [
      { id: '2111000000000000001', text: 'Brand new tweet today 1', timestamp: '2026-10-17T12:00:00Z' },
      { id: '2111000000000000002', text: 'Brand new tweet today 2', timestamp: '2026-10-17T11:00:00Z' },
      { id: '2101000000000000001', text: 'Overlapping bridge tweet', timestamp: '2026-09-18T10:00:00Z' },
    ];

    // Batch Old (Sept 19): Bridge, O1, O2
    const batchOld = [
      { id: '2101000000000000001', text: 'Overlapping bridge tweet', timestamp: '2026-09-18T10:00:00Z' },
      { id: '2091000000000000001', text: 'Older archive tweet 1', timestamp: '2026-08-01T10:00:00Z' },
      { id: '2081000000000000001', text: 'Older archive tweet 2', timestamp: '2026-07-01T10:00:00Z' },
    ];

    // Case A: Import New first, then Old second (User's scenario today)
    const step1A = parseAndDedupeBookmarks(batchNew, []);
    const step2A = parseAndDedupeBookmarks(batchOld, step1A.bookmarks);

    // Case B: Import Old first, then New second (Reverse order)
    const step1B = parseAndDedupeBookmarks(batchOld, []);
    const step2B = parseAndDedupeBookmarks(batchNew, step1B.bookmarks);

    const expectedOrder = [
      '2111000000000000001', // Newest 1
      '2111000000000000002', // Newest 2
      '2101000000000000001', // Bridge
      '2091000000000000001', // Old 1
      '2081000000000000001', // Old 2
    ];

    expect(step2A.bookmarks.map((b) => b.id)).toEqual(expectedOrder);
    expect(step2B.bookmarks.map((b) => b.id)).toEqual(expectedOrder);
  });

  it('correctly orders disjoint non-overlapping batches using Twitter Snowflake timestamps', () => {
    // Two batches with 0 overlapping tweets
    const batchRecent = [
      { id: '2111000000000000001', text: 'Recent 1', timestamp: '2026-10-17T12:00:00Z' },
      { id: '2111000000000000002', text: 'Recent 2', timestamp: '2026-10-17T11:00:00Z' },
    ];

    const batchHistorical = [
      { id: '2011000000000000001', text: 'Historical 1', timestamp: '2025-01-01T12:00:00Z' },
      { id: '2011000000000000002', text: 'Historical 2', timestamp: '2025-01-01T11:00:00Z' },
    ];

    // Importing historical into recent should place historical below recent
    const step1 = parseAndDedupeBookmarks(batchRecent, []);
    const step2 = parseAndDedupeBookmarks(batchHistorical, step1.bookmarks);

    expect(step2.bookmarks.map((b) => b.id)).toEqual([
      '2111000000000000001',
      '2111000000000000002',
      '2011000000000000001',
      '2011000000000000002',
    ]);
  });
});
