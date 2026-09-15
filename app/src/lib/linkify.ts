/**
 * Utility to normalize tweet text and parse clickable web links.
 * Handles X/Twitter DOM artifacts (e.g., protocol split across newlines like "https://\npdfcn.dev").
 */

export interface TextToken {
  type: 'text' | 'link';
  content: string;
  url?: string;
}

/**
 * Fixes X DOM artifacts where "https://" and the domain were separated across newlines or spaces.
 */
export function normalizeTweetText(text: string): string {
  if (!text) return '';

  return text
    // Normalize non-breaking spaces to standard space
    .replace(/\u00A0/g, ' ')
    // Fix URLs split across newlines: "https://\n  example.com" -> "https://example.com"
    .replace(/(https?:\/\/)\s*(\r?\n)+\s*([a-zA-Z0-9_\-.~%+@]+)/gi, '$1$3');
}

// Regex matching http/https URLs or www. or common domain patterns
const URL_PATTERN = /(https?:\/\/[^\s<]+|www\.[^\s<]+|[a-zA-Z0-9-]+\.(?:com|org|net|io|dev|in|app|co|ai|re|so|me|xyz|tech|page|site|online|store)(?:\/[^\s<]*)?)/gi;

/**
 * Parses text into a stream of plain text and clickable link tokens.
 */
export function tokenizeTextWithLinks(rawText: string): TextToken[] {
  if (!rawText) return [];

  const text = normalizeTweetText(rawText);
  const tokens: TextToken[] = [];
  let lastIndex = 0;

  URL_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = URL_PATTERN.exec(text)) !== null) {
    const matchedUrl = match[0];
    const matchIndex = match.index;

    // Push preceding text if any
    if (matchIndex > lastIndex) {
      tokens.push({
        type: 'text',
        content: text.slice(lastIndex, matchIndex),
      });
    }

    // Separate trailing punctuation (like ., !, ?, ), ], etc.) that shouldn't be part of the URL
    let url = matchedUrl;
    let trailing = '';
    const trailingPunctuation = matchedUrl.match(/([.,;:!?"')\]]+)$/);
    if (trailingPunctuation) {
      trailing = trailingPunctuation[1];
      url = matchedUrl.slice(0, -trailing.length);
    }

    // Ensure link has valid protocol for href
    let href = url;
    if (!href.startsWith('http://') && !href.startsWith('https://')) {
      href = 'https://' + href;
    }

    tokens.push({
      type: 'link',
      content: url,
      url: href,
    });

    if (trailing) {
      tokens.push({
        type: 'text',
        content: trailing,
      });
    }

    lastIndex = matchIndex + matchedUrl.length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return tokens;
}
