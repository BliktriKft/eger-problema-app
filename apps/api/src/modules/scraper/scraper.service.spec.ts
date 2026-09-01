import { SyncResult, ScraperService } from "./scraper.service";
import { ScraperHttpClient } from "../../common/scraper/scraper-http.client";
import { RobotsTxtService } from "../../common/scraper/robots-txt.service";
import { PRISMA_CLIENT } from "../../database/database.module";

/**
 * Lightweight integration test for the ScraperService orchestration.
 *
 * We stub:
 *   - the Prisma client (via the PRISMA_CLIENT token)
 *   - the HTTP client (returns a tiny RSS payload)
 *   - the robots.txt service (always allows)
 *
 * The goal is to verify that the service: parses RSS, filters by
 * query, persists UPSERTs, and writes a `wiki_scraper_logs` row.
 */

const rssXml = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Eger TV</title>
  <item>
    <title>Eger közlekedés: új körforgalom</title>
    <link>https://www.egertv.hu/2026/09/01/korforgalom</link>
    <pubDate>Mon, 01 Sep 2026 09:00:00 +0000</pubDate>
    <description>Új körforgalom a Rákóczi úton.</description>
  </item>
  <item>
    <title>Időjárás Egerben</title>
    <link>https://www.egertv.hu/2026/09/01/idojaras</link>
    <pubDate>Mon, 01 Sep 2026 07:00:00 +0000</pubDate>
    <description>Napos idő várható.</description>
  </item>
</channel></rss>`;

class StubHttp extends ScraperHttpClient {
  async fetchText(): Promise<string> {
    return rssXml;
  }
}
class StubRobots extends RobotsTxtService {
  async isAllowed(): Promise<boolean> {
    return true;
  }
}

interface MockState {
  scrapedUpserts: Array<{ url: string }>;
  logs: Array<{ source: string; status: string; durationMs: number }>;
}
const createMockPrisma = (state: MockState): unknown => ({
  scrapedArticle: {
    upsert: jest.fn(async ({ where }: { where: { url: string } }) => {
      state.scrapedUpserts.push({ url: where.url });
      return { id: "x", url: where.url };
    }),
  },
  wikiScraperLog: {
    create: jest.fn(
      async ({ data }: { data: { source: string; status: string; durationMs: number } }) => {
        state.logs.push(data);
        return { id: "log", ...data };
      },
    ),
  },
});

const buildService = (state: MockState): ScraperService => {
  const prisma = createMockPrisma(state);
  const svc = new ScraperService(
    prisma as never,
    new StubHttp() as unknown as ScraperHttpClient,
    new StubRobots(
      new StubHttp() as unknown as ScraperHttpClient,
    ),
  );
  // Override the PRISMA_CLIENT provider by stashing it on the instance.
  // (The constructor already took it via @Inject in the real module.)
  Object.defineProperty(svc, "prisma", { value: prisma });
  return svc;
};

describe("ScraperService.syncAll", () => {
  it("parses RSS, filters by query, UPSERTs articles, and writes log rows", async () => {
    const state: MockState = { scrapedUpserts: [], logs: [] };
    const svc = buildService(state);

    const results: SyncResult[] = await svc.syncAll({
      source: "egertv",
      sinceDays: 7,
      queries: ["Eger közlekedés"],
    });

    expect(results).toHaveLength(1);
    const r = results[0]!;
    expect(r.source).toBe("egertv");
    expect(r.status).toBe("success");
    expect(r.fetched).toBe(1); // only the közlekedés item passes the filter
    expect(r.upserted).toBe(1);
    expect(state.scrapedUpserts[0]?.url).toBe(
      "https://www.egertv.hu/2026/09/01/korforgalom",
    );
    expect(state.logs).toHaveLength(1);
    expect(state.logs[0]?.status).toBe("success");
    expect(state.logs[0]?.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("returns an error result when the source throws", async () => {
    class BrokenHttp extends ScraperHttpClient {
      async fetchText(): Promise<string> {
        throw new Error("network down");
      }
    }
    class AllowRobots extends RobotsTxtService {
      async isAllowed(): Promise<boolean> {
        return true;
      }
    }
    const state: MockState = { scrapedUpserts: [], logs: [] };
    const svc = new ScraperService(
      createMockPrisma(state) as never,
      new BrokenHttp() as unknown as ScraperHttpClient,
      new AllowRobots(new BrokenHttp() as unknown as ScraperHttpClient),
    );
    Object.defineProperty(svc, "prisma", { value: createMockPrisma(state) });

    const results = await svc.syncAll({
      source: "egertv",
      sinceDays: 7,
      queries: ["anything"],
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe("error");
    expect(results[0]?.errorMsg).toContain("network down");
    expect(state.logs[0]?.status).toBe("error");
  });

  it("throws when an unknown source is requested", async () => {
    const svc = buildService({ scrapedUpserts: [], logs: [] });
    await expect(
      svc.syncAll({ source: "nope", sinceDays: 7, queries: ["q"] }),
    ).rejects.toThrow(/Unknown scraper source/);
  });
});
