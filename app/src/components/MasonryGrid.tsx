import React, { useState, useEffect, useMemo } from 'react';
import { Bookmark } from '../types/bookmark';
import { BookmarkCard } from './BookmarkCard';
import { BookmarkX, Upload } from 'lucide-react';

interface MasonryGridProps {
  bookmarks: Bookmark[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  onTagClick: (tag: string, e: React.MouseEvent) => void;
  onDeleteBookmark: (id: string, e: React.MouseEvent) => void;
  totalUnfilteredCount: number;
  onOpenImport: () => void;
  onClearFilters: () => void;
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
}) => {
  const columnCount = useColumnCount();

  // Empty state: No bookmarks imported yet
  if (totalUnfilteredCount === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-panel border border-border text-muted mb-3">
          <Upload className="h-6 w-6 text-accent" />
        </div>
        <h3 className="text-sm font-bold text-foreground">No bookmarks imported yet</h3>
        <p className="mt-1 max-w-sm text-xs text-muted leading-relaxed">
          Import your <code className="text-foreground bg-panel px-1 py-0.5 rounded border border-border">bookmarks-export.json</code> from the scraper to start searching, browsing, and tagging.
        </p>
        <button
          onClick={onOpenImport}
          className="mt-4 flex items-center gap-2 rounded bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover active:scale-95"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Import JSON File</span>
        </button>
      </div>
    );
  }

  // Filtered empty state: Filters returned 0 results
  if (bookmarks.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-panel border border-border text-muted mb-2.5">
          <BookmarkX className="h-5 w-5 text-muted" />
        </div>
        <h3 className="text-sm font-bold text-foreground">No matching bookmarks found</h3>
        <p className="mt-1 text-xs text-muted">
          Try broadening your search keywords or clearing tag filters.
        </p>
        <button
          onClick={onClearFilters}
          className="mt-3 rounded border border-border bg-panel px-3 py-1.5 text-xs font-medium text-accent hover:border-accent transition"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  // Distribute items across columns round-robin to guarantee strict left-to-right ordering:
  // Col 0: 0, N, 2N...
  // Col 1: 1, N+1, 2N+1...
  // Col 2: 2, N+2, 2N+2...
  const columns = useMemo(() => {
    const cols: Bookmark[][] = Array.from({ length: columnCount }, () => []);
    bookmarks.forEach((bookmark, index) => {
      cols[index % columnCount].push(bookmark);
    });
    return cols;
  }, [bookmarks, columnCount]);

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      {/* True Interlocking Masonry with strict Horizontal (Left-to-Right) Reading Order */}
      <div className="flex gap-4 items-start">
        {columns.map((colBookmarks, colIndex) => (
          <div key={colIndex} className="flex-1 flex flex-col gap-4 min-w-0">
            {colBookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onClick={onSelectBookmark}
                onTagClick={onTagClick}
                onDelete={onDeleteBookmark}
              />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
};
