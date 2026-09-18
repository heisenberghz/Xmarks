import React from 'react';
import { Search, Upload, X, Tag as TagIcon } from 'lucide-react';
import { getTagColor } from '../lib/tagColors';

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
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
        {/* Main Command Bar Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand Identity & Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.1] font-mono text-xs font-bold text-white shadow-xs">
                𝕏
              </span>
              <h1 className="text-sm font-semibold tracking-tight text-foreground">
                Bookmarks
              </h1>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-white/[0.03] px-2.5 py-0.5 text-xs text-muted/90 border border-white/[0.06]">
              <span className="font-semibold text-foreground">{filteredCount}</span>
              {filteredCount !== totalCount && (
                <span className="text-muted/70">/ {totalCount}</span>
              )}
              <span className="text-[11px] text-muted/70">saved</span>
            </div>
          </div>

          {/* Centered Command Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search keywords, @author, tags, or notes..."
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 pl-10 pr-12 text-xs text-foreground placeholder:text-muted/60 focus:border-teal-500/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all font-normal"
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-muted/50 bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5 pointer-events-none select-none">
                /
              </span>
            )}
          </div>

          {/* Refined Secondary Import Action */}
          <button
            onClick={onOpenImport}
            className="flex items-center justify-center gap-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] hover:border-white/[0.2] px-3.5 py-2 text-xs font-medium text-foreground transition-all active:scale-95 shadow-xs"
          >
            <Upload className="h-3.5 w-3.5 text-muted group-hover:text-foreground" />
            <span>Import JSON</span>
          </button>
        </div>

        {/* Tag Filters Row */}
        {allTags.length > 0 && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5 text-xs no-scrollbar border-t border-white/[0.04] pt-2.5">
            <div className="flex items-center gap-1.5 text-muted shrink-0">
              <TagIcon className="h-3 w-3 text-muted/70" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted/80">Filter:</span>
            </div>

            {/* Match Mode Toggle (OR / AND) */}
            {selectedTags.length > 1 && (
              <button
                onClick={onToggleTagMatchMode}
                title="Toggle tag filter logic"
                className="rounded border border-teal-500/30 bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-teal-400 uppercase hover:bg-teal-500/20 transition-colors"
              >
                {tagMatchMode}
              </button>
            )}

            {/* Tag Filter Pills */}
            <div className="flex flex-nowrap items-center gap-1.5">
              {allTags.map(({ tag, count }) => {
                const isSelected = selectedTags.includes(tag);
                const tagColor = getTagColor(tag);

                return (
                  <button
                    key={tag}
                    onClick={() => onToggleTag(tag)}
                    className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium transition-all border ${
                      isSelected
                        ? `${tagColor.bg} ${tagColor.text} ${tagColor.border} ring-1 ring-teal-500/40 font-semibold shadow-xs`
                        : 'border-white/[0.06] bg-white/[0.02] text-muted hover:border-white/[0.14] hover:text-foreground hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span
                      className={`text-[9.5px] px-1 rounded-sm font-mono ${
                        isSelected ? 'bg-black/40 text-white font-medium' : 'bg-white/[0.05] text-muted/70'
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
                className="shrink-0 text-[11px] text-muted/80 hover:text-foreground underline decoration-white/20 hover:decoration-white/50 ml-1 transition-colors"
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
