import { WikiLlmClient } from "./wiki-llm.client";

function testInput() {
  return {
    problemTitle: "Babaúszás",
    problemDescription: "A tanfolyam nem indul.",
    category: "institution",
    sources: [{
      url: "https://eger.hu/hirek/uszoda",
      title: "Uszoda",
      snippet: "A tanfolyam nem indul.",
    }],
  };
}

describe("WikiLlmClient (mock fallback)", () => {
  const ORIGINAL_ENV = process.env;
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.MINIMAX_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns a placeholder when no API key is set", async () => {
    const result = await new WikiLlmClient().generate(testInput());
    expect(result.mocked).toBe(true);
    expect(result.body.length).toBeLessThanOrEqual(1_500);
    expect(result.title.length).toBeLessThanOrEqual(200);
    expect(result.body).toContain("https://eger.hu/hirek/uszoda");
    expect(result.modelVersion).toMatch(/^mock@v\d+$/);
  });

  it("falls back even when sources is empty", async () => {
    const result = await new WikiLlmClient().generate({ ...testInput(), sources: [] });
    expect(result.mocked).toBe(true);
    expect(result.body.length).toBeLessThanOrEqual(1_500);
  });
});

describe("WikiLlmClient (provider selection)", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.MINIMAX_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("uses the mock placeholder when MiniMax is selected without an API key", async () => {
    process.env.LLM_PROVIDER = "minimax";
    const result = await new WikiLlmClient().generate(testInput());
    expect(result.mocked).toBe(true);
    expect(result.modelVersion).toMatch(/^mock@v\d+$/);
  });

  it("uses the mock placeholder when OpenRouter is selected without an API key", async () => {
    process.env.LLM_PROVIDER = "openrouter";
    const result = await new WikiLlmClient().generate(testInput());
    expect(result.mocked).toBe(true);
    expect(result.modelVersion).toMatch(/^mock@v\d+$/);
  });
});
