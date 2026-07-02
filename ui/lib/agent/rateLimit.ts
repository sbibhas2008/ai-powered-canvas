import { InMemoryMap } from "@/utils/inMemoryMap";

interface RateLimitConfig {
  /**
   * Cooldown period in milliseconds.
   * A second request from the same key within this window is rejected.
   * @default 5000
   */
  cooldownMs: number;
  /**
   * How often expired entries are purged from memory (ms).
   * @default 60_000
   */
  cleanupIntervalMs?: number;
}

/**
 * A simple per-key rate limiter backed by an in-memory TTL map.
 *
 * Strategy: each key (e.g. an IP address) is allowed one request per
 * `cooldownMs` window. Subsequent requests within the window are
 * rejected until the cooldown expires.
 */
class RateLimitService {
  private readonly store: InMemoryMap<string, number>;
  private readonly cooldownMs: number;

  constructor(config: RateLimitConfig) {
    this.cooldownMs = config.cooldownMs;
    this.store = new InMemoryMap<string, number>({
      ttlMs: config.cooldownMs,
      cleanupIntervalMs: config.cleanupIntervalMs,
    });
  }

  /**
   * Returns `true` if the key has been used within the cooldown window
   * (i.e. the request should be rejected). On the first request — or
   * after the cooldown has fully elapsed — it records the timestamp
   * and returns `false`.
   */
  isRateLimited(key: string): boolean {
    const now = Date.now();
    const last = this.store.get(key);

    if (last && now - last < this.cooldownMs) return true;

    this.store.set(key, now);
    return false;
  }

  /** Stops the background cleanup timer and releases resources. */
  destroy(): void {
    this.store.destroy();
  }
}

export type { RateLimitConfig };

export { RateLimitService };
