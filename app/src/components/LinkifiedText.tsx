import React from 'react';
import { tokenizeTextWithLinks } from '../lib/linkify';

interface LinkifiedTextProps {
  text: string;
}

function formatDisplayUrl(content: string): string {
  // Strip protocol and www for clean display
  let clean = content.replace(/^https?:\/\/(www\.)?/, '');
  // Remove trailing slashes
  clean = clean.replace(/\/+$/, '');
  
  // If the path is excessively long, truncate the middle nicely
  if (clean.length > 32) {
    const slashIndex = clean.indexOf('/');
    if (slashIndex !== -1) {
      const domain = clean.slice(0, slashIndex);
      const rest = clean.slice(slashIndex);
      const lastSlash = rest.lastIndexOf('/');
      if (lastSlash > 0) {
        const lastPart = rest.slice(lastSlash);
        return `${domain}/…${lastPart}`;
      }
    }
    return clean.slice(0, 30) + '…';
  }
  return clean;
}

function getDomain(url: string): string {
  try {
    const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    const parsed = new URL(fullUrl);
    return parsed.hostname;
  } catch {
    return '';
  }
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text }) => {
  if (!text) return null;

  const tokens = tokenizeTextWithLinks(text);

  return (
    <>
      {tokens.map((token, index) => {
        if (token.type === 'link' && token.url) {
          const display = formatDisplayUrl(token.content);
          const domain = getDomain(token.url);
          const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32` : '';

          return (
            <a
              key={index}
              href={token.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-amber-300 hover:text-amber-200 bg-amber-500/[0.08] hover:bg-amber-500/[0.14] border border-amber-500/20 hover:border-amber-500/40 px-2 py-0.5 rounded my-0.5 transition-all no-underline cursor-pointer align-baseline select-text shadow-xs group/link"
              title={token.url}
            >
              {faviconUrl && (
                <img
                  src={faviconUrl}
                  alt=""
                  className="h-3 w-3 rounded-xs shrink-0 opacity-80 group-hover/link:opacity-100 transition-opacity"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className="truncate max-w-[260px] font-medium">{display}</span>
              <span className="text-[10px] text-amber-400/60 font-sans select-none group-hover/link:text-amber-300">↗</span>
            </a>
          );
        }
        return <React.Fragment key={index}>{token.content}</React.Fragment>;
      })}
    </>
  );
};
