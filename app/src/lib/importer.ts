import { Bookmark, RawScrapedTweet, ImportResult } from '../types/bookmark';
import { normalizeTweetText } from './linkify';

/**
 * Validates, normalizes, and merges new scraped bookmarks into existing stored bookmarks.
 * Strictly guarantees that existing user tags and notes are NEVER overwritten.
 * 
 * @param input - Raw JSON string or parsed array of tweet objects
 * @param existingBookmarks - Currently stored bookmarks
 * @returns ImportResult containing counts and merged bookmark array
 */
export function parseAndDedupeBookmarks(
  input: string | RawScrapedTweet[],
  existingBookmarks: Bookmark[] = []
): ImportResult {
  let parsed: unknown[];

  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
      
    } catch {
      throw new Error('Invalid JSON format: Failed to parse input file.');
    }
  } else {
    parsed = input;
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Invalid format: Expected a JSON array of bookmarks.');
  }

  const existingMap = new Map<string, Bookmark>();
  for (const b of existingBookmarks) {
    existingMap.set(b.id, b);
  }

  const batchSeenIds = new Set<string>();
  const newItems: Bookmark[] = [];
  let skipped = 0;
  let totalParsed = 0;

  const nowIso = new Date().toISOString();

  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;

    const raw = item as RawScrapedTweet;
    const rawId = raw.id ? String(raw.id).trim() : '';
    if (!rawId) continue;

    totalParsed++;

    // Check if duplicate of an existing bookmark OR duplicate within current batch
    if (existingMap.has(rawId) || batchSeenIds.has(rawId)) {
      skipped++;
      continue;
    }

    batchSeenIds.add(rawId);

    const bookmark: Bookmark = {
      id: rawId,
      text: typeof raw.text === 'string' ? normalizeTweetText(raw.text) : '',
      author_name: typeof raw.author_name === 'string' ? raw.author_name : '',
      author_handle: typeof raw.author_handle === 'string' ? raw.author_handle : '',
      avatar_url: typeof raw.avatar_url === 'string' ? raw.avatar_url : '',
      timestamp: typeof raw.timestamp === 'string' && raw.timestamp ? raw.timestamp : nowIso,
      url: typeof raw.url === 'string' && raw.url ? raw.url : `https://x.com/i/status/${rawId}`,
      media: Array.isArray(raw.media) ? raw.media.filter((m): m is string => typeof m === 'string') : [],
      tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [],
      notes: typeof raw.notes === 'string' ? raw.notes : '',
      imported_at: typeof raw.imported_at === 'string' && raw.imported_at ? raw.imported_at : nowIso,
    };

    newItems.push(bookmark);
  }

  // Combined bookmarks: new bookmarks prepended or appended
  const merged = [...newItems, ...existingBookmarks];

  return {
    added: newItems.length,
    skipped,
    totalParsed,
    bookmarks: merged,
  };
}
