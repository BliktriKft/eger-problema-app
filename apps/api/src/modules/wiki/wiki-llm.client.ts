import Anthropic from "@anthropic-ai/sdk";
import { Injectable, Logger } from "@nestjs/common";
import { renderUserPrompt, UserPromptInputs } from "./prompts/user.prompt.template";

/**
 * Multi-provider LLM client for wiki entry generation.
 *
 * Why this exists:
 *   - Centralizes provider selection + model name + prompt version
 *     so the `WikiEntry.modelVersion` column stays accurate.
 *   - Provides a deterministic **mock fallback** when the selected
 *     provider has no API key configured (or the API call fails),
 *     so the wiki flow can be exercised end-to-end in dev/CI without
 *     burning API quota.
 *   - Decouples the wiki service from any specific LLM SDK. The
 *     Anthropic SDK is imported here only; switching provider is an
 *     env flag (`LLM_PROVIDER`), not a code change.
 *
 * Provider selection (`LLM_PROVIDER`):
 *   - `mock`    → never calls the network; returns a Hungarian
 *                 placeholder. Default. Safe for CI.
 *   - `minimax` → calls `https://api.minimax.io/anthropic` via the
 *                 Anthropic-compatible SDK using `MINIMAX_API_KEY`
 *                 and `MINIMAX_MODEL` (default `MiniMax-M3`).
 *   - `claude`  → calls the official Anthropic API using
 *                 `ANTHROPIC_API_KEY` and `CLAUDE_MODEL` (default
 *                 `claude-3-5-sonnet-latest`).
 *
 * Graceful degradation: if the configured provider is missing an
 * API key, or the call throws at runtime, the client logs a warning
 * and returns the mock fallback. The downstream validator (every
 * claim must have a citation) keeps passing because the mock body
 * always cites at least one source URL.
 *
 * Contract:
 *   - `generate()` returns `{ title, body, modelVersion, mocked }`.
 *   - `title` is at most `MAX_TITLE_CHARS` (200) characters.
 *   - `body` is at most `WIKI_MAX_BODY_CHARS` (1500) characters.
 *   - `modelVersion` is `"<provider>:<model>@<promptVersion>"` for
 *     real calls, or `"mock@<promptVersion>"` for the fallback.
 */
export interface WikiLlmResult {
  title: string;
  body: string;
  /** Model identifier, e.g. `claude:claude-3-5-sonnet-latest@v1`. */
  modelVersion: string;
  /** True if the response came from the mock fallback (no API call). */
  mocked: boolean;
}

export type LlmProvider = "mock" | "minimax" | "claude";

const PROVIDER_VALUES: ReadonlyArray<LlmProvider> = [
  "mock",
  "minimax",
  "claude",
];

const PROMPT_VERSION = "v1";
const MAX_BODY_CHARS = Number(process.env.WIKI_MAX_BODY_CHARS ?? 1500);
const MAX_TITLE_CHARS = 200;
const MAX_TOKENS = 1024;

/**
 * Default model per provider. Can be overridden via env.
 *   - CLAUDE_MODEL    → Anthropic SDK model id
 *   - MINIMAX_MODEL   → MiniMax M-series model id
 */
function defaultModelFor(provider: LlmProvider): string {
  if (provider === "minimax") return "MiniMax-M3";
  if (provider === "claude") return "claude-3-5-sonnet-latest";
  return "mock";
}

function readProviderEnv(): LlmProvider {
  const raw = (process.env.LLM_PROVIDER ?? "mock").toLowerCase();
  if ((PROVIDER_VALUES as ReadonlyArray<string>).includes(raw)) {
    return raw as LlmProvider;
  }
  return "mock";
}

@Injectable()
export class WikiLlmClient {
  private readonly logger = new Logger(WikiLlmClient.name);
  private readonly provider: LlmProvider;
  private readonly anthropicClaude?: Anthropic;
  private readonly anthropicMinimax?: Anthropic;

  constructor() {
    const requested = readProviderEnv();
    const apiKey = this.resolveApiKey(requested);
    if (apiKey === null) {
      // Missing key OR explicitly mocked provider → graceful mock.
      if (requested !== "mock") {
        this.logger.warn(
          `LLM_PROVIDER=${requested} but the required API key is not set; falling back to mock`,
        );
      }
      this.provider = "mock";
      return;
    }

    this.provider = requested;
    if (requested === "claude") {
      this.anthropicClaude = new Anthropic({ apiKey });
    } else {
      // minimax: Anthropic-compatible SDK against the MiniMax gateway.
      this.anthropicMinimax = new Anthropic({
        apiKey,
        baseURL: "https://api.minimax.io/anthropic",
      });
    }
  }

  /**
   * Public read accessor — useful for tests + for the controller to
   * surface the active provider in a `/wiki/health` endpoint later.
   */
  getProvider(): LlmProvider {
    return this.provider;
  }

  /**
   * Generate a wiki entry for a Problem.
   *
   * Provider resolution happens in the constructor. The body of this
   * method is split into the mock fast-path and the real call path
   * so the mock path stays allocation-free in dev/CI.
   */
  async generate(input: UserPromptInputs): Promise<WikiLlmResult> {
    if (this.provider === "mock") {
      return this.mockResult(input);
    }
    try {
      return await this.callProvider(input);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `LLM call failed (provider=${this.provider}): ${message}; falling back to mock`,
      );
      return this.mockResult(input);
    }
  }

  // -----------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------

  private resolveApiKey(provider: LlmProvider): string | null {
    if (provider === "mock") return null;
    if (provider === "minimax") {
      const key = process.env.MINIMAX_API_KEY;
      return key && key.length > 0 ? key : null;
    }
    // claude
    const key = process.env.ANTHROPIC_API_KEY;
    return key && key.length > 0 ? key : null;
  }

  private async callProvider(input: UserPromptInputs): Promise<WikiLlmResult> {
    const client =
      this.provider === "claude"
        ? this.anthropicClaude
        : this.anthropicMinimax;
    if (!client) {
      // Defensive — should be unreachable because the constructor
      // demotes to `mock` when the key is missing.
      return this.mockResult(input);
    }

    const model =
      (this.provider === "claude"
        ? process.env.CLAUDE_MODEL
        : process.env.MINIMAX_MODEL) ?? defaultModelFor(this.provider);

    const userPrompt = renderUserPrompt(input);
    const systemPrompt = await this.loadSystemPrompt();

    const response = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("LLM response had no text block");
    }

    const parsed = parseReply(textBlock.text);
    const title = String(parsed.title ?? "").slice(0, MAX_TITLE_CHARS).trim();
    const body = String(parsed.body ?? "").slice(0, MAX_BODY_CHARS).trim();
    if (!title || !body) {
      throw new Error("LLM response missing title or body");
    }
    return {
      title,
      body,
      modelVersion: `${this.provider}:${model}@${PROMPT_VERSION}`,
      mocked: false,
    };
  }

  /**
   * Mock fallback. Always cites at least one source URL so the
   * wiki service's "every claim must have a citation" validator
   * passes. Intended for dev + CI + any deployment without a key.
   */
  private mockResult(input: UserPromptInputs): WikiLlmResult {
    const firstSource = input.sources[0];
    const cite = firstSource
      ? ` [${firstSource.url}]`
      : " _(források hiányában)_";
    const body =
      `A beküldött probléma („${input.problemTitle.slice(0, 80)}”) háttere jelenleg nem áll rendelkezésre automatikus elemzéssel. ` +
      `A tényleges wiki összefoglaló a V2 fázisban aktiválódik, amint az LLM API kulcs konfigurálva lesz.` +
      cite;
    return {
      title: `Háttér: ${input.problemTitle.slice(0, MAX_TITLE_CHARS - 12)}`.slice(
        0,
        MAX_TITLE_CHARS,
      ),
      body: body.slice(0, MAX_BODY_CHARS),
      modelVersion: `mock@${PROMPT_VERSION}`,
      mocked: true,
    };
  }

  /**
   * Load the system prompt from the colocated `.md` file. We use a
   * `fs.readFile` at boot because the alternative — inlining the
   * prompt as a TS string — would split the editorial source from
   * the code that uses it.
   *
   * The build target is CommonJS (see `tsconfig.json`), so we resolve
   * via `__dirname` instead of `import.meta.url`.
   */
  private async loadSystemPrompt(): Promise<string> {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const file = path.join(__dirname, "prompts", "system.prompt.md");
    return fs.readFile(file, "utf8");
  }
}

/**
 * Tolerant reply parser. The system prompt asks for either
 *   - `TITLE: …\n\nBODY:\n…` (textual format), or
 *   - a JSON object `{"title":"…","body":"…"}`.
 *
 * Both shapes are accepted so the same parser works for MiniMax
 * (which tends to emit the textual form) and Claude (which tends
 * to emit JSON when the system prompt asks for it). We try the
 * textual form first, then JSON.
 */
export function parseReply(
  raw: string,
): { title?: string; body?: string } {
  const textual = parseTextualReply(raw);
  if (textual.title || textual.body) {
    return textual;
  }
  return parseJsonReply(raw);
}

/**
 * Parse the `TITLE: …\n\nBODY:\n…` textual format.
 *
 * Rules:
 *   - `TITLE:` must appear at the start of a line.
 *   - The title is everything on that line up to the next newline.
 *   - `BODY:` must appear at the start of a later line. The body
 *     is everything after that line until end of input.
 */
export function parseTextualReply(
  raw: string,
): { title?: string; body?: string } {
  const titleMatch = raw.match(/^TITLE:\s*(.+)$/m);
  const bodyMatch = raw.match(/^BODY:\s*\n?([\s\S]+)$/m);
  const result: { title?: string; body?: string } = {};
  if (titleMatch?.[1]) {
    result.title = titleMatch[1].trim();
  }
  if (bodyMatch?.[1]) {
    result.body = bodyMatch[1].trim();
  }
  return result;
}

/**
 * Tolerant JSON parser. LLM replies sometimes wrap the JSON in a
 * ```json … ``` fence; strip those before parsing.
 */
function parseJsonReply(raw: string): { title?: string; body?: string } {
  const trimmed = raw.trim();
  // Strip leading/trailing code fences if present.
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]+?)\s*```$/);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate) as { title?: string; body?: string };
  } catch {
    // Best-effort: try to extract the first JSON-looking substring.
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as {
          title?: string;
          body?: string;
        };
      } catch {
        /* fall through */
      }
    }
    throw new Error(`LLM reply was not valid JSON: ${trimmed.slice(0, 200)}`);
  }
}
