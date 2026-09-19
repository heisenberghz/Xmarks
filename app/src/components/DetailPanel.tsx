import React, { useState, useEffect, useRef } from 'react';
import { Bookmark } from '../types/bookmark';
import {
  X,
  ExternalLink,
  Trash2,
  Tag,
  FileText,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Maximize2,
  Clock,
  Download,
  Share2,
} from 'lucide-react';
import { LinkifiedText } from './LinkifiedText';
import { getTagColor } from '../lib/tagColors';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface DetailPanelProps {
  bookmark: Bookmark | null;
  onClose: () => void;
  onUpdateBookmark: (updated: Bookmark) => void;
  onDeleteBookmark: (id: string) => void;
  allExistingTags: string[];
  currentIndex?: number;
  totalCount?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  bookmark,
  onClose,
  onUpdateBookmark,
  onDeleteBookmark,
  allExistingTags,
  currentIndex,
  totalCount,
  onNavigate,
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [hasCopiedId, setHasCopiedId] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const tagInputRef = useRef<HTMLInputElement>(null);
  const notesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state with incoming bookmark
  useEffect(() => {
    if (bookmark) {
      setTags(bookmark.tags || []);
      setNotes(bookmark.notes || '');
      setNewTagInput('');
      setIsAddingTag(false);
      setLightboxIndex(null);
      setIsSavingNotes(false);
    }
  }, [bookmark?.id]);

  // Focus tag input when isAddingTag opens
  useEffect(() => {
    if (isAddingTag) {
      tagInputRef.current?.focus();
    }
  }, [isAddingTag]);

  // Auto-save notes with 600ms debounce
  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (!bookmark) return;

    setIsSavingNotes(true);
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }

    notesTimeoutRef.current = setTimeout(() => {
      onUpdateBookmark({
        ...bookmark,
        notes: val,
      });
      setIsSavingNotes(false);
    }, 600);
  };

  const handleNotesBlur = () => {
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }
    if (bookmark && notes !== (bookmark.notes || '')) {
      onUpdateBookmark({
        ...bookmark,
        notes,
      });
      setIsSavingNotes(false);
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    if (!bookmark) return;
    const clean = tagToAdd.trim().replace(/^#/, '').toLowerCase();
    if (!clean) return;
    if (tags.includes(clean)) {
      setNewTagInput('');
      setIsAddingTag(false);
      return;
    }
    const updatedTags = [...tags, clean];
    setTags(updatedTags);
    setNewTagInput('');
    setIsAddingTag(false);
    onUpdateBookmark({
      ...bookmark,
      tags: updatedTags,
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!bookmark) return;
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    onUpdateBookmark({
      ...bookmark,
      tags: updatedTags,
    });
  };

  const handleCopyText = () => {
    if (!bookmark) return;
    navigator.clipboard.writeText(bookmark.text);
    setHasCopiedText(true);
    toast.success('Tweet text copied to clipboard');
    setTimeout(() => setHasCopiedText(false), 2000);
  };

  const handleCopyLink = () => {
    if (!bookmark) return;
    navigator.clipboard.writeText(bookmark.url);
    setHasCopiedLink(true);
    toast.success('Tweet link copied to clipboard');
    setTimeout(() => setHasCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    if (!bookmark) return;
    navigator.clipboard.writeText(bookmark.id);
    setHasCopiedId(true);
    toast.success('Tweet ID copied');
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  // Keyboard navigation listener (Esc, j, k, arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If lightbox is open, handle lightbox controls
      if (lightboxIndex !== null && bookmark?.media) {
        if (e.key === 'Escape') {
          setLightboxIndex(null);
          e.stopPropagation();
          return;
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          setLightboxIndex((prev) => (prev !== null && prev < bookmark.media.length - 1 ? prev + 1 : 0));
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : bookmark.media.length - 1));
          return;
        }
        return;
      }

      // If typing inside an input or textarea, don't trigger panel shortcuts
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement)?.blur();
          setIsAddingTag(false);
          e.stopPropagation();
        }
        return;
      }

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (onNavigate) {
        if (e.key === 'j' || e.key === 'ArrowDown') {
          e.preventDefault();
          onNavigate('next');
        } else if (e.key === 'k' || e.key === 'ArrowUp') {
          e.preventDefault();
          onNavigate('prev');
        }
      }

      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleCopyText();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, bookmark, onClose, onNavigate]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const suggestedTags = allExistingTags
    .filter((t) => !tags.includes(t.toLowerCase()))
    .slice(0, 8);

  const hasPrev = currentIndex !== undefined && currentIndex > 0;
  const hasNext = currentIndex !== undefined && totalCount !== undefined && currentIndex < totalCount - 1;

  return (
    <AnimatePresence>
      {bookmark && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Slide-out Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative z-10 flex h-full w-full sm:max-w-xl md:max-w-2xl lg:max-w-[680px] flex-col border-l border-border bg-panel shadow-none select-text"
          >
            {/* 1. Sleek Command Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-panel shrink-0 select-none">
              {/* Left: Breadcrumb & Item Position */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-card border border-border font-mono text-[10px] font-bold text-foreground shrink-0">
                  𝕏
                </span>
                <span className="text-muted/60 text-xs">/</span>
                <span className="truncate text-xs font-mono font-medium text-foreground">
                  {bookmark.author_handle || bookmark.author_name || 'tweet'}
                </span>

                {currentIndex !== undefined && totalCount !== undefined && (
                  <span className="ml-1 rounded bg-card px-2 py-0.5 font-mono text-[10.5px] text-muted border border-border shrink-0">
                    {currentIndex + 1} of {totalCount}
                  </span>
                )}
              </div>

              {/* Right: Quick Action Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Prev / Next Navigation Buttons */}
                {onNavigate && (
                  <div className="flex items-center rounded border border-border bg-card p-0.5 mr-1">
                    <button
                      onClick={() => onNavigate('prev')}
                      disabled={!hasPrev}
                      className="rounded p-1 text-muted hover:text-foreground hover:bg-cardHover disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Previous bookmark (K or ↑)"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onNavigate('next')}
                      disabled={!hasNext}
                      className="rounded p-1 text-muted hover:text-foreground hover:bg-cardHover disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Next bookmark (J or ↓)"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Copy Tweet Text */}
                <button
                  onClick={handleCopyText}
                  className="rounded border border-border bg-card p-1.5 text-muted hover:text-foreground hover:border-borderHover hover:bg-cardHover transition-colors"
                  title="Copy tweet text (C)"
                >
                  {hasCopiedText ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>

                {/* Copy Tweet URL */}
                <button
                  onClick={handleCopyLink}
                  className="rounded border border-border bg-card p-1.5 text-muted hover:text-foreground hover:border-borderHover hover:bg-cardHover transition-colors"
                  title="Copy link to tweet"
                >
                  {hasCopiedLink ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Share2 className="h-3.5 w-3.5" />
                  )}
                </button>

                {/* Open External on X */}
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded border border-border bg-card hover:bg-cardHover hover:border-borderHover px-2.5 py-1 text-xs font-medium text-foreground transition-colors"
                  title="Open original tweet on X"
                >
                  <span className="text-[11px]">Open</span>
                  <ExternalLink className="h-3 w-3 text-muted" />
                </a>

                <div className="h-4 w-[1px] bg-border mx-0.5" />

                {/* Close Drawer Button */}
                <button
                  onClick={onClose}
                  className="rounded border border-border bg-card p-1.5 text-muted hover:text-foreground hover:border-borderHover hover:bg-cardHover transition-colors"
                  title="Close (Esc)"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Scrollable Body Canvas */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {/* Author & Timestamp Row */}
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-border/70">
                <div className="flex items-center gap-3 min-w-0">
                  {bookmark.avatar_url ? (
                    <img
                      src={bookmark.avatar_url}
                      alt={bookmark.author_name || bookmark.author_handle || ''}
                      className="h-10 w-10 shrink-0 rounded-full object-cover border border-border"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card border border-border text-muted">
                      <User className="h-5 w-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground tracking-tight leading-snug truncate">
                      {bookmark.author_name || bookmark.author_handle || 'Unknown Author'}
                    </div>
                    {bookmark.author_handle && (
                      <div className="text-xs text-muted font-mono leading-tight mt-0.5 truncate">
                        {bookmark.author_handle}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 font-mono text-muted text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted/60" />
                    <time dateTime={bookmark.timestamp}>
                      {formatDate(bookmark.timestamp)}
                    </time>
                  </div>
                  {bookmark.timestamp && (
                    <span className="text-[10px] text-muted/60 mt-0.5">
                      {formatTime(bookmark.timestamp)}
                    </span>
                  )}
                </div>
              </div>

              {/* Tweet Reading Zone */}
              <div className="space-y-1">
                <div className="text-[14.5px] leading-[1.7] text-foreground font-normal whitespace-pre-wrap select-text">
                  <LinkifiedText text={bookmark.text} />
                </div>
              </div>

              {/* Media Gallery with Lightbox Launch */}
              {bookmark.media && bookmark.media.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                    <span className="uppercase tracking-wider">
                      Media ({bookmark.media.length})
                    </span>
                    <span className="text-[10px] text-muted/60">Click image to inspect</span>
                  </div>

                  {bookmark.media.length === 1 ? (
                    /* Single Media Item: Large, crisp viewport */
                    <div
                      onClick={() => setLightboxIndex(0)}
                      className="group relative cursor-zoom-in overflow-hidden rounded-lg border border-border bg-black/40 transition-colors hover:border-borderHover"
                    >
                      <img
                        src={bookmark.media[0]}
                        alt="Attachment 1"
                        className="w-full max-h-[460px] object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
                        loading="lazy"
                      />
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded bg-black/85 px-2 py-1 text-[10.5px] font-mono text-slate-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100 border border-border pointer-events-none select-none">
                        <Maximize2 className="h-3 w-3" />
                        <span>Expand</span>
                      </div>
                    </div>
                  ) : bookmark.media.length === 2 ? (
                    /* Two Media Items: 2-Column Side-by-Side */
                    <div className="grid grid-cols-2 gap-2.5">
                      {bookmark.media.map((src, i) => (
                        <div
                          key={i}
                          onClick={() => setLightboxIndex(i)}
                          className="group relative cursor-zoom-in overflow-hidden rounded-lg border border-border bg-black/40 aspect-[4/3] transition-colors hover:border-borderHover"
                        >
                          <img
                            src={src}
                            alt={`Attachment ${i + 1}`}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                          <div className="absolute top-2 right-2 rounded bg-black/85 p-1 text-slate-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100 border border-border pointer-events-none">
                            <Maximize2 className="h-3 w-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* 3+ Media Items: Grid Layout */
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {bookmark.media.map((src, i) => (
                        <div
                          key={i}
                          onClick={() => setLightboxIndex(i)}
                          className="group relative cursor-zoom-in overflow-hidden rounded-lg border border-border bg-black/40 aspect-square transition-colors hover:border-borderHover"
                        >
                          <img
                            src={src}
                            alt={`Attachment ${i + 1}`}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                          <div className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-white/90 border border-border">
                            #{i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tag Management Section */}
              <div className="space-y-3 pt-4 border-t border-border/70">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Tag className="h-3.5 w-3.5 text-muted" />
                    <span>Tags</span>
                  </div>
                  <span className="text-[10.5px] font-mono text-muted/70">
                    {tags.length} assigned
                  </span>
                </div>

                {/* Active Tag Chips & Add Button */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {tags.map((tag) => {
                    const color = getTagColor(tag);
                    return (
                      <span
                        key={tag}
                        className={`group/chip flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium border transition-colors ${color.bg} ${color.text} ${color.border}`}
                      >
                        <span>#{tag}</span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="text-muted/60 hover:text-white transition-colors"
                          title={`Remove #${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}

                  {/* Inline Tag Adder Form */}
                  {isAddingTag ? (
                    <div className="flex items-center gap-1">
                      <input
                        ref={tagInputRef}
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            handleAddTag(newTagInput);
                          } else if (e.key === 'Escape') {
                            setIsAddingTag(false);
                            setNewTagInput('');
                          }
                        }}
                        onBlur={() => {
                          if (newTagInput.trim()) {
                            handleAddTag(newTagInput);
                          } else {
                            setIsAddingTag(false);
                          }
                        }}
                        placeholder="tag name..."
                        className="w-28 rounded border border-accent/60 bg-card px-2 py-0.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none font-mono"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingTag(true)}
                      className="flex items-center gap-1 rounded border border-border border-dashed bg-card hover:bg-cardHover hover:border-borderHover px-2 py-1 text-xs text-muted hover:text-foreground transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add tag</span>
                    </button>
                  )}
                </div>

                {/* Tag Quick Suggestions */}
                {suggestedTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10.5px] font-mono text-muted/60 mr-1 select-none">
                      Suggested:
                    </span>
                    {suggestedTags.map((st) => (
                      <button
                        key={st}
                        onClick={() => handleAddTag(st)}
                        className="rounded border border-border bg-card hover:bg-cardHover hover:border-borderHover px-1.5 py-0.5 text-[10.5px] font-mono text-muted hover:text-foreground transition-colors"
                      >
                        +{st}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Personal Notes Workspace */}
              <div className="space-y-2.5 pt-4 border-t border-border/70">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <FileText className="h-3.5 w-3.5 text-muted" />
                    <span>Personal Notes</span>
                  </div>

                  <div className="flex items-center gap-1 text-[10.5px] font-mono text-muted/70">
                    {isSavingNotes ? (
                      <span className="flex items-center gap-1 text-accent">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                        Saving...
                      </span>
                    ) : notes ? (
                      <span className="flex items-center gap-1 text-muted">
                        <Check className="h-3 w-3 text-muted" />
                        Saved
                      </span>
                    ) : (
                      <span>Markdown supported</span>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    onBlur={handleNotesBlur}
                    rows={4}
                    placeholder="Add context, key insights, references, or why this bookmark matters to you..."
                    className="w-full rounded-lg border border-border bg-card p-3.5 text-xs text-foreground placeholder:text-muted/60 focus:border-accent/60 focus:outline-none resize-y leading-relaxed font-normal transition-colors"
                  />
                </div>
              </div>

              {/* Metadata & Technical Info Details */}
              <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-[11px] font-mono text-muted">
                <div className="flex items-center justify-between">
                  <span>Tweet ID</span>
                  <button
                    onClick={handleCopyId}
                    className="flex items-center gap-1 text-muted hover:text-foreground transition-colors"
                    title="Copy Tweet ID"
                  >
                    <span>{bookmark.id}</span>
                    {hasCopiedId ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
                {bookmark.imported_at && (
                  <div className="flex items-center justify-between">
                    <span>Imported</span>
                    <span>{formatDate(bookmark.imported_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Panel Footer */}
            <div className="border-t border-border bg-panel px-5 py-3 flex items-center justify-between shrink-0 select-none">
              <button
                onClick={() => onDeleteBookmark(bookmark.id)}
                className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-red-400/90 hover:text-red-300 hover:bg-red-950/30 border border-red-900/40 hover:border-red-800 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove from storage</span>
              </button>

              <button
                onClick={onClose}
                className="rounded border border-border bg-card hover:bg-cardHover hover:border-borderHover px-4 py-1.5 text-xs font-medium text-foreground transition-colors"
              >
                Done
              </button>
            </div>
          </motion.aside>

          {/* 4. Full-Screen Interactive Lightbox Modal */}
          <AnimatePresence>
            {lightboxIndex !== null && bookmark.media && bookmark.media[lightboxIndex] && (
              <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/95 p-4 select-none">
                {/* Lightbox Header Bar */}
                <div className="flex w-full items-center justify-between text-xs text-muted max-w-6xl pb-2">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-foreground font-semibold">Media Preview</span>
                    {bookmark.media.length > 1 && (
                      <span className="text-muted">
                        ({lightboxIndex + 1} of {bookmark.media.length})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={bookmark.media[lightboxIndex]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1 text-xs text-foreground hover:bg-cardHover transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Original</span>
                    </a>

                    <button
                      onClick={() => setLightboxIndex(null)}
                      className="rounded border border-border bg-card p-1.5 text-muted hover:text-foreground hover:bg-cardHover transition-colors"
                      title="Close preview (Esc)"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Centered High-Res Image Viewport */}
                <div className="relative flex flex-1 items-center justify-center w-full max-w-6xl overflow-hidden py-2">
                  <img
                    src={bookmark.media[lightboxIndex]}
                    alt={`Attachment ${lightboxIndex + 1}`}
                    className="max-h-[84vh] max-w-[90vw] object-contain rounded select-text"
                  />

                  {/* Lightbox Prev / Next Overlays */}
                  {bookmark.media.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setLightboxIndex((prev) =>
                            prev !== null && prev > 0 ? prev - 1 : bookmark.media.length - 1
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-black/80 p-2 text-white/80 hover:text-white hover:bg-black transition-colors"
                        title="Previous image (←)"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() =>
                          setLightboxIndex((prev) =>
                            prev !== null && prev < bookmark.media.length - 1 ? prev + 1 : 0
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-border bg-black/80 p-2 text-white/80 hover:text-white hover:bg-black transition-colors"
                        title="Next image (→)"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Lightbox Footer Controls & Thumbnails */}
                {bookmark.media.length > 1 && (
                  <div className="flex items-center gap-2 pt-2">
                    {bookmark.media.map((thumbSrc, thumbIdx) => (
                      <button
                        key={thumbIdx}
                        onClick={() => setLightboxIndex(thumbIdx)}
                        className={`relative h-12 w-12 overflow-hidden rounded border transition-all ${
                          lightboxIndex === thumbIdx
                            ? 'border-accent ring-1 ring-accent'
                            : 'border-border opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={thumbSrc}
                          alt={`Thumbnail ${thumbIdx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};
