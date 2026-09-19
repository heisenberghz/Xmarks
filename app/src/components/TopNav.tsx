import React from 'react';
import { Search, Upload, X, Tag as TagIcon, LayoutGrid, Rows3 } from 'lucide-react';

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
  viewMode: 'grid' | 'feed';
  onViewModeChange: (mode: 'grid' | 'feed') => void;
}

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
  viewMode,
  onViewModeChange,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto max-w-[1600px] px-4 py-2.5 sm:px-6">
        {/* Main Command Bar Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand Identity & Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-panel border border-border font-mono text-xs font-bold text-foreground">
                𝕏
              </span>
              <h1 className="text-sm font-semibold tracking-[-0.01em] text-foreground">
                Bookmarks
              </h1>
            </div>

            <div className="flex items-center gap-1.5 rounded bg-panel px-2.5 py-0.5 text-xs text-muted border border-border">
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
              className="w-full rounded border border-border bg-panel py-1.5 pl-10 pr-12 text-xs text-foreground placeholder:text-muted focus:border-accent/60 focus:outline-none transition-colors font-normal"
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-muted/60 bg-card border border-border rounded px-1.5 py-0.5 pointer-events-none select-none">
                /
              </span>
            )}
          </div>

          {/* Right Controls: View Switcher & Import */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Grid vs Feed */}
            <div className="flex items-center rounded border border-border bg-panel p-0.5">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-card text-foreground border border-border/80'
                    : 'text-muted hover:text-foreground hover:bg-cardHover'
                }`}
                title="Masonry Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px]">Grid</span>
              </button>

              <button
                onClick={() => onViewModeChange('feed')}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'feed'
                    ? 'bg-card text-foreground border border-border/80'
                    : 'text-muted hover:text-foreground hover:bg-cardHover'
                }`}
                title="Linear Feed View"
              >
                <Rows3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px]">Feed</span>
              </button>
            </div>

            {/* Flat Solid Import Action */}
            <button
              onClick={onOpenImport}
              className="flex items-center justify-center gap-1.5 rounded bg-panel hover:bg-card border border-border hover:border-borderHover px-3 py-1.5 text-xs font-medium text-foreground transition-colors active:scale-95"
            >
              <Upload className="h-3.5 w-3.5 text-muted group-hover:text-foreground" />
              <span className="text-[11px]">Import</span>
            </button>
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
                className="rounded border border-border bg-panel px-1.5 py-0.5 text-[10px] font-mono font-semibold text-foreground uppercase hover:bg-card transition-colors"
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
                        ? 'border-accent/60 bg-cardHover text-foreground font-semibold'
                        : 'border-border bg-panel text-muted hover:border-borderHover hover:text-foreground hover:bg-cardHover'
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
