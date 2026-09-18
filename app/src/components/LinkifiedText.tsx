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
  if (clean.length > 34) {
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
    return clean.slice(0, 32) + '…';
  }
  return clean;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text }) => {
  if (!text) return null;

  const tokens = tokenizeTextWithLinks(text);

  return (
    <>
      {tokens.map((token, index) => {
        if (token.type === 'link' && token.url) {
          const display = formatDisplayUrl(token.content);
          return (
            <a
              key={index}
              href={token.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-baseline gap-1 font-mono text-[12px] text-teal-400 hover:text-teal-300 bg-teal-500/[0.08] hover:bg-teal-500/[0.15] border border-teal-500/20 hover:border-teal-500/40 px-1.5 py-0.5 rounded my-0.5 transition-all no-underline cursor-pointer align-baseline select-text"
              title={token.url}
            >
              <span className="truncate max-w-[280px]">{display}</span>
              <span className="text-[10px] text-teal-400/70 font-sans select-none">↗</span>
            </a>
          );
        }
        return <React.Fragment key={index}>{token.content}</React.Fragment>;
      })}
    </>
  );
};
