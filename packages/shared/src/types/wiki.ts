export interface WikiSource {
  url: string;
  title: string;
  /** ISO 8601 timestamp when the scraper fetched this source. */
  fetchedAt: string;
}

/**
 * AI-generated wiki entry for a Problem. There is at most one
 * `WikiEntry` per `Problem` (enforced by the DB-level `UNIQUE(problem_id)`
 * constraint).
 */
export interface WikiEntry {
  id: string;
  problemId: string;
  title: string;
  /** Markdown body. Hard-capped at 1500 characters by the DB CHECK constraint. */
  body: string;
  sources: WikiSource[];
  /** ISO 8601 timestamp. */
  generatedAt: string;
  /** Identifier of the model/prompt that produced the entry (e.g. `claude-haiku-4-5-20251001@v1`). */
  modelVersion: string;
}
