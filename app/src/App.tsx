import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Bookmark, ImportResult } from './types/bookmark';
import {
  getAllBookmarksFromDB,
  saveBookmarkToDB,
  saveBookmarksBatchToDB,
  deleteBookmarkFromDB,
} from './db/indexedDB';
import { parseAndDedupeBookmarks } from './lib/importer';
import { filterBookmarks, getAllTagsWithCounts } from './lib/search';
import { TopNav } from './components/TopNav';
import { MasonryGrid } from './components/MasonryGrid';
import { DetailPanel } from './components/DetailPanel';
import { ImportModal } from './components/ImportModal';
import { DeleteDialog } from './components/DeleteDialog';

export const App: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMatchMode, setTagMatchMode] = useState<'OR' | 'AND'>('OR');
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'masonry' | 'grid'>('masonry');

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

  // Filter bookmarks in real-time
  const filteredBookmarks = useMemo(() => {
    return filterBookmarks(bookmarks, {
      searchQuery,
      selectedTags,
      tagMatchMode,
    });
  }, [bookmarks, searchQuery, selectedTags, tagMatchMode]);

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
  }, [selectedBookmark]);

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
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-xs text-muted">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent mr-2" />
        Loading your bookmarks...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Persistent Navigation Header */}
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
        layoutMode={layoutMode}
        onToggleLayoutMode={() =>
          setLayoutMode((prev) => (prev === 'masonry' ? 'grid' : 'masonry'))
        }
      />

      {/* Main Masonry Grid Area */}
      <MasonryGrid
        bookmarks={filteredBookmarks}
        onSelectBookmark={setSelectedBookmark}
        onTagClick={handleCardTagClick}
        onDeleteBookmark={handlePromptDelete}
        totalUnfilteredCount={bookmarks.length}
        onOpenImport={() => setIsImportOpen(true)}
        layoutMode={layoutMode}
        onClearFilters={() => {
          setSearchQuery('');
          setSelectedTags([]);
        }}
      />

      {/* Detail Slide-out Drawer */}
      <DetailPanel
        bookmark={selectedBookmark}
        onClose={() => setSelectedBookmark(null)}
        onUpdateBookmark={handleUpdateBookmark}
        onDeleteBookmark={handlePromptDelete}
        allExistingTags={allTagNames}
      />

      {/* File Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportFile={handleImportFile}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
