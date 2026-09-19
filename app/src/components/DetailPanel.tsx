import React, { useState, useEffect } from 'react';
import { Bookmark } from '../types/bookmark';
import { X, ExternalLink, Trash2, Tag, FileText, Calendar, User, Plus } from 'lucide-react';
import { LinkifiedText } from './LinkifiedText';
import { getTagColor } from '../lib/tagColors';
import { motion, AnimatePresence } from 'motion/react';

interface DetailPanelProps {
  bookmark: Bookmark | null;
  onClose: () => void;
  onUpdateBookmark: (updated: Bookmark) => void;
  onDeleteBookmark: (id: string) => void;
  allExistingTags: string[];
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  bookmark,
  onClose,
  onUpdateBookmark,
  onDeleteBookmark,
  allExistingTags,
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [newTagInput, setNewTagInput] = useState<string>('');

  useEffect(() => {
    if (bookmark) {
      setTags(bookmark.tags || []);
      setNotes(bookmark.notes || '');
      setNewTagInput('');
    }
  }, [bookmark]);

  const handleAddTag = (tagToAdd: string) => {
    if (!bookmark) return;
    const clean = tagToAdd.trim().replace(/^#/, '').toLowerCase();
    if (!clean) return;
    if (tags.includes(clean)) {
      setNewTagInput('');
      return;
    }
    const updatedTags = [...tags, clean];
    setTags(updatedTags);
    setNewTagInput('');
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

  const handleNotesChange = (val: string) => {
    setNotes(val);
  };

  const handleNotesBlur = () => {
    if (bookmark && notes !== bookmark.notes) {
      onUpdateBookmark({
        ...bookmark,
        notes: notes,
      });
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  const suggestedTags = allExistingTags
    .filter((t) => !tags.includes(t.toLowerCase()))
    .slice(0, 8);

  return (
    <AnimatePresence>
      {bookmark && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Slide-out Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-white/[0.08] bg-panel shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-card shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono font-semibold uppercase text-neutral-400 tracking-wider">
                  Bookmark Details
                </span>
                <span className="text-[10px] text-muted/60 font-mono">#{bookmark.id}</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-foreground hover:text-white border border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.08] transition-all shadow-xs"
                >
                  <span>Open on X</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-muted hover:bg-white/[0.06] hover:text-foreground transition-colors"
                  title="Close panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {/* Author Header */}
              <div className="flex items-start justify-between gap-3 pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  {bookmark.avatar_url ? (
                    <img
                      src={bookmark.avatar_url}
                      alt={bookmark.author_name || bookmark.author_handle || ''}
                      className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-white/10"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] ring-1 ring-white/10 text-muted">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-foreground tracking-tight leading-snug">
                      {bookmark.author_name || bookmark.author_handle}
                    </div>
                    {bookmark.author_handle && (
                      <div className="text-xs text-muted font-mono mt-0.5">
                        {bookmark.author_handle}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted/80 font-mono pt-1">
                  <Calendar className="h-3.5 w-3.5 text-muted/60" />
                  <span>{formatDate(bookmark.timestamp)}</span>
                </div>
              </div>

              {/* Full Tweet Text */}
              <div className="rounded-xl border border-white/[0.08] bg-card p-4.5 shadow-card">
                <p className="text-[14px] leading-[1.65] text-foreground/95 select-text whitespace-pre-wrap font-normal tracking-[-0.005em]">
                  <LinkifiedText text={bookmark.text} />
                </p>
              </div>

              {/* Media Previews */}
              {bookmark.media && bookmark.media.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted/80">
                    Attachments ({bookmark.media.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {bookmark.media.map((src, index) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/40"
                      >
                        <img
                          src={src}
                          alt={`Attachment ${index + 1}`}
                          className="max-h-96 w-full object-contain mx-auto"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tag Editor Section */}
              <div className="rounded-xl border border-white/[0.08] bg-card p-4.5 space-y-3.5 shadow-card">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                  <Tag className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Tags</span>
                </div>

                {/* Current Tag Chips */}
                <div className="flex flex-wrap items-center gap-1.5 min-h-6">
                  {tags.map((tag) => {
                    const color = getTagColor(tag);
                    return (
                      <span
                        key={tag}
                        className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium border ${color.bg} ${color.text} ${color.border}`}
                      >
                        <span>#{tag}</span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:opacity-75 transition-opacity"
                          title={`Remove #${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                  {tags.length === 0 && (
                    <span className="text-xs text-muted/60 italic">No tags assigned yet.</span>
                  )}
                </div>

                {/* Add New Tag Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag(newTagInput);
                      }
                    }}
                    placeholder="Add tag and press Enter..."
                    className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs text-foreground placeholder:text-muted/60 focus:border-white/[0.25] focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-white/[0.1] transition-all font-normal"
                  />
                  <button
                    onClick={() => handleAddTag(newTagInput)}
                    disabled={!newTagInput.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-foreground border border-white/[0.1] px-3.5 py-2 text-xs font-medium disabled:opacity-30 transition-all active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Quick Suggestions */}
                {suggestedTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1 text-[11px] text-muted">
                    <span className="text-[10.5px] uppercase font-mono mr-1 text-muted/70">Suggestions:</span>
                    {suggestedTags.map((st) => (
                      <button
                        key={st}
                        onClick={() => handleAddTag(st)}
                        className="rounded px-2 py-0.5 text-[10.5px] text-muted hover:text-foreground hover:border-white/[0.2] border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                      >
                        +{st}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Personal Notes Editor Section */}
              <div className="rounded-xl border border-white/[0.08] bg-card p-4.5 space-y-2.5 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                    <FileText className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Personal Notes</span>
                  </div>
                  <span className="text-[10.5px] text-muted/60 font-mono">Saved automatically on blur</span>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  onBlur={handleNotesBlur}
                  rows={4}
                  placeholder="Record insights, context, action items, or why you saved this tweet..."
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 text-xs text-foreground placeholder:text-muted/60 focus:border-white/[0.25] focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-white/[0.1] resize-y leading-relaxed font-normal transition-all"
                />
              </div>
            </div>

            {/* Drawer Footer: Delete Bookmark */}
            <div className="border-t border-white/[0.08] bg-card px-6 py-3.5 flex items-center justify-between shadow-xs">
              <button
                onClick={() => onDeleteBookmark(bookmark.id)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove from storage</span>
              </button>

              <button
                onClick={onClose}
                className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-foreground hover:bg-white/[0.08] transition-colors"
              >
                Done
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
