import React from 'react';
import { tokenizeTextWithLinks } from '../lib/linkify';

interface LinkifiedTextProps {
  text: string;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text }) => {
  if (!text) return null;

  const tokens = tokenizeTextWithLinks(text);

  return (
    <>
      {tokens.map((token, index) => {
        if (token.type === 'link' && token.url) {
          return (
            <a
              key={index}
              href={token.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-accent underline decoration-accent/40 hover:decoration-accent break-all hover:text-accent-hover transition-colors font-medium cursor-pointer"
            >
              {token.content}
            </a>
          );
        }
        return <React.Fragment key={index}>{token.content}</React.Fragment>;
      })}
    </>
  );
};
