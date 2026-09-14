export interface Bookmark {
  id: string;              // tweet ID (primary key, used for dedup on import)
  text: string;
  author_name: string;
  author_handle: string;
  timestamp: string;       // ISO 8601
  url: string;
  media: string[];
  tags: string[];          // user-assigned, manual in v1
  notes: string;           // free text, user-assigned
  imported_at: string;     // ISO 8601, when this record was ingested into the app
}

export interface RawScrapedTweet {
  id: string;
  text?: string;
  author_name?: string;
  author_handle?: string;
  timestamp?: string;
  url?: string;
  media?: string[];
  tags?: string[];
  notes?: string;
  imported_at?: string;
}

export interface ImportResult {
  added: number;
  skipped: number;
  totalParsed: number;
  bookmarks: Bookmark[];
}
