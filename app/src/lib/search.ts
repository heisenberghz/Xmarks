import { Bookmark, SortMode } from '../types/bookmark';

export function parseSafeTimestamp(ts?: string): number {
  if (!ts) return 0;
  const time = new Date(ts).getTime();
  return isNaN(time) ? 0 : time;
}

export interface FilterOptions {
  searchQuery?: string;
  selectedTags?: string[];
  tagMatchMode?: 'OR' | 'AND';
  sortMode?: SortMode;
}

/**
 * Sorts an array of bookmarks according to the chosen SortMode.
 * - 'bookmarked': Original sequence from X (the top bookmark on X appears first).
 * - 'date_desc': Tweet publication date, newest first.
 * - 'date_asc': Tweet publication date, oldest first.
 */
export function sortBookmarks(bookmarks: Bookmark[], sortMode: SortMode = 'bookmarked'): Bookmark[] {
  return [...bookmarks].sort((a, b) => {
    if (sortMode === 'date_desc') {
      const tA = parseSafeTimestamp(a.timestamp);
      const tB = parseSafeTimestamp(b.timestamp);
      if (tB !== tA) return tB - tA;
      return (b.order ?? 0) - (a.order ?? 0);
    }
    if (sortMode === 'date_asc') {
      const tA = parseSafeTimestamp(a.timestamp);
      const tB = parseSafeTimestamp(b.timestamp);
      if (tA !== tB) return tA - tB;
      return (a.order ?? 0) - (b.order ?? 0);
    }

    // Default: 'bookmarked' (Original X bookmarks order: index 0 is first)
    const oA = a.order;
    const oB = b.order;
    if (oA !== undefined && oB !== undefined) {
      if (oB !== oA) return oB - oA;
    } else if (oA !== undefined) {
      return -1;
    } else if (oB !== undefined) {
      return 1;
    }

    // Fall back to tweet timestamp if order is missing
    const tA = parseSafeTimestamp(a.timestamp);
    const tB = parseSafeTimestamp(b.timestamp);
    return tB - tA;
  });
}

/**
 * Filters and sorts bookmarks by search query, tag selection, and sort mode.
 * Fast, pure client-side filter designed for personal collections (thousands of records).
 */
export function filterBookmarks(
  bookmarks: Bookmark[],
  options: FilterOptions = {}
): Bookmark[] {
  const { searchQuery = '', selectedTags = [], tagMatchMode = 'OR', sortMode } = options;

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchTokens = trimmedQuery.length > 0 ? trimmedQuery.split(/\s+/).filter(Boolean) : [];
  const normalizedSelectedTags = selectedTags.map((t) => t.toLowerCase());

  const filtered = bookmarks.filter((bookmark) => {
    // 1. Tag Filtering
    if (normalizedSelectedTags.length > 0) {
      const bookmarkTags = (bookmark.tags || []).map((t) => t.toLowerCase());

      if (tagMatchMode === 'AND') {
        const matchesAll = normalizedSelectedTags.every((t) => bookmarkTags.includes(t));
        if (!matchesAll) return false;
      } else {
        // Default OR mode
        const matchesAny = normalizedSelectedTags.some((t) => bookmarkTags.includes(t));
        if (!matchesAny) return false;
      }
    }

    // 2. Search Query Filtering
    if (searchTokens.length > 0) {
      const textCorpus = [
        bookmark.text || '',
        bookmark.author_name || '',
        bookmark.author_handle || '',
        bookmark.notes || '',
        ...(bookmark.tags || []),
      ]
        .join(' ')
        .toLowerCase();

      // All search tokens must appear in the item corpus
      const matchesSearch = searchTokens.every((token) => textCorpus.includes(token));
      if (!matchesSearch) return false;
    }

    return true;
  });

  return sortMode ? sortBookmarks(filtered, sortMode) : filtered;
}

/**
 * Extracts a unique list of all tags used across all bookmarks with their counts.
 */
export function getAllTagsWithCounts(bookmarks: Bookmark[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();

  for (const b of bookmarks) {
    if (!b.tags) continue;
    for (const tag of b.tags) {
      const clean = tag.trim();
      if (!clean) continue;
      map.set(clean, (map.get(clean) || 0) + 1);
    }
  }

  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
