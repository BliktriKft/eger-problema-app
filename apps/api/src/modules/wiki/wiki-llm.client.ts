import Anthropic from "@anthropic-ai/sdk";
import { Injectable, Logger } from "@nestjs/common";
import { renderUserPrompt, UserPromptInputs } from "./prompts/user.prompt.template";

export type LlmProvider = "mock" | "minimax" | "openrouter";

export interface WikiLlmResult {
  title: string;
  body: string;
  modelVersion: string;
  mocked: boolean;
}

const PROMPT_VERSION = "v1";
const MAX_BODY_CHARS = Number(process.env.WIKI_MAX_BODY_CHARS ?? 1500);
const MAX_TITLE_CHARS = 200;
const MINIMAX_BASE_URL = "https://api.minimax.io";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MINIMAX_MODEL = process.env.MINIMAX_MODEL ?? "MiniMax-M3";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "minimax/minimax-m3";

@Injectable()
export class WikiLlmClient {
  private readonly logger = new Logger(WikiLlmClient.name);
  private readonly provider: LlmProvider;
  private readonly minimaxClient: Anthropic | null;
  private readonly openrouterClient: Anthropic | null;

  constructor() {
    this.provider = this.resolveProvider();
    this.minimaxClient = this.createClient("minimax", MINIMAX_BASE_URL);
    this.openrouterClient = this.createClient("openrouter", OPENROUTER_BASE_URL);
  }

  async generate(input: UserPromptInputs): Promise<WikiLlmResult> {
    if (this.provider === "mock") return this.mockResult(input);
    try {
      if (this.provider === "minimax" && this.minimaxClient) {
        return await this.callProvider(this.minimaxClient, MINIMAX_MODEL, input);
      }
      if (this.provider === "openrouter" && this.openrouterClient) {
        return await this.callProvider(this.openrouterClient, OPENROUTER_MODEL, input);
      }
      this.logger.warn(`${this.provider} API key is not configured; using mock fallback`);
    } catch (error) {
      this.logger.warn(`${this.provider} request failed; using mock fallback: ${(error as Error).message}`);
    }
    return this.mockResult(input);
  }

  private resolveProvider(): LlmProvider {
    const configured = (process.env.LLM_PROVIDER ?? "mock").toLowerCase();
    if (configured === "mock" || configured === "minimax" || configured === "openrouter") return configured;
    this.logger.warn(`Unsupported LLM_PROVIDER=${configured}; using mock fallback`);
    return "mock";
  }

  private createClient(provider: "minimax" | "openrouter", baseURL: string): Anthropic | null {
    const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
    if (!apiKey) return null;
    return new Anthropic({ apiKey, baseURL });
  }

  private async callProvider(client: Anthropic, model: string, input: UserPromptInputs): Promise<WikiLlmResult> {
    const systemPrompt = await this.loadSystemPrompt();
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: renderUserPrompt(input) }],
    });
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("LLM response had no text block");
    const parsed = parseReply(textBlock.text);
    const title = String(parsed.title ?? "").slice(0, MAX_TITLE_CHARS).trim();
    const body = String(parsed.body ?? "").slice(0, MAX_BODY_CHARS).trim();
    if (!title || !body) throw new Error("LLM response missing title or body");
    return { title, body, modelVersion: `${model}@${PROMPT_VERSION}`, mocked: false };
  }

  private mockResult(input: UserPromptInputs): WikiLlmResult {
    const firstSource = input.sources[0];
    const cite = firstSource ? ` [${firstSource.url}]` : " _(források hiányában)_";
    const body = `A beküldött probléma („${input.problemTitle.slice(0, 80)}”) háttere jelenleg nem áll rendelkezésre automatikus elemzéssel. A tényleges wiki összefoglaló a V2 fázisban aktiválódik, amint a MiniMax API kulcs konfigurálva lesz.` + cite;
    return {
      title: `Háttér: ${input.problemTitle.slice(0, MAX_TITLE_CHARS - 12)}`.slice(0, MAX_TITLE_CHARS),
      body: body.slice(0, MAX_BODY_CHARS),
      modelVersion: `mock@${PROMPT_VERSION}`,
      mocked: true,
    };
  }

  private async loadSystemPrompt(): Promise<string> {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    return fs.readFile(path.join(__dirname, "prompts", "system.prompt.md"), "utf8");
  }
}

function parseReply(raw: string): { title?: string; body?: string } {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]+?)\s*```$/);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate) as { title?: string; body?: string };
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as { title?: string; body?: string };
      } catch {
        // Continue with the descriptive error below.
      }
    }
    throw new Error(`LLM reply was not valid JSON: ${trimmed.slice(0, 200)}`);
  }
}
