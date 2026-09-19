import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClearAllDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalCount: number;
}

export const ClearAllDialog: React.FC<ClearAllDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalCount,
}) => {
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
            className="w-full max-w-md rounded-lg border border-border bg-panel p-5 space-y-4 shadow-none"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-red-950/40 border border-red-900/50 text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  Clear all bookmarks?
                </h3>
                <p className="mt-1.5 text-xs text-muted leading-relaxed">
                  This will permanently delete all <span className="font-semibold text-foreground">{totalCount}</span> bookmarks, along with all your personal tags and notes, from this local tool.
                </p>
                <div className="mt-2.5 rounded border border-border bg-card p-2.5 text-[11px] text-muted flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-muted/80 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground font-medium">Safe guarantee:</strong> This will <strong className="text-foreground font-medium">NOT</strong> delete or unbookmark any tweets on X.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={onClose}
                className="rounded border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-cardHover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="rounded bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 text-xs font-medium transition-colors"
              >
                Clear All ({totalCount})
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
