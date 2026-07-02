import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimitService } from "./rateLimit";

let limiter: RateLimitService;

beforeEach(() => {
  vi.useFakeTimers();
  limiter = new RateLimitService({ cooldownMs: 5_000 });
});

afterEach(() => {
  limiter.destroy();
  vi.useRealTimers();
});

describe("RateLimitService", () => {
  it("allows the first request", () => {
    expect(limiter.isRateLimited("10.0.0.1")).toBe(false);
  });

  it("blocks immediate second request from same key", () => {
    limiter.isRateLimited("10.0.0.2");

    expect(limiter.isRateLimited("10.0.0.2")).toBe(true);
  });

  it("allows request after cooldown period", () => {
    limiter.isRateLimited("10.0.0.3");

    vi.advanceTimersByTime(5_001);

    expect(limiter.isRateLimited("10.0.0.3")).toBe(false);
  });

  it("allows different key during cooldown", () => {
    limiter.isRateLimited("10.0.0.4");

    expect(limiter.isRateLimited("10.0.0.5")).toBe(false);
  });

  it("blocks same key within cooldown window", () => {
    limiter.isRateLimited("10.0.0.6");

    vi.advanceTimersByTime(3_000);

    expect(limiter.isRateLimited("10.0.0.6")).toBe(true);
  });

  it("allows request after cooldown boundary", () => {
    limiter.isRateLimited("10.0.0.7");

    vi.advanceTimersByTime(10_000);

    expect(limiter.isRateLimited("10.0.0.7")).toBe(false);
  });

  it("tracks multiple keys independently", () => {
    limiter.isRateLimited("10.0.0.8");
    limiter.isRateLimited("10.0.0.9");

    expect(limiter.isRateLimited("10.0.0.8")).toBe(true);
    expect(limiter.isRateLimited("10.0.0.9")).toBe(true);

    vi.advanceTimersByTime(5_001);

    expect(limiter.isRateLimited("10.0.0.8")).toBe(false);
    expect(limiter.isRateLimited("10.0.0.9")).toBe(false);
  });

  it("respects custom cooldown", () => {
    const custom = new RateLimitService({ cooldownMs: 1_000 });

    custom.isRateLimited("10.0.0.10");
    expect(custom.isRateLimited("10.0.0.10")).toBe(true);

    vi.advanceTimersByTime(1_001);
    expect(custom.isRateLimited("10.0.0.10")).toBe(false);

    custom.destroy();
  });
});
