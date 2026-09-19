import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Bookmark, ImportResult, SortMode } from './types/bookmark';
import {
  getAllBookmarksFromDB,
  saveBookmarkToDB,
  saveBookmarksBatchToDB,
  deleteBookmarkFromDB,
  clearAllBookmarksFromDB,
} from './db/indexedDB';
import { parseAndDedupeBookmarks } from './lib/importer';
import { filterBookmarks, getAllTagsWithCounts } from './lib/search';
import { TopNav } from './components/TopNav';
import { MasonryGrid } from './components/MasonryGrid';
import { DetailPanel } from './components/DetailPanel';
import { ImportModal } from './components/ImportModal';
import { DeleteDialog } from './components/DeleteDialog';
import { ClearAllDialog } from './components/ClearAllDialog';
import { Toaster, toast } from 'sonner';

export const App: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMatchMode, setTagMatchMode] = useState<'OR' | 'AND'>('OR');
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('bookmarked');

  // Load from IndexedDB on startup
  useEffect(() => {
    async function initDB() {
      try {
        const stored = await getAllBookmarksFromDB();
        setBookmarks(stored);
      } catch (err) {
        console.error('Failed to load bookmarks from IndexedDB:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initDB();
  }, []);

  // Filter and sort bookmarks in real-time
  const filteredBookmarks = useMemo(() => {
    return filterBookmarks(bookmarks, {
      searchQuery,
      selectedTags,
      tagMatchMode,
      sortMode,
    });
  }, [bookmarks, searchQuery, selectedTags, tagMatchMode, sortMode]);

  // Extract all active tags and frequencies
  const allTagsWithCounts = useMemo(() => {
    return getAllTagsWithCounts(bookmarks);
  }, [bookmarks]);

  const allTagNames = useMemo(() => {
    return allTagsWithCounts.map((t) => t.tag);
  }, [allTagsWithCounts]);

  // Handlers
  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCardTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const handleImportFile = async (content: string): Promise<ImportResult> => {
    const result = parseAndDedupeBookmarks(content, bookmarks);
    // Persist to IndexedDB
    await saveBookmarksBatchToDB(result.bookmarks);
    setBookmarks(result.bookmarks);
    if (result.added > 0 && result.skipped > 0) {
      toast.success(
        `Imported ${result.added} new bookmarks & realigned ${result.skipped} to exact X bookmarks order`
      );
    } else if (result.added > 0) {
      toast.success(`Imported ${result.added} new bookmarks in exact X bookmarks order`);
    } else {
      toast.success(
        `All ${result.skipped} bookmarks synchronized and aligned to exact X bookmarks order`
      );
    }
    return result;
  };

  const handleUpdateBookmark = useCallback(async (updated: Bookmark) => {
    await saveBookmarkToDB(updated);
    setBookmarks((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    if (selectedBookmark?.id === updated.id) {
      setSelectedBookmark(updated);
    }
    toast('Saved');
  }, [selectedBookmark]);

  const selectedIndex = useMemo(() => {
    if (!selectedBookmark) return undefined;
    const idx = filteredBookmarks.findIndex((b) => b.id === selectedBookmark.id);
    return idx === -1 ? undefined : idx;
  }, [filteredBookmarks, selectedBookmark]);

  const handleNavigateBookmark = useCallback(
    (direction: 'prev' | 'next') => {
      if (selectedIndex === undefined) return;
      const targetIndex = direction === 'prev' ? selectedIndex - 1 : selectedIndex + 1;
      if (targetIndex >= 0 && targetIndex < filteredBookmarks.length) {
        setSelectedBookmark(filteredBookmarks[targetIndex]);
      }
    },
    [selectedIndex, filteredBookmarks]
  );

  const handlePromptDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteBookmarkFromDB(deleteTargetId);
    setBookmarks((prev) => prev.filter((b) => b.id !== deleteTargetId));
    if (selectedBookmark?.id === deleteTargetId) {
      setSelectedBookmark(null);
    }
    setDeleteTargetId(null);
    toast('Bookmark removed from local storage');
  };

  const handleConfirmClearAll = async () => {
    await clearAllBookmarksFromDB();
    setBookmarks([]);
    setSelectedBookmark(null);
    setSelectedTags([]);
    setSearchQuery('');
    setIsClearAllOpen(false);
    toast('All bookmarks cleared from local storage');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-xs text-muted">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-transparent mr-2" />
        Loading your bookmarks...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Persistent Navigation Header with View Mode Switcher */}
      <TopNav
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        allTags={allTagsWithCounts}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
        onClearTags={() => setSelectedTags([])}
        tagMatchMode={tagMatchMode}
        onToggleTagMatchMode={() =>
          setTagMatchMode((prev) => (prev === 'OR' ? 'AND' : 'OR'))
        }
        totalCount={bookmarks.length}
        filteredCount={filteredBookmarks.length}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenClearAll={() => setIsClearAllOpen(true)}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
      />

      {/* Main Content Area (Interlocking Masonry Grid) */}
      <MasonryGrid
        bookmarks={filteredBookmarks}
        onSelectBookmark={setSelectedBookmark}
        onTagClick={handleCardTagClick}
        onDeleteBookmark={handlePromptDelete}
        totalUnfilteredCount={bookmarks.length}
        onOpenImport={() => setIsImportOpen(true)}
        onClearFilters={() => {
          setSearchQuery('');
          setSelectedTags([]);
        }}
        selectedBookmarkId={selectedBookmark?.id}
      />

      {/* Detail Slide-out Drawer */}
      <DetailPanel
        bookmark={selectedBookmark}
        onClose={() => setSelectedBookmark(null)}
        onUpdateBookmark={handleUpdateBookmark}
        onDeleteBookmark={handlePromptDelete}
        allExistingTags={allTagNames}
        currentIndex={selectedIndex}
        totalCount={filteredBookmarks.length}
        onNavigate={handleNavigateBookmark}
      />

      {/* File Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportFile={handleImportFile}
      />

      {/* Delete Single Bookmark Confirmation Modal */}
      <DeleteDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Clear All Bookmarks Confirmation Modal */}
      <ClearAllDialog
        isOpen={isClearAllOpen}
        onClose={() => setIsClearAllOpen(false)}
        onConfirm={handleConfirmClearAll}
        totalCount={bookmarks.length}
      />

      {/* Toast Notification Provider */}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid #27272a',
            color: '#fafafa',
            fontFamily: 'Inter Variable, system-ui, sans-serif',
          },
        }}
      />
    </div>
  );
};
