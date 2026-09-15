import React from 'react';
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
  layoutMode?: 'masonry' | 'grid';
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  bookmarks,
  onSelectBookmark,
  onTagClick,
  onDeleteBookmark,
  totalUnfilteredCount,
  onOpenImport,
  onClearFilters,
  layoutMode = 'masonry',
}) => {
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

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      {layoutMode === 'masonry' ? (
        /* The beloved interlocking masonry columns layout */
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="mb-4 break-inside-avoid">
              <BookmarkCard
                bookmark={bookmark}
                onClick={onSelectBookmark}
                onTagClick={onTagClick}
                onDelete={onDeleteBookmark}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Horizontal row-by-row grid layout */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 items-start">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id}>
              <BookmarkCard
                bookmark={bookmark}
                onClick={onSelectBookmark}
                onTagClick={onTagClick}
                onDelete={onDeleteBookmark}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
};
