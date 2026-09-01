import Anthropic from "@anthropic-ai/sdk";
import { Injectable, Logger } from "@nestjs/common";
import { renderUserPrompt, UserPromptInputs } from "./prompts/user.prompt.template";

/**
 * Anthropic Claude client wrapper.
 *
 * Why this exists:
 *   - Centralizes the model name + prompt version (so the
 *     `WikiEntry.modelVersion` column stays accurate).
 *   - Provides a deterministic **mock fallback** when
 *     `ANTHROPIC_API_KEY` is not configured, so the wiki flow can
 *     still be exercised end-to-end in dev/test without burning API
 *     quota.
 *   - Decouples the wiki service from the Anthropic SDK shape (the
 *     SDK is only imported here).
 *
 * Contract:
 *   - `generate()` returns `{ title, body }` where `body` is at most
 *     `WIKI_MAX_BODY_CHARS` (1500) characters.
 *   - The mock fallback ALWAYS cites at least one source URL so the
 *     downstream validator (every claim must have a citation) does
 *     not reject it.
 */
export interface WikiLlmResult {
  title: string;
  body: string;
  /** Model identifier, e.g. `claude-3-5-sonnet-latest@v1`. */
  modelVersion: string;
  /** True if the response came from the mock fallback (no API call). */
  mocked: boolean;
}

const MODEL_NAME = process.env.WIKI_LLM_MODEL ?? "claude-3-5-sonnet-latest";
const PROMPT_VERSION = "v1";
const MODEL_VERSION = `${MODEL_NAME}@${PROMPT_VERSION}`;
const MAX_BODY_CHARS = Number(process.env.WIKI_MAX_BODY_CHARS ?? 1500);
const MAX_TITLE_CHARS = 200;

@Injectable()
export class WikiLlmClient {
  private readonly logger = new Logger(WikiLlmClient.name);
  private readonly client: Anthropic | null;
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    if (!this.apiKey) {
      this.logger.warn(
        "ANTHROPIC_API_KEY not set; WikiLlmClient will return the mock fallback",
      );
      this.client = null;
    } else {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

  /**
   * Generate a wiki entry for a Problem.
   *
   * If no API key is configured, returns a Hungarian placeholder
   * with citations to the provided sources. Otherwise calls the
   * Claude API and parses the JSON response.
   */
  async generate(input: UserPromptInputs): Promise<WikiLlmResult> {
    if (!this.client) {
      return this.mockResult(input);
    }
    return this.callClaude(input);
  }

  /**
   * Mock fallback. Always cites at least one source URL so the
   * wiki service's "every claim must have a citation" validator
   * passes. Intended for dev + tests only.
   */
  private mockResult(input: UserPromptInputs): WikiLlmResult {
    const firstSource = input.sources[0];
    const cite = firstSource
      ? ` [${firstSource.url}]`
      : " _(források hiányában)_";
    const body =
      `A beküldött probléma („${input.problemTitle.slice(0, 80)}”) háttere jelenleg nem áll rendelkezésre automatikus elemzéssel. ` +
      `A tényleges wiki összefoglaló a V2 fázisban aktiválódik, amint az Anthropic API kulcs konfigurálva lesz.` +
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
   * Real Claude call. Kept separate so the mock path is exercised
   * by default in dev. When `ANTHROPIC_API_KEY` is set, this issues
   * a `messages.create` and parses the JSON reply.
   *
   * System prompt is loaded from `./prompts/system.prompt.md` at
   * build time (a tiny build step inlines it as a string). To keep
   * the dependency surface small in V2, we read it at module load.
   */
  private async callClaude(input: UserPromptInputs): Promise<WikiLlmResult> {
    if (!this.client) {
      // Defensive — should never happen because `generate()` short-circuits.
      return this.mockResult(input);
    }
    const userPrompt = renderUserPrompt(input);
    const systemPrompt = await this.loadSystemPrompt();

    const response = await this.client.messages.create({
      model: MODEL_NAME,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract the first text block and try to parse it as JSON.
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Claude response had no text block");
    }
    const parsed = parseJsonReply(textBlock.text);
    const title = String(parsed.title ?? "").slice(0, MAX_TITLE_CHARS).trim();
    const body = String(parsed.body ?? "").slice(0, MAX_BODY_CHARS).trim();
    if (!title || !body) {
      throw new Error("Claude response missing title or body");
    }
    return { title, body, modelVersion: MODEL_VERSION, mocked: false };
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
 * Tolerant JSON parser. Claude sometimes wraps the JSON in a
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
    throw new Error(`Claude reply was not valid JSON: ${trimmed.slice(0, 200)}`);
  }
}
