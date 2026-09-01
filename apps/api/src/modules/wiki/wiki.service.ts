import { Inject, Injectable, Logger } from "@nestjs/common";
import { PRISMA_CLIENT } from "../../database/database.module";
import { ScraperService } from "../scraper/scraper.service";
import { WikiLlmClient, WikiLlmResult } from "./wiki-llm.client";
import { UserPromptInputs } from "./prompts/user.prompt.template";

/**
 * Public read shape returned to controllers + clients. Mirrors the
 * JSON in `wiki_entries.sources` so the wiki panel can render the
 * citations directly.
 */
export interface WikiEntryView {
  id: string;
  problemId: string;
  title: string;
  body: string;
  sources: Array<{ url: string; title: string; fetchedAt: string }>;
  generatedAt: string;
  modelVersion: string;
}

export interface GenerateOptions {
  /** Force regeneration even if a recent entry exists. Default false. */
  force?: boolean;
  /** Override max sources to feed into the LLM (default 10). */
  maxSources?: number;
}

const DEFAULT_MAX_SOURCES = Number(process.env.WIKI_MAX_SOURCES ?? 10);

/**
 * Coordinates the wiki generation pipeline:
 *
 *   Problem  ─►  scrape (local sources)
 *            ─►  LLM (Claude, mock if no key)
 *            ─►  UPSERT wiki_entries row
 *
 * Concurrency: the public `findByProblem()` is read-only and cheap.
 * `generate()` and `regenerate()` are service-role only and write
 * through the Prisma client (bypassing RLS because the API connects
 * with the service_role key — see ADR-0003).
 */
@Injectable()
export class WikiService {
  private readonly logger = new Logger(WikiService.name);

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly scraper: ScraperService,
    private readonly llm: WikiLlmClient,
  ) {}

  /**
   * Backwards-compat alias kept for the architect placeholder route.
   * Returns null because the public read endpoint expects an explicit
   * problem id, not a generic find().
   */
  find(): Promise<WikiEntryView | null> {
    return Promise.resolve(null);
  }

  /**
   * Fetch the wiki entry for a Problem. Returns null if none has
   * been generated yet (the frontend can fall back to a "generate"
   * CTA).
   */
  async findByProblem(problemId: string): Promise<WikiEntryView | null> {
    const row = await this.prisma.wikiEntry.findUnique({
      where: { problemId },
    });
    return row ? this.toView(row) : null;
  }

  /**
   * Generate a wiki entry for `problemId`. Reads the Problem, scrapes
   * each local source for a topically-relevant query, feeds the top
   * N snippets to the LLM, and UPSERTs the resulting entry.
   *
   * If an entry already exists and `opts.force` is false, this is a
   * no-op (the existing entry is returned).
   */
  async generate(
    problemId: string,
    opts: GenerateOptions = {},
  ): Promise<WikiEntryView> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true, title: true, description: true, category: true },
    });
    if (!problem) {
      throw new Error(`Problem ${problemId} not found`);
    }

    const existing = await this.prisma.wikiEntry.findUnique({
      where: { problemId },
    });
    if (existing && !opts.force) {
      this.logger.log(
        `Wiki entry already exists for ${problemId}; returning cached row`,
      );
      return this.toView(existing);
    }

    const sources = await this.collectSources(
      problem.title,
      problem.description,
      opts.maxSources ?? DEFAULT_MAX_SOURCES,
    );

    const llmInput: UserPromptInputs = {
      problemTitle: problem.title,
      problemDescription: problem.description,
      category: problem.category,
      sources: sources.map((s) => ({
        url: s.url,
        title: s.title,
        snippet: s.snippet,
      })),
    };
    const result: WikiLlmResult = await this.llm.generate(llmInput);

    const persisted = await this.persist(problemId, result, sources);
    return this.toView(persisted);
  }

  /**
   * Force-regenerate an entry. Service-role only — the controller
   * gates this behind `RequiresServiceRole`.
   */
  async regenerate(problemId: string): Promise<WikiEntryView> {
    return this.generate(problemId, { force: true });
  }

  // -----------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------

  private async collectSources(
    title: string,
    description: string,
    maxSources: number,
  ): Promise<Array<{ url: string; title: string; snippet: string }>> {
    const query = `${title} ${description.split(/\s+/).slice(0, 8).join(" ")}`.trim();
    const perSource = Math.max(2, Math.ceil(maxSources / 3));
    const all: Array<{ url: string; title: string; snippet: string }> = [];
    for (const srcName of ["egertv", "egri-hirek", "heol"] as const) {
      try {
        const hits = await this.scraper.search(srcName, query, {
          sinceDays: 14,
          maxResults: perSource,
        });
        for (const h of hits) {
          all.push({ url: h.url, title: h.title, snippet: h.snippet });
        }
      } catch (err) {
        this.logger.warn(
          `Source ${srcName} failed during wiki generation: ${(err as Error).message}`,
        );
      }
    }
    // Dedupe by URL, preserving first occurrence.
    const seen = new Set<string>();
    const dedup: typeof all = [];
    for (const s of all) {
      if (seen.has(s.url)) continue;
      seen.add(s.url);
      dedup.push(s);
      if (dedup.length >= maxSources) break;
    }
    return dedup;
  }

  private async persist(
    problemId: string,
    llm: WikiLlmResult,
    sources: Array<{ url: string; title: string; snippet: string }>,
  ): Promise<WikiEntryRow> {
    const sourcesJson = sources.map((s) => ({
      url: s.url,
      title: s.title,
      fetchedAt: new Date().toISOString(),
    }));
    return this.prisma.wikiEntry.upsert({
      where: { problemId },
      create: {
        problemId,
        title: llm.title,
        body: llm.body,
        sources: sourcesJson,
        generatedAt: new Date(),
        modelVersion: llm.modelVersion,
      },
      update: {
        title: llm.title,
        body: llm.body,
        sources: sourcesJson,
        generatedAt: new Date(),
        modelVersion: llm.modelVersion,
      },
    });
  }

  private toView(row: WikiEntryRow): WikiEntryView {
    return {
      id: row.id,
      problemId: row.problemId,
      title: row.title,
      body: row.body,
      sources: Array.isArray(row.sources)
        ? (row.sources as WikiEntryView["sources"])
        : [],
      generatedAt: row.generatedAt.toISOString(),
      modelVersion: row.modelVersion,
    };
  }
}

// Local types kept narrow to avoid leaking Prisma row types.
type PrismaClient = import("@prisma/client").PrismaClient;
type WikiEntryRow = {
  id: string;
  problemId: string;
  title: string;
  body: string;
  sources: unknown;
  generatedAt: Date;
  modelVersion: string;
};
