/**
 * Minimal placeholder for the AI-wiki section — the actual content is
 * served by the /api/problems/:id/wiki endpoint that lands in a later
 * AI ticket.  Kept as a Server Component so we can stream the eventual
 * response in.
 */

export interface WikiSectionProps {
  problemId: string;
}

export function WikiSection({ problemId }: WikiSectionProps) {
  return (
    <section
      className="rounded-lg border border-accent-200 bg-accent-50 p-4 text-accent-900"
      data-testid={`wiki-section-${problemId}`}
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide">AI-wiki összefoglaló</h2>
        <span className="text-xs opacity-70">hamarosan</span>
      </header>
      <p className="mt-2 text-sm leading-relaxed">
        Az AI-wiki automatikusan készül, miután a bejelentés elég figyelmet kap. Addig is a források
        listája itt fog megjelenni, ha elérhető.
      </p>
    </section>
  );
}
