import { RobotsTxtService } from "./robots-txt.service";
import { ScraperHttpClient } from "./scraper-http.client";

/**
 * Unit tests for the robots.txt cache + decision logic.
 *
 * We stub the HTTP client so the tests do not hit real portals.
 */

class StubHttp extends ScraperHttpClient {
  private readonly responses: Map<string, string>;
  constructor(responses: Map<string, string>) {
    super();
    this.responses = responses;
  }
  // Override fetchText via prototype to keep the public surface narrow.
  async fetchText(url: string): Promise<string> {
    const body = this.responses.get(url);
    if (body === undefined) {
      throw new Error(`No stub response for ${url}`);
    }
    return body;
  }
}

const make = (responses: Map<string, string>): RobotsTxtService =>
  new RobotsTxtService(new StubHttp(responses) as unknown as ScraperHttpClient);

describe("RobotsTxtService", () => {
  it("allows paths not mentioned in robots.txt", async () => {
    const body = "User-agent: *\nDisallow: /admin\n";
    const svc = make(new Map([["https://example.com/robots.txt", body]]));
    await expect(
      svc.decideForTesting("https://example.com", "/news/foo"),
    ).resolves.toBe(true);
  });

  it("blocks paths under a Disallow rule", async () => {
    const body = "User-agent: *\nDisallow: /admin\n";
    const svc = make(new Map([["https://example.com/robots.txt", body]]));
    await expect(
      svc.decideForTesting("https://example.com", "/admin/users"),
    ).resolves.toBe(false);
  });

  it("prefers the longer prefix when Allow + Disallow conflict", async () => {
    const body =
      "User-agent: *\nDisallow: /private\nAllow: /private/public\n";
    const svc = make(new Map([["https://example.com/robots.txt", body]]));
    await expect(
      svc.decideForTesting("https://example.com", "/private/secret"),
    ).resolves.toBe(false);
    await expect(
      svc.decideForTesting("https://example.com", "/private/public/article"),
    ).resolves.toBe(true);
  });

  it("ignores other User-agent blocks (we only use the wildcard UA)", async () => {
    const body =
      "User-agent: badbot\nDisallow: /\n\nUser-agent: *\nDisallow: /admin\n";
    const svc = make(new Map([["https://example.com/robots.txt", body]]));
    await expect(
      svc.decideForTesting("https://example.com", "/anything"),
    ).resolves.toBe(true);
    await expect(
      svc.decideForTesting("https://example.com", "/admin/x"),
    ).resolves.toBe(false);
  });

  it("fails open when robots.txt is unreachable", async () => {
    const svc = make(new Map()); // empty → every fetch throws
    await expect(
      svc.decideForTesting("https://broken.example", "/foo"),
    ).resolves.toBe(true);
  });
});
