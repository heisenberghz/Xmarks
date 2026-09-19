import { Bookmark, RawScrapedTweet, ImportResult } from '../types/bookmark';
import { normalizeTweetText } from './linkify';

export function parseSafeTimestamp(ts?: string): number {
  if (!ts) return 0;
  const time = new Date(ts).getTime();
  return isNaN(time) ? 0 : time;
}

/**
 * Validates, normalizes, and merges new scraped bookmarks into existing stored bookmarks.
 * Strictly guarantees that existing user tags and notes are NEVER overwritten.
 * Preserves the original X bookmarks chronological order via an `order` sequence.
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
    existingMap.set(b.id, { ...b });
  }

  const batchSeenIds = new Set<string>();
  const mergedBookmarks: Bookmark[] = [];
  let added = 0;
  let skipped = 0;
  let totalParsed = 0;

  const nowIso = new Date().toISOString();
  // Base sequence for ordering: index 0 gets highest order, preserving X bookmarks order (top bookmark on X first)
  const baseOrder = Date.now();

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (!item || typeof item !== 'object') continue;

    const raw = item as RawScrapedTweet;
    const rawId = raw.id ? String(raw.id).trim() : '';
    if (!rawId) continue;

    totalParsed++;

    // Prevent duplicate entries inside the incoming file itself
    if (batchSeenIds.has(rawId)) {
      skipped++;
      continue;
    }
    batchSeenIds.add(rawId);

    const itemOrder = typeof raw.order === 'number' ? raw.order : (baseOrder - i);

    if (existingMap.has(rawId)) {
      // Tweet already exists in DB:
      // STRICTLY PRESERVE user-authored tags, notes, and original imported_at!
      const existing = existingMap.get(rawId)!;
      existingMap.delete(rawId); // mark as placed

      // Backfill avatar_url or media if missing
      if (!existing.avatar_url && raw.avatar_url) {
        existing.avatar_url = raw.avatar_url;
      }
      if ((!existing.media || existing.media.length === 0) && Array.isArray(raw.media) && raw.media.length > 0) {
        existing.media = raw.media.filter((m): m is string => typeof m === 'string');
      }

      // Update position in sequence to match this fresh import
      existing.order = itemOrder;

      mergedBookmarks.push(existing);
      skipped++;
    } else {
      // Brand new tweet to ingest
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
        order: itemOrder,
      };

      mergedBookmarks.push(bookmark);
      added++;
    }
  }

  // Any remaining bookmarks that were previously saved in DB, but were NOT in this incoming file
  // (e.g., older bookmarks that weren't reached during this scrape session)
  // are preserved and appended after the imported set, keeping their relative order.
  if (existingMap.size > 0) {
    const remaining = Array.from(existingMap.values()).sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return b.order - a.order;
      }
      return parseSafeTimestamp(b.timestamp) - parseSafeTimestamp(a.timestamp);
    });

    const lowestOrder = baseOrder - parsed.length;
    for (let k = 0; k < remaining.length; k++) {
      remaining[k].order = lowestOrder - k - 1;
      mergedBookmarks.push(remaining[k]);
    }
  }

  // Final sanity sort: descending by order so index 0 from X is at the top
  mergedBookmarks.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return b.order - a.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return parseSafeTimestamp(b.timestamp) - parseSafeTimestamp(a.timestamp);
  });

  return {
    added,
    skipped,
    totalParsed,
    bookmarks: mergedBookmarks,
  };
}
