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
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />

          {/* Slide-out Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-border bg-panel shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-card">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase text-accent tracking-wider">
                  Bookmark Detail
                </span>
                <span className="text-[10px] text-muted font-mono">ID: {bookmark.id}</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-md bg-panel px-2.5 py-1 text-xs font-semibold text-accent border border-border hover:border-accent transition-colors"
                >
                  <span>View on X</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  onClick={onClose}
                  className="rounded-md p-1 text-muted hover:bg-panel hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
              {/* Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {bookmark.avatar_url ? (
                    <img
                      src={bookmark.avatar_url}
                      alt={bookmark.author_name || bookmark.author_handle || ''}
                      className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-panel border border-border text-muted">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-foreground leading-none">
                      {bookmark.author_name || bookmark.author_handle}
                    </div>
                    {bookmark.author_handle && (
                      <div className="text-xs text-muted font-mono mt-1">
                        {bookmark.author_handle}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(bookmark.timestamp)}</span>
                </div>
              </div>

              {/* Full Tweet Text */}
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-[13px] leading-relaxed text-foreground select-text whitespace-pre-wrap font-normal">
                  <LinkifiedText text={bookmark.text} />
                </p>
              </div>

              {/* Media Previews */}
              {bookmark.media && bookmark.media.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Media ({bookmark.media.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {bookmark.media.map((src, index) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-lg border border-border bg-black/50"
                      >
                        <img
                          src={src}
                          alt={`Tweet attachment ${index + 1}`}
                          className="max-h-96 w-full object-contain mx-auto"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tag Editor Section */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Tag className="h-3.5 w-3.5 text-accent" />
                  <span>Tags</span>
                </div>

                {/* Current Tag Chips */}
                <div className="flex flex-wrap items-center gap-1.5 min-h-6">
                  {tags.map((tag) => {
                    const color = getTagColor(tag);
                    return (
                      <span
                        key={tag}
                        className={`flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-semibold border ${color.bg} ${color.text} ${color.border}`}
                      >
                        <span>#{tag}</span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:opacity-75 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                  {tags.length === 0 && (
                    <span className="text-xs text-muted italic">No tags assigned.</span>
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
                    placeholder="Type tag and press Enter..."
                    className="flex-1 rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={() => handleAddTag(newTagInput)}
                    disabled={!newTagInput.trim()}
                    className="flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 transition-colors hover:bg-accent-hover"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Quick Suggestions */}
                {suggestedTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1 text-[11px] text-muted">
                    <span className="text-[10px] uppercase font-mono mr-1">Suggested:</span>
                    {suggestedTags.map((st) => (
                      <button
                        key={st}
                        onClick={() => handleAddTag(st)}
                        className="rounded bg-panel px-1.5 py-0.5 text-[10px] text-muted hover:text-accent hover:border-accent border border-border transition-colors"
                      >
                        +{st}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Personal Notes Editor Section */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                    <FileText className="h-3.5 w-3.5 text-accent" />
                    <span>Personal Notes</span>
                  </div>
                  <span className="text-[10px] text-muted font-mono">Auto-saved on blur</span>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  onBlur={handleNotesBlur}
                  rows={4}
                  placeholder="Add personal notes, thoughts, or why you saved this..."
                  className="w-full rounded-md border border-border bg-panel p-2.5 text-xs text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none resize-y leading-relaxed"
                />
              </div>
            </div>

            {/* Drawer Footer: Delete Bookmark */}
            <div className="border-t border-border bg-card px-5 py-3 flex items-center justify-between">
              <button
                onClick={() => onDeleteBookmark(bookmark.id)}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove Bookmark</span>
              </button>

              <button
                onClick={onClose}
                className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-foreground hover:bg-card transition-colors"
              >
                Close
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
