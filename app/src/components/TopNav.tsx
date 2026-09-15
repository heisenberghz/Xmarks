import React from 'react';
import { Search, Upload, X, Tag as TagIcon, Columns3, LayoutGrid } from 'lucide-react';

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
  layoutMode: 'masonry' | 'grid';
  onToggleLayoutMode: () => void;
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
  layoutMode,
  onToggleLayoutMode,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
        {/* Main Row: Logo, Search, Import */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Logo & Count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-accent font-mono text-sm font-black text-white">
                𝕏
              </span>
              <h1 className="text-sm font-bold tracking-wider text-foreground uppercase">
                Bookmarks
              </h1>
            </div>

            <div className="flex items-center gap-1.5 rounded bg-panel px-2 py-0.5 text-xs text-muted border border-border">
              <span className="font-semibold text-foreground">{filteredCount}</span>
              {filteredCount !== totalCount && (
                <span>/ {totalCount}</span>
              )}
              <span>items</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search text, author, @handle, tags, or notes..."
              className="w-full rounded border border-border bg-card py-1.5 pl-9 pr-8 text-xs text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons: Layout Switcher & Import */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleLayoutMode}
              title={`Currently: ${layoutMode === 'masonry' ? 'Interlocking Masonry' : 'Horizontal Grid'}. Click to switch.`}
              className="flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1.5 text-xs text-muted hover:text-foreground hover:border-borderHover transition"
            >
              {layoutMode === 'masonry' ? (
                <>
                  <Columns3 className="h-3.5 w-3.5 text-accent" />
                  <span className="hidden sm:inline text-[11px] font-medium">Masonry</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="h-3.5 w-3.5 text-accent" />
                  <span className="hidden sm:inline text-[11px] font-medium">Grid</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenImport}
              className="flex items-center justify-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover active:opacity-90"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>

        {/* Tag Filters Row */}
        {allTags.length > 0 && (
          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <div className="flex items-center gap-1 text-muted shrink-0">
              <TagIcon className="h-3 w-3" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Tags:</span>
            </div>

            {/* Match Mode Toggle (OR / AND) */}
            {selectedTags.length > 1 && (
              <button
                onClick={onToggleTagMatchMode}
                title="Toggle tag filter mode"
                className="rounded border border-border bg-panel px-1.5 py-0.5 text-[10px] font-mono font-bold text-accent uppercase hover:border-accent"
              >
                {tagMatchMode}
              </button>
            )}

            {/* Tag Pills */}
            <div className="flex flex-nowrap items-center gap-1.5">
              {allTags.map(({ tag, count }) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => onToggleTag(tag)}
                    className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition border ${
                      isSelected
                        ? 'border-accent bg-accent text-white'
                        : 'border-border bg-card text-foreground hover:border-borderHover hover:bg-cardHover'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span
                      className={`text-[9px] px-1 rounded-sm ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-panel text-muted'
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
                className="shrink-0 text-[11px] text-muted hover:text-foreground underline decoration-border"
              >
                Clear tags
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
