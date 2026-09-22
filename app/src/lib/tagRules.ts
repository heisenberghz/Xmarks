import { Bookmark } from '../types/bookmark';
import { TAXONOMY_CATEGORIES, TaxonomyCategory } from './tagTaxonomy';

/**
 * Extracts hashtag words directly from tweet text.
 * e.g. "Learning #react and #TailwindCSS!" -> ["react", "tailwindcss"]
 */
export function extractHashtagsFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#([a-zA-Z0-9_]{2,30})/g);
  if (!matches) return [];

  return Array.from(
    new Set(
      matches.map((ht) => ht.replace(/^#/, '').toLowerCase().trim())
    )
  );
}

/**
 * Checks whether a text contains a keyword with proper boundary handling.
 * Avoids false substring matches (e.g. "rain" in "training").
 */
function matchesKeyword(text: string, keyword: string): boolean {
  // If keyword contains space or special chars (e.g. 'fine tune', 'push ups', 'gpt-4'), match directly
  if (keyword.includes(' ') || keyword.includes('-')) {
    return text.includes(keyword);
  }
  
  // For short/single words, ensure word-boundary matching
  const regex = new RegExp(`\\b${keyword}\\b`, 'i');
  return regex.test(text);
}

/**
 * Determines which taxonomy categories match a given bookmark.
 */
export function matchCategoriesForBookmark(
  bookmark: Pick<Bookmark, 'text' | 'author_handle' | 'author_name' | 'url'>,
  categories: TaxonomyCategory[] = TAXONOMY_CATEGORIES
): string[] {
  const text = (bookmark.text || '').toLowerCase();
  const authorHandle = (bookmark.author_handle || '').toLowerCase();
  const authorName = (bookmark.author_name || '').toLowerCase();
  const fullText = `${text} ${authorHandle} ${authorName}`;

  const matchedTags = new Set<string>();

  for (const cat of categories) {
    // 1. Check keyword triggers against tweet text
    for (const kw of cat.keywords) {
      if (matchesKeyword(text, kw)) {
        matchedTags.add(cat.tag);
        break;
      }
    }

    // 2. Check author pattern triggers
    if (cat.authorPatterns) {
      for (const pattern of cat.authorPatterns) {
        if (authorHandle.includes(pattern) || authorName.includes(pattern)) {
          matchedTags.add(cat.tag);
          break;
        }
      }
    }

    // 3. Check domain triggers in text URLs
    if (cat.domains) {
      for (const domain of cat.domains) {
        if (text.includes(domain)) {
          matchedTags.add(cat.tag);
          break;
        }
      }
    }
  }

  return Array.from(matchedTags);
}

/**
 * Auto-tags a single bookmark using local offline rules and native hashtags.
 * Guaranteed to NEVER remove or overwrite existing manual tags.
 * 
 * @param bookmark The bookmark to tag
 * @param maxTags Maximum total tags to assign (default: 4)
 * @returns An array of tags combining existing manual tags and new matched tags
 */
export function autoTagBookmarkLocally(
  bookmark: Bookmark,
  maxTags: number = 4
): string[] {
  const existingTags = bookmark.tags || [];
  const existingSet = new Set(existingTags.map((t) => t.toLowerCase()));

  // 1. Find taxonomy category matches
  const categoryTags = matchCategoriesForBookmark(bookmark);

  // 2. Extract in-tweet hashtags (filtering out noisy or too generic ones)
  const rawHashtags = extractHashtagsFromText(bookmark.text || '');
  const validHashtags = rawHashtags.filter(
    (ht) => !['the', 'and', 'with', 'from', 'this', 'that', '1', '2', '3'].includes(ht)
  );

  // Combine new candidates: category tags first, then relevant hashtags
  const candidates: string[] = [];
  for (const tag of categoryTags) {
    if (!existingSet.has(tag) && !candidates.includes(tag)) {
      candidates.push(tag);
    }
  }

  for (const ht of validHashtags) {
    if (!existingSet.has(ht) && !candidates.includes(ht)) {
      candidates.push(ht);
    }
  }

  // Preserve all existing tags, then fill remaining slots up to maxTags
  const result = [...existingTags];
  for (const candidate of candidates) {
    if (result.length >= maxTags && existingTags.length > 0) break;
    if (result.length >= Math.max(maxTags, existingTags.length + 2)) break;
    result.push(candidate);
  }

  return result;
}

/**
 * Batch processes an array of bookmarks, returning updated bookmarks with new tags applied.
 */
export function batchTagBookmarksLocally(
  bookmarks: Bookmark[],
  options: { untaggedOnly?: boolean; maxTags?: number } = {}
): { updatedBookmarks: Bookmark[]; changedCount: number } {
  const { untaggedOnly = false, maxTags = 4 } = options;
  let changedCount = 0;

  const updatedBookmarks = bookmarks.map((b) => {
    // If untaggedOnly is true, skip bookmarks that already have at least 1 tag
    if (untaggedOnly && b.tags && b.tags.length > 0) {
      return b;
    }

    const newTags = autoTagBookmarkLocally(b, maxTags);
    const hasChanged =
      newTags.length !== (b.tags || []).length ||
      newTags.some((t, i) => t !== (b.tags || [])[i]);

    if (hasChanged) {
      changedCount++;
      return { ...b, tags: newTags };
    }
    return b;
  });

  return { updatedBookmarks, changedCount };
}
