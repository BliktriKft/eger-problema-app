import { DomainRateLimiter } from "./domain-rate-limiter";

describe("DomainRateLimiter", () => {
  it("sleeps until the configured interval has elapsed", async () => {
    const limiter = new DomainRateLimiter(20);
    const waited1 = await limiter.wait("example.com");
    expect(waited1).toBe(0);
    const start = Date.now();
    const waited2 = await limiter.wait("example.com");
    expect(waited2).toBeGreaterThanOrEqual(15); // 20ms - jitter
    expect(Date.now() - start).toBeGreaterThanOrEqual(15);
  });

  it("does not block independent domains", async () => {
    const limiter = new DomainRateLimiter(10_000);
    const a = await limiter.wait("a.example");
    const b = await limiter.wait("b.example");
    expect(a).toBe(0);
    expect(b).toBe(0);
  });

  it("honors a custom interval", () => {
    const limiter = new DomainRateLimiter(2_500);
    expect(limiter.intervalMs).toBe(2_500);
  });
});
