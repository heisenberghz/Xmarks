import React from 'react';
import { AlertTriangle } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded border border-border bg-panel p-5 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-950/60 border border-red-900/50 text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Remove from this tool?</h3>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              This removes the bookmark and your personal notes/tags from your local storage.
              <strong className="block mt-1 text-foreground/90 font-medium">
                This will NOT unbookmark or affect anything on X.
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="rounded border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-cardHover transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};
