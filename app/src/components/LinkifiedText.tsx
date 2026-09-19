import React from 'react';
import { tokenizeTextWithLinks } from '../lib/linkify';
import { Globe } from 'lucide-react';

interface LinkifiedTextProps {
  text: string;
}

function formatDisplayUrl(content: string): string {
  // Strip protocol and www for clean display
  let clean = content.replace(/^https?:\/\/(www\.)?/, '');
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
              className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 hover:border-zinc-600 px-2 py-0.5 rounded my-0.5 transition-colors no-underline cursor-pointer align-baseline select-text group/link"
              title={token.url}
            >
              <Globe className="h-3 w-3 shrink-0 text-zinc-400 group-hover/link:text-zinc-200 transition-colors" />
              <span className="truncate max-w-[260px] font-medium">{display}</span>
              <span className="text-[10px] text-zinc-500 font-sans select-none group-hover/link:text-white">↗</span>
            </a>
          );
        }
        return <React.Fragment key={index}>{token.content}</React.Fragment>;
      })}
    </>
  );
};
