import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-sm rounded-lg border border-border bg-panel p-5 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-red-950/40 border border-red-900/50 text-red-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">Remove from this tool?</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  This removes the bookmark, your notes, and tags from local storage.
                  <strong className="block mt-1 text-foreground/90 font-medium">
                    This will NOT unbookmark or affect anything on X.
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={onClose}
                className="rounded border border-border bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="rounded bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 text-xs font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
