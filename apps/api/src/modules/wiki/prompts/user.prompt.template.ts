/**
 * User prompt template for the wiki LLM call.
 *
 * The template is a single string with `{placeholder}` slots that
 * `renderUserPrompt()` substitutes. We keep it as a TypeScript file
 * (instead of a .md) so it is type-checked and can be unit-tested
 * without a runtime markdown loader.
 *
 * The Hungarian text is intentionally verbose: the LLM needs the
 * problem's full context to write a faithful summary, and Eger
 * citizens may use colloquial problem titles.
 */

export interface UserPromptInputs {
  /** Problem title as submitted by the user. */
  problemTitle: string;
  /** Problem description (free text). */
  problemDescription: string;
  /**
   * Up to 10 sources in the canonical wiki shape. Each entry is
   * already deduplicated by URL upstream of the LLM call.
   */
  sources: ReadonlyArray<{
    url: string;
    title: string;
    snippet: string;
  }>;
  /** Category label, in Hungarian (helps the LLM tone-match). */
  category: string;
}

export const USER_PROMPT_TEMPLATE = `Probléma címe: {problemTitle}

Probléma leírása:
{problemDescription}

Kategória: {category}

Források (csak ezekből dolgozz, mindent hivatkozz):

{sources}

Készíts magyar nyelvű, tömör összefoglalót a problémáról a fenti szabályok szerint. A válasz TITLE: / BODY: formátumban legyen.`;

/**
 * Substitute `{placeholder}` slots in `USER_PROMPT_TEMPLATE`.
 *
 * Exported separately so unit tests can verify escaping without
 * round-tripping through an LLM.
 */
export function renderUserPrompt(input: UserPromptInputs): string {
  const sourcesBlock = input.sources
    .map(
      (s, i) =>
        `${i + 1}. ${s.title}\n   URL: ${s.url}\n   Snippet: ${s.snippet.slice(0, 500)}`,
    )
    .join("\n\n");

  return USER_PROMPT_TEMPLATE.replace("{problemTitle}", input.problemTitle)
    .replace("{problemDescription}", input.problemDescription)
    .replace("{category}", input.category)
    .replace("{sources}", sourcesBlock || "_(nincsenek elérhető források)_");
}
