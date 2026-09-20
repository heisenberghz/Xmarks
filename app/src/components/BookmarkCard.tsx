import React, { useState } from 'react';
import { Bookmark } from '../types/bookmark';
import { ExternalLink, Trash2, Image as ImageIcon, MessageSquare, User, Copy, Check } from 'lucide-react';
import { LinkifiedText } from './LinkifiedText';
import { getTagColor } from '../lib/tagColors';
import { toast } from 'sonner';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onClick: (bookmark: Bookmark) => void;
  onTagClick: (tag: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isSelected?: boolean;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  onClick,
  onTagClick,
  onDelete,
  isSelected = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

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

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bookmark.text);
    setHasCopied(true);
    toast.success('Tweet text copied');
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <article
      onClick={() => onClick(bookmark)}
      className={`group relative flex flex-col justify-between break-inside-avoid rounded-2xl border bg-card p-4 transition-colors duration-150 cursor-pointer select-none ${
        isSelected
          ? 'border-black dark:border-accent/80 bg-cardHover ring-2 ring-black/15 dark:ring-accent/20'
          : 'border-black dark:border-slate-700 hover:border-black/75 dark:hover:border-slate-500 hover:bg-cardHover'
      }`}
    >
      <div>
        {/* Header: Avatar, Stacked Author Info & Timestamp */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1 flex items-center gap-2.5">
            {/* Avatar */}
            {bookmark.avatar_url ? (
              <img
                src={bookmark.avatar_url}
                alt={bookmark.author_name || bookmark.author_handle || ''}
                className="h-8 w-8 shrink-0 rounded-full object-cover border border-border"
                loading="lazy"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel border border-border text-muted">
                <User className="h-4 w-4" />
              </div>
            )}
            
            {/* Stacked Author Name + Handle */}
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <span className="truncate text-[13.5px] font-semibold text-foreground tracking-tight leading-snug">
                {bookmark.author_name || bookmark.author_handle || 'Unknown'}
              </span>
              {bookmark.author_handle && (
                <span className="truncate text-[11px] text-muted font-mono leading-tight">
                  {bookmark.author_handle}
                </span>
              )}
            </div>
          </div>

          {/* Right Header: Timestamp & Action Buttons */}
          <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
            <time className="text-[11px] text-muted font-mono tracking-tight" title={bookmark.timestamp}>
              {formatDate(bookmark.timestamp)}
            </time>

            {/* Quick Actions Hover Palette */}
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <button
                onClick={handleCopyText}
                title="Copy tweet text"
                className="rounded p-1 text-muted hover:bg-panel hover:text-foreground transition-colors"
              >
                {hasCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Open on X"
                className="rounded p-1 text-muted hover:bg-panel hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(bookmark.id, e);
                }}
                title="Remove bookmark"
                className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tweet Text */}
        <div className="mt-3">
          <p className="text-[13.5px] leading-[1.65] text-foreground/90 select-text whitespace-pre-wrap font-normal">
            <LinkifiedText text={displayText} />
          </p>
          {isLongText && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mt-1.5 inline-block text-[11.5px] font-semibold text-muted hover:text-foreground transition-colors"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Media Thumbnail Container */}
        {bookmark.media && bookmark.media.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-slate-100 dark:bg-black/40">
            <div className="relative w-full overflow-hidden max-h-72">
              <img
                src={bookmark.media[0]}
                alt="Tweet media"
                loading="lazy"
                className="w-full h-auto max-h-72 object-cover transition-opacity duration-200"
              />
              {bookmark.media.length > 1 && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-mono font-medium text-white border border-border">
                  <ImageIcon className="h-3 w-3" />
                  <span>+{bookmark.media.length - 1}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personal Notes Preview */}
        {bookmark.notes && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-panel/70 px-2.5 py-1.5 text-[11.5px] text-muted border border-border">
            <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted" />
            <span className="line-clamp-2 italic text-foreground/80 leading-relaxed">{bookmark.notes}</span>
          </div>
        )}
      </div>

      {/* Footer: Tag Chips */}
      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2.5">
          {bookmark.tags.map((tag) => {
            const color = getTagColor(tag);
            return (
              <span
                key={tag}
                onClick={(e) => onTagClick(tag, e)}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium border transition-colors cursor-pointer hover:border-borderHover hover:text-foreground ${color.bg} ${color.text} ${color.border}`}
              >
                #{tag}
              </span>
            );
          })}
        </div>
      )}
    </article>
  );
};
