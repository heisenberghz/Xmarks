import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  Tag as TagIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark } from '../types/bookmark';
import { TAXONOMY_CATEGORIES } from '../lib/tagTaxonomy';
import { batchTagBookmarksLocally } from '../lib/tagRules';

interface AutoTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  onApplyTags: (updatedBookmarks: Bookmark[]) => Promise<void>;
}

export const AutoTagModal: React.FC<AutoTagModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onApplyTags,
}) => {
  const [untaggedOnly, setUntaggedOnly] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    changedCount: number;
    categoryCounts: Record<string, number>;
  } | null>(null);

  // Statistics
  const totalCount = bookmarks.length;
  const untaggedCount = bookmarks.filter((b) => !b.tags || b.tags.length === 0).length;
  const taggedCount = totalCount - untaggedCount;

  const handleRunLocalAutoTag = async () => {
    setIsRunning(true);
    setResult(null);

    // Give UI a microtask to render spinner
    await new Promise((r) => setTimeout(r, 50));

    try {
      const { updatedBookmarks, changedCount } = batchTagBookmarksLocally(bookmarks, {
        untaggedOnly,
        maxTags: 4,
      });

      // Calculate category breakdown
      const categoryCounts: Record<string, number> = {};
      updatedBookmarks.forEach((b) => {
        b.tags?.forEach((t) => {
          categoryCounts[t] = (categoryCounts[t] || 0) + 1;
        });
      });

      await onApplyTags(updatedBookmarks);

      setResult({
        changedCount,
        categoryCounts,
      });
    } catch (err) {
      console.error('Failed to run auto-tag:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-lg rounded-xl border border-black dark:border-white/15 bg-panel p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-card border border-black dark:border-white/15 text-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                    Auto-Tag Bookmarks
                  </h3>
                  <p className="text-[11px] text-muted">
                    Smart rule engine tuned to your bookmarks taxonomy
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded p-1 text-muted hover:bg-card hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-4">
              {!result ? (
                <>
                  {/* Status Banner */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border border-border dark:border-white/10 bg-card p-2.5">
                      <div className="text-[11px] text-muted font-medium">Total</div>
                      <div className="text-base font-bold text-foreground font-mono mt-0.5">
                        {totalCount}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border dark:border-white/10 bg-card p-2.5">
                      <div className="text-[11px] text-muted font-medium">Untagged</div>
                      <div className="text-base font-bold text-foreground font-mono mt-0.5">
                        {untaggedCount}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border dark:border-white/10 bg-card p-2.5">
                      <div className="text-[11px] text-muted font-medium">Already Tagged</div>
                      <div className="text-base font-bold text-foreground font-mono mt-0.5">
                        {taggedCount}
                      </div>
                    </div>
                  </div>

                  {/* Taxonomy Preview Chips */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
                        8 Active Categories
                      </span>
                      <span className="text-[10px] text-muted">Max 4 per tweet</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {TAXONOMY_CATEGORIES.map((cat) => (
                        <div
                          key={cat.tag}
                          className="flex items-center gap-1.5 rounded-md border border-border dark:border-white/10 bg-card px-2 py-1 text-[11px] text-foreground"
                          title={cat.description}
                        >
                          <TagIcon className="h-3 w-3 text-muted" />
                          <span className="font-medium">#{cat.tag}</span>
                          <span className="text-[10px] text-muted truncate max-w-[80px]">
                            {cat.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="rounded-lg border border-border dark:border-white/10 bg-card/60 p-3 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground select-none">
                      <input
                        type="checkbox"
                        checked={untaggedOnly}
                        onChange={(e) => setUntaggedOnly(e.target.checked)}
                        className="rounded border-border text-foreground focus:ring-0"
                      />
                      <span>Only tag bookmarks with 0 tags currently</span>
                    </label>
                    <p className="text-[10.5px] text-muted leading-relaxed pl-5">
                      Uncheck to re-scan all bookmarks. Existing manual tags are <strong>never</strong> removed or overwritten.
                    </p>
                  </div>

                  {/* Run Button */}
                  <button
                    onClick={handleRunLocalAutoTag}
                    disabled={isRunning || (untaggedOnly && untaggedCount === 0)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-foreground text-background hover:opacity-90 disabled:opacity-50 py-2.5 text-xs font-semibold transition-all shadow-sm active:scale-[0.99]"
                  >
                    {isRunning ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        <span>Analyzing bookmarks & applying tags...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5 fill-current" />
                        <span>
                          Run Instant Local Auto-Tag
                          {untaggedOnly ? ` (${untaggedCount} bookmarks)` : ` (${totalCount} bookmarks)`}
                        </span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* Results View */
                <div className="py-2 space-y-4">
                  <div className="flex items-center gap-2.5 text-emerald-500">
                    <CheckCircle2 className="h-5 w-5" />
                    <div>
                      <h4 className="text-sm font-semibold">Auto-Tagging Complete!</h4>
                      <p className="text-[11px] text-muted">
                        Successfully tagged {result.changedCount} bookmarks
                      </p>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="rounded-lg border border-border dark:border-white/10 bg-card p-3 space-y-2.5">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-muted">
                      Updated Category Counts
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {TAXONOMY_CATEGORIES.map((cat) => {
                        const count = result.categoryCounts[cat.tag] || 0;
                        return (
                          <div
                            key={cat.tag}
                            className="flex items-center justify-between rounded bg-panel px-2.5 py-1.5 border border-border dark:border-white/5"
                          >
                            <span className="font-medium text-foreground">#{cat.tag}</span>
                            <span className="font-mono text-muted">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full rounded-lg border border-black dark:border-white/15 bg-panel hover:bg-card py-2.5 text-xs font-medium text-foreground transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
