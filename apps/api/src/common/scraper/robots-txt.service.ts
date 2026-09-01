import { Injectable, Logger } from "@nestjs/common";
import { ScraperHttpClient } from "./scraper-http.client";

/**
 * In-memory cache for robots.txt decisions.
 *
 * For each (domain, path-prefix) pair we remember whether scraping is
 * allowed. The cache is per-process; it is rebuilt on cold start.
 * Eger TV / Egri Hírek / HEOL each return a single robots.txt that
 * covers the whole domain, so the lookup degenerates to a per-domain
 * map in practice.
 */
interface RobotsDecision {
  allowed: boolean;
  /** Why the decision was made (for logs and audit). */
  reason: string;
  /** `expiresAt` ms epoch — entries are dropped after 1 h. */
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1_000; // 1 hour

/**
 * Tiny subset of the robots.txt grammar — enough to cover the
 * User-agent / Disallow / Allow directives used by Hungarian news
 * portals. We intentionally do NOT implement crawl-delay (we apply a
 * global 5 s rate limit instead), sitemap directives, or wildcard
 * expansion beyond the literal patterns we see.
 */
interface ParsedRobots {
  /** Lowercase directive value → list of path prefixes to disallow. */
  disallow: string[];
  allow: string[];
}

@Injectable()
export class RobotsTxtService {
  private readonly logger = new Logger(RobotsTxtService.name);
  private readonly cache = new Map<string, RobotsDecision>();

  constructor(private readonly http: ScraperHttpClient) {}

  /**
   * Returns `true` if `url` is allowed to be scraped according to the
   * target site's robots.txt. The decision is cached per domain.
   *
   * Failure policy: if robots.txt cannot be fetched (network error,
   * non-200, parse error), we **fail open** (allow the scrape) and
   * log a warning. Rationale: silently blocking the wiki generation
   * pipeline because a portal is briefly down is worse than scraping
   * a few extra pages. The decision is auditable via the warning log.
   */
  async isAllowed(url: string): Promise<boolean> {
    const { origin, pathname } = this.parseUrl(url);
    const key = origin;
    const now = Date.now();

    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > now) {
      return this.applyDecision(cached, pathname);
    }

    const decision = await this.fetchAndDecide(origin, pathname);
    return this.applyDecision(decision, pathname);
  }

  /** Internal — exposed for tests only. */
  async decideForTesting(origin: string, pathname: string): Promise<boolean> {
    const decision = await this.fetchAndDecide(origin, pathname);
    return this.applyDecision(decision, pathname);
  }

  /** Internal — exposed for tests only. */
  clearCache(): void {
    this.cache.clear();
  }

  private applyDecision(d: RobotsDecision, pathname: string): boolean {
    if (!d.allowed) {
      this.logger.debug(
        `Robots denied ${pathname} (${d.reason})`,
      );
    }
    return d.allowed;
  }

  private async fetchAndDecide(
    origin: string,
    pathname: string,
  ): Promise<RobotsDecision> {
    const robotsUrl = `${origin}/robots.txt`;
    try {
      const body = await this.http.fetchText(robotsUrl, { maxAttempts: 1 });
      const parsed = this.parse(body);
      const decision = this.matchPath(parsed, pathname);
      this.cache.set(origin, {
        allowed: decision.allowed,
        reason: decision.reason,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return {
        allowed: decision.allowed,
        reason: decision.reason,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
    } catch (err) {
      this.logger.warn(
        `robots.txt fetch failed for ${robotsUrl}: ${(err as Error).message}; failing open`,
      );
      const open: RobotsDecision = {
        allowed: true,
        reason: `robots.txt unavailable: ${(err as Error).message}`,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
      this.cache.set(origin, open);
      return open;
    }
  }

  private parse(body: string): ParsedRobots {
    const disallow: string[] = [];
    const allow: string[] = [];
    // Track the most recently seen User-agent block — we only honor
    // the wildcard `*` block because we never send a custom UA that
    // a portal would specifically address.
    let inWildcardBlock = false;
    let seenAnyBlock = false;

    for (const rawLine of body.split(/\r?\n/)) {
      const line = rawLine.replace(/#.*$/, "").trim();
      if (!line) {
        continue;
      }
      const idx = line.indexOf(":");
      if (idx === -1) {
        continue;
      }
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();

      if (key === "user-agent") {
        seenAnyBlock = true;
        inWildcardBlock = value === "*";
        continue;
      }
      if (!inWildcardBlock) {
        continue;
      }
      if (key === "disallow" && value) {
        disallow.push(value);
      } else if (key === "allow" && value) {
        allow.push(value);
      }
    }

    // If a robots.txt has no `User-agent: *` block but mentions other
    // agents, our wildcard UA means no rules apply — allow all.
    if (!seenAnyBlock) {
      return { disallow: [], allow: [] };
    }
    return { disallow, allow };
  }

  /**
   * Match a path against parsed Allow/Disallow rules. Per the spec,
   * the most-specific match wins; longer prefixes win ties. We do
   * not implement `$` anchors or `*` wildcards — the three target
   * portals do not use them.
   */
  private matchPath(
    parsed: ParsedRobots,
    pathname: string,
  ): { allowed: boolean; reason: string } {
    let bestDisallow: string | null = null;
    let bestAllow: string | null = null;

    for (const prefix of parsed.disallow) {
      if (pathname.startsWith(prefix) && (bestDisallow === null || prefix.length > bestDisallow.length)) {
        bestDisallow = prefix;
      }
    }
    for (const prefix of parsed.allow) {
      if (pathname.startsWith(prefix) && (bestAllow === null || prefix.length > bestAllow.length)) {
        bestAllow = prefix;
      }
    }

    if (bestDisallow === null) {
      return { allowed: true, reason: "no disallow rule matches" };
    }
    if (bestAllow !== null && bestAllow.length >= bestDisallow.length) {
      return { allowed: true, reason: `allow rule ${bestAllow} overrides ${bestDisallow}` };
    }
    return { allowed: false, reason: `disallowed by ${bestDisallow}` };
  }

  private parseUrl(url: string): { origin: string; pathname: string } {
    const u = new URL(url);
    return { origin: u.origin, pathname: u.pathname || "/" };
  }
}
