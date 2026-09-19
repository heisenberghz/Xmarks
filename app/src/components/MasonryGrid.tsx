import React, { useState, useEffect, useMemo } from 'react';
import { Bookmark } from '../types/bookmark';
import { BookmarkCard } from './BookmarkCard';
import { BookmarkX, Upload } from 'lucide-react';
import { motion } from 'motion/react';

interface MasonryGridProps {
  bookmarks: Bookmark[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  onTagClick: (tag: string, e: React.MouseEvent) => void;
  onDeleteBookmark: (id: string, e: React.MouseEvent) => void;
  totalUnfilteredCount: number;
  onOpenImport: () => void;
  onClearFilters: () => void;
  viewMode?: 'grid' | 'feed';

  selectedBookmarkId?: string | null;
}

/**
 * Hook to dynamically calculate column count based on viewport width,
 * matching Tailwind breakpoints (sm: 640px, lg: 1024px, xl: 1280px, 2xl: 1536px).
 */
function useColumnCount(): number {
  const getCount = () => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width < 640) return 1;
    if (width < 1024) return 2;
    if (width < 1280) return 3;
    if (width < 1536) return 4;
    return 5;
  };

  const [columnCount, setColumnCount] = useState<number>(getCount);

  useEffect(() => {
    const handleResize = () => {
      setColumnCount(getCount());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return columnCount;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  bookmarks,
  onSelectBookmark,
  onTagClick,
  onDeleteBookmark,
  totalUnfilteredCount,
  onOpenImport,
  onClearFilters,
  viewMode = 'grid',
  selectedBookmarkId,
}) => {
  const columnCount = useColumnCount();

  // Distribute items across columns round-robin to guarantee strict left-to-right ordering
  // Always invoke hooks at the top level before any conditional returns
  const columns = useMemo(() => {
    if (!bookmarks || bookmarks.length === 0) return [];
    const cols: Bookmark[][] = Array.from({ length: columnCount }, () => []);
    bookmarks.forEach((bookmark, index) => {
      cols[index % columnCount].push(bookmark);
    });
    return cols;
  }, [bookmarks, columnCount]);

  // Empty state: No bookmarks imported yet
  if (totalUnfilteredCount === 0) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-panel border border-border text-muted mb-4">
          <Upload className="h-5 w-5 text-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No bookmarks imported yet</h3>
        <p className="mt-1.5 max-w-sm text-xs text-muted leading-relaxed">
          Import your <code className="text-foreground bg-panel px-1.5 py-0.5 rounded border border-border font-mono">bookmarks-export.json</code> from the scraper to start searching, browsing, and tagging.
        </p>
        <button
          onClick={onOpenImport}
          className="mt-5 flex items-center gap-2 rounded bg-panel hover:bg-card border border-border hover:border-borderHover px-4 py-2 text-xs font-medium text-foreground transition-colors active:scale-95"
        >
          <Upload className="h-4 w-4" />
          <span>Import JSON File</span>
        </button>
      </div>
    );
  }

  // Filtered empty state: Filters returned 0 results
  if (bookmarks.length === 0) {
    return (
      <div className="flex min-h-[45vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-panel border border-border text-muted mb-3">
          <BookmarkX className="h-5 w-5 text-muted" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No matching bookmarks found</h3>
        <p className="mt-1 text-xs text-muted">
          Try broadening your search keywords or clearing tag filters.
        </p>
        <button
          onClick={onClearFilters}
          className="mt-4 rounded border border-border bg-panel px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-card transition-colors"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      {viewMode === 'feed' ? (
        /* Linear Feed View: Calm, focused, uniform alignment */
        <div className="mx-auto max-w-2xl flex flex-col gap-4">
          {bookmarks.map((bookmark, index) => (
            <motion.div
              key={bookmark.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.18,
                delay: Math.min(index * 0.02, 0.25),
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <BookmarkCard
                bookmark={bookmark}
                onClick={onSelectBookmark}
                onTagClick={onTagClick}
                onDelete={onDeleteBookmark}
                isSelected={selectedBookmarkId === bookmark.id}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        /* Interlocking Masonry Grid View */
        <div className="flex gap-4 items-start">
          {columns.map((colBookmarks, colIndex) => (
            <div key={colIndex} className="flex-1 flex flex-col gap-4 min-w-0">
              {colBookmarks.map((bookmark, itemIndex) => (
                <motion.div
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.18,
                    delay: Math.min((colIndex + itemIndex * columnCount) * 0.02, 0.25),
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  <BookmarkCard
                    bookmark={bookmark}
                    onClick={onSelectBookmark}
                    onTagClick={onTagClick}
                    onDelete={onDeleteBookmark}
                    isSelected={selectedBookmarkId === bookmark.id}
                  />
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  );
};
