import React, { useState } from 'react';
import { Bookmark } from '../types/bookmark';
import { ExternalLink, Trash2, Edit3, Image as ImageIcon, MessageSquare, User } from 'lucide-react';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onClick: (bookmark: Bookmark) => void;
  onTagClick: (tag: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  onClick,
  onTagClick,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return '';
    }
  };

  const isLongText = bookmark.text.length > 220;
  const displayText = !isExpanded && isLongText ? bookmark.text.slice(0, 220) + '...' : bookmark.text;

  return (
    <article
      onClick={() => onClick(bookmark)}
      className="group relative flex flex-col justify-between break-inside-avoid rounded border border-border bg-card p-3.5 transition-all duration-150 hover:border-borderHover hover:bg-cardHover cursor-pointer shadow-sm"
    >
      <div>
        {/* Header: Avatar, Author & Timestamp */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            {/* Avatar */}
            {bookmark.avatar_url ? (
              <img
                src={bookmark.avatar_url}
                alt={bookmark.author_name || bookmark.author_handle || ''}
                className="h-6 w-6 shrink-0 rounded-full border border-border/60 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-panel border border-border text-muted">
                <User className="h-3 w-3" />
              </div>
            )}
            <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
              <span className="truncate text-xs font-bold text-foreground hover:underline">
                {bookmark.author_name || bookmark.author_handle || 'Unknown'}
              </span>
              {bookmark.author_handle && (
                <span className="truncate text-[11px] text-muted">
                  {bookmark.author_handle}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <time className="text-[10px] text-muted font-mono" title={bookmark.timestamp}>
              {formatDate(bookmark.timestamp)}
            </time>

            {/* Quick Actions Hover Palette */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Open on X"
                className="rounded p-1 text-muted hover:bg-panel hover:text-accent"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(bookmark);
                }}
                title="Edit tags & notes"
                className="rounded p-1 text-muted hover:bg-panel hover:text-foreground"
              >
                <Edit3 className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => onDelete(bookmark.id, e)}
                title="Remove from tool"
                className="rounded p-1 text-muted hover:bg-panel hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Tweet Body */}
        <div className="mt-2 text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap select-text">
          {displayText}
          {isLongText && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="ml-1 font-semibold text-accent hover:underline text-[11px]"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Compact Media Thumbnail */}
        {bookmark.media && bookmark.media.length > 0 && (
          <div className="mt-2.5 overflow-hidden rounded border border-border/80 bg-black/40">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img
                src={bookmark.media[0]}
                alt="Tweet media"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
              {bookmark.media.length > 1 && (
                <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-mono font-medium text-white backdrop-blur-xs">
                  <ImageIcon className="h-2.5 w-2.5" />
                  <span>+{bookmark.media.length - 1}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Notes Preview Badge */}
        {bookmark.notes && (
          <div className="mt-2 flex items-start gap-1 rounded bg-panel px-2 py-1 text-[11px] text-muted border border-border/60">
            <MessageSquare className="h-3 w-3 shrink-0 mt-0.5 text-accent/80" />
            <span className="line-clamp-2 italic text-foreground/80">{bookmark.notes}</span>
          </div>
        )}
      </div>

      {/* Footer: Tag Chips (only shown when tags exist) */}
      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border/40 pt-2">
          {bookmark.tags.map((tag) => (
            <span
              key={tag}
              onClick={(e) => onTagClick(tag, e)}
              className="rounded bg-accent-subtle px-1.5 py-0.5 text-[10px] font-medium text-accent border border-accent/20 hover:border-accent/50 transition cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
};
