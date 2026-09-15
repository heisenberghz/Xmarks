import { describe, it, expect } from 'vitest';
import { filterBookmarks, getAllTagsWithCounts } from './search';
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
});
