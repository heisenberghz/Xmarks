import { describe, it, expect } from 'vitest';
import { filterBookmarks, getAllTagsWithCounts, sortBookmarks, parseSafeTimestamp } from './search';
import { Bookmark } from '../types/bookmark';

describe('Search & Tag Filtering Engine', () => {
  const sampleBookmarks: Bookmark[] = [
    {
      id: '1',
      text: 'Exploring Vite and React 19 for ultra fast local web tools.',
      author_name: 'Guillermo',
      author_handle: '@rauchg',
      avatar_url: 'https://pbs.twimg.com/profile_images/rauchg_normal.jpg',
      timestamp: '2026-05-10T12:00:00.000Z',
      url: 'https://x.com/rauchg/status/1',
      media: [],
      tags: ['frontend', 'react'],
      notes: 'Check out the new compiler',
      imported_at: '2026-05-10T12:00:00.000Z',
    },
    {
      id: '2',
      text: 'Deep dive into tokenizer architecture and neural attention.',
      author_name: 'Andrej Karpathy',
      author_handle: '@karpathy',
      avatar_url: '',
      timestamp: '2026-05-11T14:00:00.000Z',
      url: 'https://x.com/karpathy/status/2',
      media: [],
      tags: ['ai', 'llm'],
      notes: 'Great video lesson',
      imported_at: '2026-05-11T14:00:00.000Z',
    },
    {
      id: '3',
      text: 'New shadcn ui components with Tailwind v4 support.',
      author_name: 'shadcn',
      author_handle: '@shadcn',
      avatar_url: '',
      timestamp: '2026-05-12T16:00:00.000Z',
      url: 'https://x.com/shadcn/status/3',
      media: [],
      tags: ['frontend', 'ui'],
      notes: '',
      imported_at: '2026-05-12T16:00:00.000Z',
    },
  ];

  it('matches keyword substrings in text, author name, and handle', () => {
    // Matches text
    expect(filterBookmarks(sampleBookmarks, { searchQuery: 'neural' })).toHaveLength(1);
    expect(filterBookmarks(sampleBookmarks, { searchQuery: 'neural' })[0].id).toBe('2');

    // Matches author display name
    expect(filterBookmarks(sampleBookmarks, { searchQuery: 'guillermo' })).toHaveLength(1);

    // Matches @handle
    expect(filterBookmarks(sampleBookmarks, { searchQuery: '@shadcn' })).toHaveLength(1);

    // Matches notes
    expect(filterBookmarks(sampleBookmarks, { searchQuery: 'compiler' })).toHaveLength(1);
  });

  it('supports multi-keyword search tokens', () => {
    // Both 'vite' and 'react' must match
    expect(filterBookmarks(sampleBookmarks, { searchQuery: 'vite react' })).toHaveLength(1);
    expect(filterBookmarks(sampleBookmarks, { searchQuery: 'vite nonexisting' })).toHaveLength(0);
  });

  it('filters by selected tags using OR mode by default', () => {
    // Either 'react' OR 'ui'
    const results = filterBookmarks(sampleBookmarks, {
      selectedTags: ['react', 'ui'],
      tagMatchMode: 'OR',
    });
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('filters by selected tags using AND mode when specified', () => {
    // Must have both 'frontend' AND 'react'
    const results = filterBookmarks(sampleBookmarks, {
      selectedTags: ['frontend', 'react'],
      tagMatchMode: 'AND',
    });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('combines search query with tag filtering', () => {
    // Has tag 'frontend', but query is 'shadcn'
    const results = filterBookmarks(sampleBookmarks, {
      searchQuery: 'shadcn',
      selectedTags: ['frontend'],
    });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('3');
  });

  it('calculates tag frequencies sorted by highest count', () => {
    const tagCounts = getAllTagsWithCounts(sampleBookmarks);
    expect(tagCounts[0]).toEqual({ tag: 'frontend', count: 2 });
    expect(tagCounts.find((t) => t.tag === 'ai')?.count).toBe(1);
  });

  describe('sortBookmarks', () => {
    const items: Bookmark[] = [
      {
        id: 'A',
        text: 'Tweet A',
        author_name: 'A',
        author_handle: '@a',
        avatar_url: '',
        timestamp: '2026-01-01T00:00:00.000Z',
        url: '',
        media: [],
        tags: [],
        notes: '',
        imported_at: '',
        order: 100, // bookmarked 3rd
      },
      {
        id: 'B',
        text: 'Tweet B',
        author_name: 'B',
        author_handle: '@b',
        avatar_url: '',
        timestamp: '2026-06-01T00:00:00.000Z',
        url: '',
        media: [],
        tags: [],
        notes: '',
        imported_at: '',
        order: 300, // bookmarked 1st (top on X)
      },
      {
        id: 'C',
        text: 'Tweet C',
        author_name: 'C',
        author_handle: '@c',
        avatar_url: '',
        timestamp: '2026-03-01T00:00:00.000Z',
        url: '',
        media: [],
        tags: [],
        notes: '',
        imported_at: '',
        order: 200, // bookmarked 2nd
      },
    ];

    it('sorts by bookmarked order (highest order number first, matching top of X)', () => {
      const sorted = sortBookmarks(items, 'bookmarked');
      expect(sorted.map((i) => i.id)).toEqual(['B', 'C', 'A']);
    });

    it('sorts by tweet date descending (newest tweet first)', () => {
      const sorted = sortBookmarks(items, 'date_desc');
      expect(sorted.map((i) => i.id)).toEqual(['B', 'C', 'A']);
    });

    it('sorts by tweet date ascending (oldest tweet first)', () => {
      const sorted = sortBookmarks(items, 'date_asc');
      expect(sorted.map((i) => i.id)).toEqual(['A', 'C', 'B']);
    });

    it('handles missing, blank, or invalid timestamps safely without NaN sort corruption', () => {
      const corruptItems: Bookmark[] = [
        { ...items[0], id: 'bad-1', timestamp: '' },
        { ...items[1], id: 'good-1', timestamp: '2026-05-01T00:00:00.000Z' },
        { ...items[2], id: 'bad-2', timestamp: 'not-a-valid-date' },
      ];

      expect(parseSafeTimestamp('')).toBe(0);
      expect(parseSafeTimestamp('invalid-date')).toBe(0);

      const sorted = sortBookmarks(corruptItems, 'date_desc');
      expect(sorted[0].id).toBe('good-1');
    });
  });
});
