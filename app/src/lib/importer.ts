import { Bookmark, RawScrapedTweet, ImportResult } from '../types/bookmark';
import { normalizeTweetText } from './linkify';

/**
 * Extracts the creation timestamp (in milliseconds) from a 64-bit Twitter Snowflake ID.
 * Twitter Epoch: 1288834974657 ms (Nov 04 2010 01:42:54 UTC).
 */
export function getTweetSnowflakeTime(id?: string): number {
  if (!id) return 0;
  try {
    const big = BigInt(id.trim());
    const time = Number((big >> 22n) + 1288834974657n);
    // Sanity check: between Twitter epoch and year 2040
    if (!isNaN(time) && time > 1288834974657 && time < 2200000000000) {
      return time;
    }
  } catch {
    // Non-numeric or legacy ID fallback
  }
  return 0;
}

export function parseSafeTimestamp(ts?: string): number {
  if (!ts) return 0;
  const time = new Date(ts).getTime();
  return isNaN(time) ? 0 : time;
}

/**
 * Returns the best available chronological timestamp for a tweet.
 * Prefers Twitter Snowflake ID extraction, falling back to tweet ISO timestamp.
 */
export function getBestTweetTime(b: { id?: string; timestamp?: string }): number {
  const sfTime = getTweetSnowflakeTime(b.id);
  if (sfTime > 0) return sfTime;
  return parseSafeTimestamp(b.timestamp);
}

/**
 * Validates, normalizes, and merges new scraped bookmarks into existing stored bookmarks.
 * 
 * Guarantees:
 * 1. Strictly preserves user-authored tags, notes, and original imported_at.
 * 2. Uses Intelligent Sequence Stitching:
 *    - Detects overlapping bookmarks between incoming and existing batches.
 *    - Positions newer bookmarks at the top and older bookmarks at the bottom,
 *      regardless of whether the new or old batch was imported first.
 *    - If no overlap exists, uses Snowflake timestamps to place incoming batch appropriately.
 * 3. Normalizes all records into a clean, compact sequence (N-1 down to 0).
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

  const nowIso = new Date().toISOString();

  // 1. Clean and deduplicate within incoming batch itself
  const incomingClean: RawScrapedTweet[] = [];
  const batchSeenIds = new Set<string>();
  let totalParsed = 0;
  let skippedDuplicates = 0;

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (!item || typeof item !== 'object') continue;

    const raw = item as RawScrapedTweet;
    const rawId = raw.id ? String(raw.id).trim() : '';
    if (!rawId) continue;

    totalParsed++;

    if (batchSeenIds.has(rawId)) {
      skippedDuplicates++;
      continue;
    }
    batchSeenIds.add(rawId);
    incomingClean.push(raw);
  }

  // 2. Prepare existing bookmarks map
  const existingMap = new Map<string, Bookmark>();
  for (let idx = 0; idx < existingBookmarks.length; idx++) {
    const b = existingBookmarks[idx];
    existingMap.set(b.id, {
      ...b,
      // Default initial order if missing: index from top
      order: b.order !== undefined ? b.order : existingBookmarks.length - 1 - idx,
    });
  }

  let added = 0;
  let existingRealigned = 0;

  // 3. Detect overlapping tweets to act as sequence anchors
  const overlaps: { id: string; incomingIdx: number; existingOrder: number }[] = [];
  for (let i = 0; i < incomingClean.length; i++) {
    const rawId = incomingClean[i].id;
    if (existingMap.has(rawId)) {
      const existing = existingMap.get(rawId)!;
      overlaps.push({
        id: rawId,
        incomingIdx: i,
        existingOrder: existing.order ?? (existingBookmarks.length - 1),
      });
    }
  }

  const mergedBookmarks: Bookmark[] = [];

  if (existingBookmarks.length === 0) {
    // Initial import into empty database: assign high relative order from top down
    const baseOrder = 1000000000;
    for (let i = 0; i < incomingClean.length; i++) {
      const raw = incomingClean[i];
      mergedBookmarks.push(createBookmarkFromRaw(raw, nowIso, baseOrder - i));
      added++;
    }
  } else if (overlaps.length > 0) {
    // Overlapping batches detected: stitch sequences together using the anchor bridge!
    // Pick first anchor (or median anchor for stability)
    const anchor = overlaps[0];

    const incomingTargetOrders = new Map<string, number>();
    for (let i = 0; i < incomingClean.length; i++) {
      const rawId = incomingClean[i].id;
      // Sequence order relative to the anchor
      const targetOrder = anchor.existingOrder - (i - anchor.incomingIdx);
      incomingTargetOrders.set(rawId, targetOrder);
    }

    // Merge incoming items
    for (const raw of incomingClean) {
      const rawId = raw.id;
      const targetOrder = incomingTargetOrders.get(rawId)!;

      if (existingMap.has(rawId)) {
        // Existing tweet: strictly preserve tags and notes
        const existing = existingMap.get(rawId)!;
        existingMap.delete(rawId);

        backfillMissingFields(existing, raw);
        existing.order = targetOrder;
        mergedBookmarks.push(existing);
        existingRealigned++;
      } else {
        // Brand-new tweet in incoming batch
        mergedBookmarks.push(createBookmarkFromRaw(raw, nowIso, targetOrder));
        added++;
      }
    }

    // Append remaining existing items that were not in incoming file
    for (const remaining of existingMap.values()) {
      mergedBookmarks.push(remaining);
    }
  } else {
    // Disjoint batches (no overlapping tweets found):
    // Determine whether incoming batch is newer or older using Snowflake & ISO dates
    const incomingAvgTime =
      incomingClean.reduce((sum, b) => sum + getBestTweetTime(b), 0) / (incomingClean.length || 1);
    const existingAvgTime =
      existingBookmarks.reduce((sum, b) => sum + getBestTweetTime(b), 0) / (existingBookmarks.length || 1);

    const isIncomingNewer = incomingAvgTime >= existingAvgTime;

    const maxExistingOrder = existingBookmarks.reduce(
      (max, b) => Math.max(max, b.order ?? 0),
      0
    );
    const minExistingOrder = existingBookmarks.reduce(
      (min, b) => Math.min(min, b.order ?? 0),
      0
    );

    for (let i = 0; i < incomingClean.length; i++) {
      const raw = incomingClean[i];
      const rawId = raw.id;

      const order = isIncomingNewer
        ? maxExistingOrder + (incomingClean.length - i)
        : minExistingOrder - 1 - i;

      if (existingMap.has(rawId)) {
        const existing = existingMap.get(rawId)!;
        existingMap.delete(rawId);
        backfillMissingFields(existing, raw);
        existing.order = order;
        mergedBookmarks.push(existing);
        existingRealigned++;
      } else {
        mergedBookmarks.push(createBookmarkFromRaw(raw, nowIso, order));
        added++;
      }
    }

    for (const remaining of existingMap.values()) {
      mergedBookmarks.push(remaining);
    }
  }

  // 4. Final sort and sequence normalization:
  // Sort descending by order (highest order = top bookmark on X)
  mergedBookmarks.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      if (b.order !== a.order) return b.order - a.order;
    }
    // Fall back to snowflake time if orders collide
    return getBestTweetTime(b) - getBestTweetTime(a);
  });

  // Re-number to clean gapless integers: (total - 1) down to 0
  const totalCount = mergedBookmarks.length;
  for (let k = 0; k < totalCount; k++) {
    mergedBookmarks[k].order = totalCount - 1 - k;
  }

  return {
    added,
    skipped: existingRealigned + skippedDuplicates,
    totalParsed,
    bookmarks: mergedBookmarks,
  };
}

/**
 * Re-indexes any collection of bookmarks by true Twitter timeline chronology
 * using Twitter Snowflake timestamps, preserving all tags, notes, and metadata.
 */
export function realignBookmarksChronology(bookmarks: Bookmark[]): Bookmark[] {
  const sorted = [...bookmarks].sort((a, b) => {
    const timeA = getBestTweetTime(a);
    const timeB = getBestTweetTime(b);
    if (timeB !== timeA) return timeB - timeA;
    return (b.order ?? 0) - (a.order ?? 0);
  });

  const total = sorted.length;
  for (let k = 0; k < total; k++) {
    sorted[k].order = total - 1 - k;
  }

  return sorted;
}

function createBookmarkFromRaw(
  raw: RawScrapedTweet,
  nowIso: string,
  order: number
): Bookmark {
  const rawId = String(raw.id).trim();
  return {
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
    order,
  };
}

function backfillMissingFields(existing: Bookmark, raw: RawScrapedTweet): void {
  if (!existing.avatar_url && raw.avatar_url) {
    existing.avatar_url = raw.avatar_url;
  }
  if ((!existing.media || existing.media.length === 0) && Array.isArray(raw.media) && raw.media.length > 0) {
    existing.media = raw.media.filter((m): m is string => typeof m === 'string');
  }
  if (!existing.author_name && raw.author_name) {
    existing.author_name = raw.author_name;
  }
}
