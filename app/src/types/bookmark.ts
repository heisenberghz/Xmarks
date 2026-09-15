export interface Bookmark {
  id: string;              // tweet ID (primary key, used for dedup on import)
  text: string;
  author_name: string;
  author_handle: string;
  avatar_url: string;      // author profile picture URL
  timestamp: string;       // ISO 8601
  url: string;
  media: string[];
  tags: string[];          // user-assigned, manual in v1
  notes: string;           // free text, user-assigned
  imported_at: string;     // ISO 8601, when this record was ingested into the app
  order?: number;          // original X bookmarks sequence index
}

export interface RawScrapedTweet {
  id: string;
  text?: string;
  author_name?: string;
  author_handle?: string;
  avatar_url?: string;
  timestamp?: string;
  url?: string;
  media?: string[];
  tags?: string[];
  notes?: string;
  imported_at?: string;
  order?: number;
}

export interface ImportResult {
  added: number;
  skipped: number;
  totalParsed: number;
  bookmarks: Bookmark[];
}
