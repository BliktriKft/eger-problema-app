import { WikiLlmClient } from "./wiki-llm.client";

/**
 * Verifies the mock-fallback path. The Anthropic SDK requires an
 * API key, so without `ANTHROPIC_API_KEY` set the client must return
 * a deterministic Hungarian placeholder.
 */
describe("WikiLlmClient (mock fallback)", () => {
  const ORIGINAL_ENV = process.env;
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns a placeholder when no API key is set", async () => {
    const client = new WikiLlmClient();
    const result = await client.generate({
      problemTitle: "Bicskey uszoda babaúszás megszűnt",
      problemDescription: "A városi uszoda 2024 óta nem indít babaúszó kurzust.",
      category: "institution",
      sources: [
        {
          url: "https://eger.hu/hirek/2024/01/uszoda",
          title: "Uszoda",
          snippet: "A városi uszoda bezárt.",
        },
      ],
    });

    expect(result.mocked).toBe(true);
    expect(result.body.length).toBeLessThanOrEqual(1_500);
    expect(result.title.length).toBeLessThanOrEqual(200);
    // Must cite at least one source so the "every claim has a citation"
    // validator downstream does not reject the response.
    expect(result.body).toContain("https://eger.hu/hirek/2024/01/uszoda");
    expect(result.modelVersion).toMatch(/^mock@v\d+$/);
  });

  it("falls back even when sources is empty", async () => {
    const client = new WikiLlmClient();
    const result = await client.generate({
      problemTitle: "x",
      problemDescription: "y",
      category: "other",
      sources: [],
    });
    expect(result.mocked).toBe(true);
    expect(result.body.length).toBeLessThanOrEqual(1_500);
  });
});
