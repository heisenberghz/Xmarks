import { describe, it, expect } from 'vitest';
import { parseAndDedupeBookmarks } from './importer';
import { Bookmark } from '../types/bookmark';

describe('Importer & Deduplication Engine', () => {
  const existingBookmark: Bookmark = {
    id: '1001',
    text: 'Existing bookmark text',
    author_name: 'Existing Author',
    author_handle: '@existing',
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
});
