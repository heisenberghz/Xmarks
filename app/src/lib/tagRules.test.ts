import { describe, it, expect } from 'vitest';
import {
  extractHashtagsFromText,
  matchCategoriesForBookmark,
  autoTagBookmarkLocally,
  batchTagBookmarksLocally,
} from './tagRules';
import { Bookmark } from '../types/bookmark';

describe('extractHashtagsFromText', () => {
  it('extracts hashtags and downcases them', () => {
    const text = 'Check out this awesome #React and #TailwindCSS library! #AI';
    const hashtags = extractHashtagsFromText(text);
    expect(hashtags).toEqual(['react', 'tailwindcss', 'ai']);
  });

  it('handles text without hashtags cleanly', () => {
    const text = 'Just regular text without any tags.';
    expect(extractHashtagsFromText(text)).toEqual([]);
  });

  it('deduplicates repeating hashtags', () => {
    const text = '#ai is amazing, truly #AI revolutionized everything #ai';
    expect(extractHashtagsFromText(text)).toEqual(['ai']);
  });
});

describe('matchCategoriesForBookmark', () => {
  it('identifies #ai category from keywords like claude, agents, jev', () => {
    const bookmark = {
      text: "here's how JEV works, simplified. Best AI agent framework for claude.",
      author_handle: '@shannholmberg',
      author_name: 'Shann',
      url: 'https://x.com/shannholmberg/status/123',
    };
    const tags = matchCategoriesForBookmark(bookmark);
    expect(tags).toContain('ai');
  });

  it('identifies #dev and #design from URLs like github.com and figma.com', () => {
    const bookmark = {
      text: 'New open source component release! https://github.com/shadcn/ui and figma mockup at https://figma.com/file/xyz',
      author_handle: '@shadcn',
      author_name: 'shadcn',
      url: 'https://x.com/shadcn/status/456',
    };
    const tags = matchCategoriesForBookmark(bookmark);
    expect(tags).toContain('dev');
    expect(tags).toContain('design');
  });

  it('identifies #resources from free programming books domain', () => {
    const bookmark = {
      text: 'Download free python and go books at https://goalkicker.com',
      author_handle: '@curator',
      author_name: 'Tech Curator',
      url: 'https://x.com/curator/status/789',
    };
    const tags = matchCategoriesForBookmark(bookmark);
    expect(tags).toContain('resources');
  });

  it('identifies #health from workout and posture keywords', () => {
    const bookmark = {
      text: 'I stopped doing regular push ups and started this workout routine.',
      author_handle: '@fitnessguy',
      author_name: 'Fitness',
      url: 'https://x.com/fitnessguy/status/101',
    };
    const tags = matchCategoriesForBookmark(bookmark);
    expect(tags).toContain('health');
  });

  it('identifies #watchlist from series and thriller recommendations', () => {
    const bookmark = {
      text: 'Top 10 CIA series with the best thriller plot. A thread:',
      author_handle: '@filmfusion_x',
      author_name: 'Film Fusion',
      url: 'https://x.com/filmfusion_x/status/102',
    };
    const tags = matchCategoriesForBookmark(bookmark);
    expect(tags).toContain('watchlist');
  });

  it('identifies #ai from author handle patterns even when text is short', () => {
    const bookmark = {
      text: 'New model update live today',
      author_handle: '@MiniMaxAgent',
      author_name: 'MiniMax',
      url: 'https://x.com/MiniMaxAgent/status/103',
    };
    const tags = matchCategoriesForBookmark(bookmark);
    expect(tags).toContain('ai');
  });
});

describe('autoTagBookmarkLocally', () => {
  const sampleBookmark: Bookmark = {
    id: '1',
    text: 'Learn how to build full-stack React apps with Tailwind CSS and Next.js! #WebDev',
    author_handle: '@leerob',
    author_name: 'Lee Robinson',
    avatar_url: '',
    timestamp: '2026-05-10T12:00:00Z',
    url: 'https://x.com/leerob/status/1',
    media: [],
    tags: ['my-custom-tag'],
    notes: '',
    imported_at: '2026-05-10T12:00:00Z',
  };

  it('preserves existing manual tags and appends matched categories', () => {
    const result = autoTagBookmarkLocally(sampleBookmark);
    expect(result).toContain('my-custom-tag');
    expect(result).toContain('dev');
  });

  it('respects maxTags limit without dropping existing manual tags', () => {
    const result = autoTagBookmarkLocally(sampleBookmark, 3);
    expect(result).toContain('my-custom-tag');
    expect(result.length).toBeLessThanOrEqual(3);
  });
});

describe('batchTagBookmarksLocally', () => {
  const bookmarks: Bookmark[] = [
    {
      id: '1',
      text: 'Deep dive into Claude 3.5 Sonnet and autonomous agents.',
      author_handle: '@test',
      author_name: 'Tester',
      avatar_url: '',
      timestamp: '2026-05-10T12:00:00Z',
      url: 'https://x.com/test/status/1',
      media: [],
      tags: [],
      notes: '',
      imported_at: '2026-05-10T12:00:00Z',
    },
    {
      id: '2',
      text: 'Free handbook for learning PostgreSQL and Docker https://goalkicker.com',
      author_handle: '@devtips',
      author_name: 'Dev Tips',
      avatar_url: '',
      timestamp: '2026-05-10T12:00:00Z',
      url: 'https://x.com/devtips/status/2',
      media: [],
      tags: ['already-tagged'],
      notes: '',
      imported_at: '2026-05-10T12:00:00Z',
    },
  ];

  it('tags untagged bookmarks and skips already tagged when untaggedOnly=true', () => {
    const { updatedBookmarks, changedCount } = batchTagBookmarksLocally(bookmarks, {
      untaggedOnly: true,
    });

    expect(changedCount).toBe(1);
    expect(updatedBookmarks[0].tags).toContain('ai');
    expect(updatedBookmarks[1].tags).toEqual(['already-tagged']);
  });

  it('enhances both bookmarks when untaggedOnly=false', () => {
    const { updatedBookmarks, changedCount } = batchTagBookmarksLocally(bookmarks, {
      untaggedOnly: false,
    });

    expect(changedCount).toBe(2);
    expect(updatedBookmarks[0].tags).toContain('ai');
    expect(updatedBookmarks[1].tags).toContain('already-tagged');
    expect(updatedBookmarks[1].tags).toContain('resources');
  });

  it('assigns #untagged fallback to bookmarks that do not match any category', () => {
    const unmatchedBookmark: Bookmark = {
      id: '3',
      text: 'China found something better than oil',
      author_handle: '@maxinomics',
      author_name: 'Max',
      avatar_url: '',
      timestamp: '2026-05-10T12:00:00Z',
      url: 'https://x.com/maxinomics/status/3',
      media: [],
      tags: [],
      notes: '',
      imported_at: '2026-05-10T12:00:00Z',
    };

    const tags = autoTagBookmarkLocally(unmatchedBookmark);
    expect(tags).toEqual(['untagged']);
  });

  it('replaces #untagged label when real category tags are discovered later', () => {
    const previouslyUntagged: Bookmark = {
      id: '4',
      text: 'Deep dive into React 19 compiler and Next.js',
      author_handle: '@dev',
      author_name: 'Dev',
      avatar_url: '',
      timestamp: '2026-05-10T12:00:00Z',
      url: 'https://x.com/dev/status/4',
      media: [],
      tags: ['untagged'],
      notes: '',
      imported_at: '2026-05-10T12:00:00Z',
    };

    const tags = autoTagBookmarkLocally(previouslyUntagged);
    expect(tags).toContain('dev');
    expect(tags).not.toContain('untagged');
  });
});
