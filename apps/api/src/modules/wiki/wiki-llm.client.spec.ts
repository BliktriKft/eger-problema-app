/**
 * Unit tests for the multi-provider WikiLlmClient.
 *
 * Strategy:
 *   - Provider-selection tests construct the client with different
 *     `LLM_PROVIDER` / API-key combinations and check `getProvider()`.
 *   - Real-provider call tests `jest.mock("@anthropic-ai/sdk")` so
 *     no network call ever happens — we only verify that the right
 *     model name + system prompt are passed in.
 *   - Reply-parser tests exercise both the new textual `TITLE:` /
 *     `BODY:` format (preferred for MiniMax) and the legacy JSON
 *     format (preserved for Claude).
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AnthropicSdk = require("@anthropic-ai/sdk") as jest.MockedClass<any>;

jest.mock("@anthropic-ai/sdk", () => {
  // Each test sets the return value via `__mockCreate` below.
  const create = jest.fn();
  (globalThis as any).__mockCreate = create;
  return jest.fn().mockImplementation(() => ({
    messages: { create },
  }));
});

import { WikiLlmClient, parseReply, parseTextualReply } from "./wiki-llm.client";

/**
 * Helper: build the canonical `UserPromptInputs` for tests.
 */
function buildInput(
  overrides: Partial<{
    problemTitle: string;
    problemDescription: string;
    category: string;
    sources: Array<{ url: string; title: string; snippet: string }>;
  }> = {},
) {
  return {
    problemTitle: overrides.problemTitle ?? "Bicskey uszoda babaúszás megszűnt",
    problemDescription:
      overrides.problemDescription ??
      "A városi uszoda 2024 óta nem indít babaúszó kurzust.",
    category: overrides.category ?? "institution",
    sources: overrides.sources ?? [
      {
        url: "https://eger.hu/hirek/2024/01/uszoda",
        title: "Uszoda",
        snippet: "A városi uszoda bezárt.",
      },
    ],
  };
}

/**
 * Clear every LLM-related env var so each test starts from a
 * pristine `mock` baseline.
 */
function clearLlmEnv(): void {
  delete process.env.LLM_PROVIDER;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.MINIMAX_API_KEY;
  delete process.env.CLAUDE_MODEL;
  delete process.env.MINIMAX_MODEL;
}

/** Typed accessor for the mock create function. */
function mockCreate(): jest.Mock {
  return (globalThis as any).__mockCreate as jest.Mock;
}

beforeEach(() => {
  mockCreate().mockReset();
  AnthropicSdk.mockClear();
});

// =================================================================
// Mock-fallback tests (kept from the original spec — V1 behaviour).
// =================================================================

describe("WikiLlmClient (mock fallback)", () => {
  const ORIGINAL_ENV = process.env;
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    clearLlmEnv();
  });
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns a placeholder when no API key is set", async () => {
    const client = new WikiLlmClient();
    const result = await client.generate(buildInput());

    expect(result.mocked).toBe(true);
    expect(result.body.length).toBeLessThanOrEqual(1_500);
    expect(result.title.length).toBeLessThanOrEqual(200);
    expect(result.body).toContain("https://eger.hu/hirek/2024/01/uszoda");
    expect(result.modelVersion).toMatch(/^mock@v\d+$/);
    expect(mockCreate()).not.toHaveBeenCalled();
    expect(AnthropicSdk).not.toHaveBeenCalled();
  });

  it("falls back even when sources is empty", async () => {
    const client = new WikiLlmClient();
    const result = await client.generate(buildInput({ sources: [] }));
    expect(result.mocked).toBe(true);
    expect(result.body.length).toBeLessThanOrEqual(1_500);
  });
});

// =================================================================
// Multi-provider selection tests (V2 behaviour).
// =================================================================

describe("WikiLlmClient (provider selection)", () => {
  const ORIGINAL_ENV = process.env;
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    clearLlmEnv();
  });
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("defaults to `mock` when LLM_PROVIDER is unset", () => {
    const client = new WikiLlmClient();
    expect(client.getProvider()).toBe("mock");
  });

  it("defaults to `mock` when LLM_PROVIDER is the literal string 'mock'", () => {
    process.env.LLM_PROVIDER = "mock";
    const client = new WikiLlmClient();
    expect(client.getProvider()).toBe("mock");
  });

  it("falls back to `mock` when LLM_PROVIDER is an unknown value", () => {
    process.env.LLM_PROVIDER = "gpt-4-turbo";
    const client = new WikiLlmClient();
    expect(client.getProvider()).toBe("mock");
  });

  it("selects `mock` when LLM_PROVIDER=minimax but MINIMAX_API_KEY is missing", () => {
    process.env.LLM_PROVIDER = "minimax";
    const client = new WikiLlmClient();
    expect(client.getProvider()).toBe("mock");
  });

  it("selects `mock` when LLM_PROVIDER=claude but ANTHROPIC_API_KEY is missing", () => {
    process.env.LLM_PROVIDER = "claude";
    const client = new WikiLlmClient();
    expect(client.getProvider()).toBe("mock");
  });

  it("treats an empty MINIMAX_API_KEY as missing", () => {
    process.env.LLM_PROVIDER = "minimax";
    process.env.MINIMAX_API_KEY = "";
    const client = new WikiLlmClient();
    expect(client.getProvider()).toBe("mock");
  });

  it("selects `minimax` when LLM_PROVIDER=minimax and a key is present", () => {
    process.env.LLM_PROVIDER = "minimax";
    process.env.MINIMAX_API_KEY = "sk-minimax-test-123";
    const client = new WikiLlmClient();
    expect(client.getProvider()).toBe("minimax");
  });

  it("selects `claude` when LLM_PROVIDER=claude and a key is present", () => {
    process.env.LLM_PROVIDER = "claude";
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-123";
    const client = new WikiLlmClient();
    expect(client.getProvider()).toBe("claude");
  });

  it("uppercases / lowercases the LLM_PROVIDER env value", () => {
    process.env.LLM_PROVIDER = "MiniMax";
    process.env.MINIMAX_API_KEY = "sk-minimax-test";
    const client = new WikiLlmClient();
    expect(client.getProvider()).toBe("minimax");
  });
});

// =================================================================
// Real-provider call paths (SDK mocked — no network).
// =================================================================

describe("WikiLlmClient (real providers, SDK mocked)", () => {
  const ORIGINAL_ENV = process.env;
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    clearLlmEnv();
  });
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("calls Anthropic SDK when minimax is configured with a key", async () => {
    process.env.LLM_PROVIDER = "minimax";
    process.env.MINIMAX_API_KEY = "sk-minimax-test";
    process.env.MINIMAX_MODEL = "MiniMax-M3";
    mockCreate().mockResolvedValue({
      content: [
        {
          type: "text",
          text: "TITLE: Teszt cím\n\nBODY:\nLorem ipsum [1] dolor [2].",
        },
      ],
    });

    const client = new WikiLlmClient();
    expect(client.getProvider()).toBe("minimax");

    const result = await client.generate(buildInput());

    expect(AnthropicSdk).toHaveBeenCalledTimes(1);
    const ctorArgs = AnthropicSdk.mock.calls[0][0];
    expect(ctorArgs.apiKey).toBe("sk-minimax-test");
    expect(ctorArgs.baseURL).toBe("https://api.minimax.io/anthropic");

    expect(mockCreate()).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate().mock.calls[0][0];
    expect(callArgs.model).toBe("MiniMax-M3");
    expect(callArgs.system).toContain("Eger");
    expect(callArgs.messages[0].role).toBe("user");
    expect(callArgs.messages[0].content).toContain("Bicskey uszoda");

    expect(result.mocked).toBe(false);
    expect(result.title).toBe("Teszt cím");
    expect(result.body).toContain("Lorem ipsum");
    expect(result.modelVersion).toMatch(/^minimax:MiniMax-M3@v\d+$/);
  });

  it("calls Anthropic SDK with claude model when LLM_PROVIDER=claude", async () => {
    process.env.LLM_PROVIDER = "claude";
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.CLAUDE_MODEL = "claude-3-5-sonnet-latest";
    mockCreate().mockResolvedValue({
      content: [
        {
          type: "text",
          text: '{"title":"JSON title","body":"JSON body [1]"}',
        },
      ],
    });

    const client = new WikiLlmClient();
    const result = await client.generate(buildInput());

    expect(AnthropicSdk).toHaveBeenCalledTimes(1);
    const ctorArgs = AnthropicSdk.mock.calls[0][0];
    expect(ctorArgs.apiKey).toBe("sk-ant-test");
    // No baseURL override for the official Claude SDK.
    expect(ctorArgs.baseURL).toBeUndefined();

    expect(mockCreate()).toHaveBeenCalledTimes(1);
    expect(mockCreate().mock.calls[0][0].model).toBe(
      "claude-3-5-sonnet-latest",
    );

    expect(result.title).toBe("JSON title");
    expect(result.body).toBe("JSON body [1]");
    expect(result.modelVersion).toMatch(
      /^claude:claude-3-5-sonnet-latest@v\d+$/,
    );
  });

  it("falls back to mock when the API call throws (runtime error)", async () => {
    process.env.LLM_PROVIDER = "minimax";
    process.env.MINIMAX_API_KEY = "sk-minimax-test";
    mockCreate().mockRejectedValue(new Error("network down"));

    const client = new WikiLlmClient();
    const result = await client.generate(buildInput());

    expect(result.mocked).toBe(true);
    expect(result.modelVersion).toMatch(/^mock@v\d+$/);
    expect(result.body).toContain("https://eger.hu/hirek/2024/01/uszoda");
  });

  it("falls back to mock when the API returns an empty content array", async () => {
    process.env.LLM_PROVIDER = "claude";
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    mockCreate().mockResolvedValue({ content: [] });

    const client = new WikiLlmClient();
    const result = await client.generate(buildInput());

    expect(result.mocked).toBe(true);
  });

  it("falls back to mock when the parsed reply is missing title+body", async () => {
    process.env.LLM_PROVIDER = "minimax";
    process.env.MINIMAX_API_KEY = "sk-minimax-test";
    mockCreate().mockResolvedValue({
      content: [{ type: "text", text: "TITLE:\n\nBODY:\n" }],
    });

    const client = new WikiLlmClient();
    const result = await client.generate(buildInput());

    expect(result.mocked).toBe(true);
  });

  it("respects WIKI_MAX_BODY_CHARS truncation on mock output", async () => {
    // MAX_BODY_CHARS is captured at module load. We verify the
    // default (1500) is respected when no override is given.
    const client = new WikiLlmClient();
    const result = await client.generate(
      buildInput({
        problemTitle: "Ez egy nagyon hosszú cím, amit le kell vágni",
      }),
    );
    expect(result.mocked).toBe(true);
    expect(result.body.length).toBeLessThanOrEqual(1_500);
  });
});

// =================================================================
// Reply-parser tests (TITLE: / BODY: format).
// =================================================================

describe("parseReply / parseTextualReply", () => {
  it("parses the textual TITLE: / BODY: format with a blank line", () => {
    const parsed = parseReply(
      "TITLE: Bicskey uszoda háttér\n\nBODY:\nA babaúszás 2024 óta nem indul [1].",
    );
    expect(parsed.title).toBe("Bicskey uszoda háttér");
    expect(parsed.body).toBe("A babaúszás 2024 óta nem indul [1].");
  });

  it("parses the textual format with BODY on the same line", () => {
    const parsed = parseReply(
      "TITLE: Rövid cím\nBODY:\nLorem ipsum dolor [1].",
    );
    expect(parsed.title).toBe("Rövid cím");
    expect(parsed.body).toBe("Lorem ipsum dolor [1].");
  });

  it("falls back to JSON when the textual format is missing", () => {
    const parsed = parseReply('{"title":"JSON title","body":"JSON body"}');
    expect(parsed.title).toBe("JSON title");
    expect(parsed.body).toBe("JSON body");
  });

  it("prefers the textual format over a stray JSON-looking substring", () => {
    const parsed = parseReply(
      'TITLE: Elsődleges cím\n\nBODY:\nA body hivatkozik { "title":"ignore" }-ra [1].',
    );
    expect(parsed.title).toBe("Elsődleges cím");
    expect(parsed.body).toContain("{ \"title\":\"ignore\" }");
  });

  it("throws when neither TITLE nor JSON is present (caller falls back to mock)", () => {
    // This documents the contract: the wiki service catches the
    // throw and falls back to the mock result. parseReply itself
    // is a low-level parser and surfaces the error.
    expect(() => parseReply("Csak sima szöveg idézet nélkül.")).toThrow(
      /not valid JSON/,
    );
  });

  it("parseTextualReply returns undefined for missing fields", () => {
    expect(parseTextualReply("BODY:\ncsak body")).toEqual({ body: "csak body" });
    expect(parseTextualReply("TITLE: csak title")).toEqual({
      title: "csak title",
    });
  });
});
