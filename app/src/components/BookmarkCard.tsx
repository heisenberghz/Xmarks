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
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  onClick,
  onTagClick,
  onDelete,
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
      className="group relative flex flex-col justify-between break-inside-avoid rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-borderHover hover:bg-cardHover shadow-card hover:shadow-card-hover cursor-pointer select-none"
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
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10 group-hover:ring-white/20 transition-all"
                loading="lazy"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/10 text-muted">
                <User className="h-4 w-4" />
              </div>
            )}
            
            {/* Author Name + Handle stacked vertically */}
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <span className="truncate text-[13.5px] font-semibold text-foreground tracking-tight leading-snug">
                {bookmark.author_name || bookmark.author_handle || 'Unknown'}
              </span>
              {bookmark.author_handle && (
                <span className="truncate text-[11px] text-muted/75 font-mono leading-tight">
                  {bookmark.author_handle}
                </span>
              )}
            </div>
          </div>

          {/* Right Header: Timestamp & Quick Action Buttons */}
          <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
            <time className="text-[11px] text-muted/70 font-mono tracking-tight" title={bookmark.timestamp}>
              {formatDate(bookmark.timestamp)}
            </time>

            {/* Quick Actions Hover Palette */}
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <button
                onClick={handleCopyText}
                title="Copy tweet text"
                className="rounded p-1 text-muted/80 hover:bg-white/[0.08] hover:text-foreground transition-colors"
              >
                {hasCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Open on X"
                className="rounded p-1 text-muted/80 hover:bg-white/[0.08] hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(bookmark.id, e);
                }}
                title="Remove bookmark"
                className="rounded p-1 text-muted/80 hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tweet Text (clean, no clutter badges) */}
        <div className="mt-3">
          <p className="text-[13.5px] leading-[1.65] text-foreground/90 select-text whitespace-pre-wrap font-normal tracking-[-0.005em]">
            <LinkifiedText text={displayText} />
          </p>
          {isLongText && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mt-1.5 inline-block text-[11.5px] font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Media Thumbnail Container with containment ring */}
        {bookmark.media && bookmark.media.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border border-white/[0.08] bg-black/40">
            <div className="relative w-full overflow-hidden max-h-72">
              <img
                src={bookmark.media[0]}
                alt="Tweet media"
                loading="lazy"
                className="w-full h-auto max-h-72 object-cover brightness-[0.96] transition-all duration-300 group-hover:scale-[1.01] group-hover:brightness-100"
              />
              {bookmark.media.length > 1 && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-2 py-0.5 text-[10px] font-mono font-medium text-white/90 border border-white/10 backdrop-blur-xs">
                  <ImageIcon className="h-3 w-3" />
                  <span>+{bookmark.media.length - 1}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personal Notes Preview */}
        {bookmark.notes && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] text-muted border border-white/[0.06]">
            <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-neutral-400" />
            <span className="line-clamp-2 italic text-foreground/80 leading-relaxed">{bookmark.notes}</span>
          </div>
        )}
      </div>

      {/* Footer: Tag Chips */}
      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-2.5">
          {bookmark.tags.map((tag) => {
            const color = getTagColor(tag);
            return (
              <span
                key={tag}
                onClick={(e) => onTagClick(tag, e)}
                className={`rounded px-2 py-0.5 text-[11px] font-medium border transition-colors cursor-pointer hover:brightness-125 ${color.bg} ${color.text} ${color.border}`}
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
