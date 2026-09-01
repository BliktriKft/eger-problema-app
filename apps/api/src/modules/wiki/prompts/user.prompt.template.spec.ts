import {
  renderUserPrompt,
  USER_PROMPT_TEMPLATE,
} from "./user.prompt.template";

describe("renderUserPrompt", () => {
  it("substitutes all four placeholders", () => {
    const out = renderUserPrompt({
      problemTitle: "Bicskey uszoda babaúszás megszűnt",
      problemDescription: "Az uszoda 2024 óta nem indít babaúszó kurzust.",
      category: "institution",
      sources: [
        {
          url: "https://eger.hu/hirek/2024/01/uszoda",
          title: "Uszoda bezárás",
          snippet: "A városi uszoda…",
        },
      ],
    });
    expect(out).toContain("Bicskey uszoda babaúszás megszűnt");
    expect(out).toContain("Az uszoda 2024 óta");
    expect(out).toContain("institution");
    expect(out).toContain("https://eger.hu/hirek/2024/01/uszoda");
    // No literal placeholder text should remain.
    expect(out).not.toMatch(/\{problemTitle\}|\{problemDescription\}|\{category\}|\{sources\}/);
  });

  it("includes a sentinel when no sources are available", () => {
    const out = renderUserPrompt({
      problemTitle: "x",
      problemDescription: "y",
      category: "other",
      sources: [],
    });
    expect(out).toContain("_(nincsenek elérhető források)_");
  });

  it("truncates source snippets at 500 chars", () => {
    const longSnippet = "a".repeat(2_000);
    const out = renderUserPrompt({
      problemTitle: "x",
      problemDescription: "y",
      category: "other",
      sources: [{ url: "https://e.hu", title: "T", snippet: longSnippet }],
    });
    // The 500-char slice appears once per source in the rendered prompt.
    const matches = out.match(/a{500}/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // The 501st char must not appear in the snippet block.
    expect(out).not.toContain("a".repeat(501));
  });

  it("exposes the template for editorial review", () => {
    expect(USER_PROMPT_TEMPLATE).toContain("{problemTitle}");
    expect(USER_PROMPT_TEMPLATE).toContain("{sources}");
  });
});
