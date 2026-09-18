import React, { useState, useRef } from 'react';
import { X, UploadCloud, CheckCircle2, AlertCircle, FileJson } from 'lucide-react';
import { ImportResult } from '../types/bookmark';
import { motion, AnimatePresence } from 'motion/react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportFile: (content: string) => Promise<ImportResult>;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Please select a valid .json file exported by the scraper.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const res = await onImportFile(text);
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse JSON file.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleClose = () => {
    setError(null);
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-md rounded-xl border border-white/[0.08] bg-panel p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  Import Bookmarks JSON
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1 text-muted hover:bg-white/[0.06] hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4">
              {!result ? (
                <div>
                  {/* Dropzone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-teal-500 bg-teal-500/[0.08]'
                        : 'border-white/[0.1] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <UploadCloud
                      className={`h-10 w-10 mb-2.5 transition-colors ${
                        isDragging ? 'text-teal-400' : 'text-muted/70'
                      }`}
                    />
                    <p className="text-xs font-semibold text-foreground">
                      Click to choose file or drag and drop
                    </p>
                    <p className="mt-1 text-[11px] text-muted font-mono">
                      Accepts bookmarks-export-*.json
                    </p>
                  </div>

                  {isLoading && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
                      <span>Ingesting and deduplicating bookmarks...</span>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Import Summary */
                <div className="py-2 space-y-4">
                  <div className="flex items-center gap-2 text-teal-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-semibold">Import Complete</span>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-card p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted">Total records parsed:</span>
                      <span className="font-mono font-semibold text-foreground">
                        {result.totalParsed}
                      </span>
                    </div>
                    <div className="flex justify-between text-teal-400">
                      <span>New bookmarks added:</span>
                      <span className="font-mono font-semibold">+{result.added}</span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>Duplicates skipped (tags preserved):</span>
                      <span className="font-mono font-semibold">{result.skipped}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 py-2 text-xs font-medium transition-all"
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
