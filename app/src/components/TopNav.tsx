import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, X, Tag as TagIcon, ArrowUpDown, Check, Trash2, Sun, Moon } from 'lucide-react';
import { SortMode } from '../types/bookmark';

interface TopNavProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  allTags: { tag: string; count: number }[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  tagMatchMode: 'OR' | 'AND';
  onToggleTagMatchMode: () => void;
  totalCount: number;
  filteredCount: number;
  onOpenImport: () => void;
  onOpenClearAll?: () => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const sortOptions: { value: SortMode; label: string; desc: string }[] = [
  {
    value: 'bookmarked',
    label: 'Recently Bookmarked',
    desc: 'Original X order (top bookmark on X first)',
  },
  {
    value: 'date_desc',
    label: 'Newest Tweet',
    desc: 'By tweet publication date (newest first)',
  },
  {
    value: 'date_asc',
    label: 'Oldest Tweet',
    desc: 'By tweet publication date (oldest first)',
  },
];

export const TopNav: React.FC<TopNavProps> = ({
  searchQuery,
  onSearchChange,
  allTags,
  selectedTags,
  onToggleTag,
  onClearTags,
  tagMatchMode,
  onToggleTagMatchMode,
  totalCount,
  filteredCount,
  onOpenImport,
  onOpenClearAll,
  sortMode,
  onSortModeChange,
  theme,
  onToggleTheme,
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSortOpen(false);
      }
    };

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortOpen]);

  const activeSortLabel =
    sortOptions.find((opt) => opt.value === sortMode)?.label || 'Recently Bookmarked';

  return (
    <header className="sticky top-0 z-30 border-b border-border dark:border-white/10 bg-background">
      <div className="mx-auto max-w-[1600px] px-4 py-2.5 sm:px-6">
        {/* Main Command Bar Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand Identity & Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-panel border border-black dark:border-border font-mono text-xs font-bold text-foreground">
                𝕏
              </span>
              <h1 className="text-sm font-semibold tracking-[-0.01em] text-foreground">
                Bookmarks
              </h1>
            </div>

            <div className="flex items-center gap-1.5 rounded bg-panel px-2.5 py-0.5 text-xs text-muted border border-black dark:border-border">
              <span className="font-semibold text-foreground">{filteredCount}</span>
              {filteredCount !== totalCount && (
                <span className="text-muted/70">/ {totalCount}</span>
              )}
              <span className="text-[11px] text-muted/70">saved</span>
            </div>
          </div>

          {/* Centered Command Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search keywords, @author, tags, or notes..."
              className="w-full rounded border border-black dark:border-border bg-panel py-1.5 pl-10 pr-12 text-xs text-foreground placeholder:text-muted focus:border-black dark:focus:border-accent/60 focus:outline-none transition-colors font-normal"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-0.5 rounded transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-muted/60 bg-card border border-black dark:border-border rounded px-1.5 py-0.5 pointer-events-none select-none">
                /
              </span>
            )}
          </div>

          {/* Right Controls: Sort, View Switcher & Import */}
          <div className="flex items-center gap-2">
            {/* Sort Mode Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-1.5 rounded border border-black dark:border-border bg-panel hover:bg-card hover:border-black/70 dark:hover:border-borderHover px-2.5 py-1 text-xs font-medium text-foreground transition-colors"
                title="Change bookmark sorting"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-muted" />
                <span className="hidden sm:inline text-[11px] text-muted">Sort:</span>
                <span className="text-[11px] font-medium text-foreground truncate max-w-[130px]">
                  {activeSortLabel}
                </span>
              </button>

              {/* Dropdown Menu */}
              {isSortOpen && (
                <div className="absolute right-0 mt-1.5 w-64 rounded-lg border border-black dark:border-border bg-panel p-1 z-50 shadow-none">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted/70">
                    Sort Bookmarks By
                  </div>
                  {sortOptions.map((option) => {
                    const isSelected = sortMode === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          onSortModeChange(option.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 rounded px-2.5 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-card text-foreground'
                            : 'text-muted hover:text-foreground hover:bg-cardHover'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isSelected ? (
                            <Check className="h-3.5 w-3.5 text-foreground" />
                          ) : (
                            <span className="inline-block w-3.5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`font-medium text-[11.5px] ${
                              isSelected ? 'text-foreground font-semibold' : 'text-foreground/90'
                            }`}
                          >
                            {option.label}
                          </div>
                          <div className="text-[10px] text-muted leading-tight mt-0.5">
                            {option.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>



            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="flex items-center justify-center gap-1.5 rounded bg-panel hover:bg-card border border-black dark:border-border hover:border-black/70 dark:hover:border-borderHover px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors active:scale-95"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle light/dark theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-3.5 w-3.5 text-muted hover:text-foreground transition-colors" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-muted hover:text-foreground transition-colors" />
              )}
              <span className="hidden sm:inline text-[11px] text-muted hover:text-foreground capitalize">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* Flat Solid Import Action */}
            <button
              onClick={onOpenImport}
              className="flex items-center justify-center gap-1.5 rounded bg-panel hover:bg-card border border-black dark:border-border hover:border-black/70 dark:hover:border-borderHover px-3 py-1.5 text-xs font-medium text-foreground transition-colors active:scale-95"
            >
              <Upload className="h-3.5 w-3.5 text-muted group-hover:text-foreground" />
              <span className="text-[11px]">Import</span>
            </button>

            {/* Clear All Bookmarks Action */}
            {totalCount > 0 && onOpenClearAll && (
              <button
                onClick={onOpenClearAll}
                className="flex items-center justify-center gap-1.5 rounded bg-panel hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 border border-black dark:border-border hover:border-red-600 dark:hover:border-red-900/50 px-2.5 py-1.5 text-xs font-medium text-muted dark:hover:text-red-400 transition-colors"
                title="Clear all bookmarks from local storage"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden lg:inline text-[11px]">Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Tag Filters Row */}
        {allTags.length > 0 && (
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-0.5 text-xs no-scrollbar border-t border-border/40 pt-2">
            <div className="flex items-center gap-1.5 text-muted shrink-0">
              <TagIcon className="h-3 w-3 text-muted" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Filter:</span>
            </div>

            {/* Match Mode Toggle (OR / AND) */}
            {selectedTags.length > 1 && (
              <button
                onClick={onToggleTagMatchMode}
                title="Toggle tag filter logic"
                className="rounded border border-black dark:border-border bg-panel px-1.5 py-0.5 text-[10px] font-mono font-semibold text-foreground uppercase hover:bg-card transition-colors"
              >
                {tagMatchMode}
              </button>
            )}

            {/* Tag Filter Pills */}
            <div className="flex flex-nowrap items-center gap-1.5">
              {allTags.map(({ tag, count }) => {
                const isSelected = selectedTags.includes(tag);

                return (
                  <button
                    key={tag}
                    onClick={() => onToggleTag(tag)}
                    className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium transition-colors border ${
                      isSelected
                        ? 'border-black dark:border-accent/60 bg-cardHover text-foreground font-semibold'
                        : 'border-black dark:border-border bg-panel text-muted hover:border-black/70 dark:hover:border-borderHover hover:text-foreground hover:bg-cardHover'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span
                      className={`text-[9.5px] px-1 rounded-sm font-mono ${
                        isSelected ? 'bg-background text-accent font-medium' : 'bg-background text-muted'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedTags.length > 0 && (
              <button
                onClick={onClearTags}
                className="shrink-0 text-[11px] text-muted hover:text-foreground underline decoration-border hover:decoration-borderHover ml-1 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
