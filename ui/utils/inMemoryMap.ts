export interface InMemoryMapConfig {
  ttlMs?: number;
  cleanupIntervalMs?: number;
}

export class InMemoryMap<K, V> {
  private map = new Map<K, V>();
  private expires = new Map<K, number>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private config?: InMemoryMapConfig) {
    if (config?.ttlMs) {
      this.cleanupTimer = setInterval(
        () => this.cleanup(),
        config.cleanupIntervalMs ?? 60_000,
      );
    }
  }

  get(key: K): V | undefined {
    if (this.config?.ttlMs) {
      const exp = this.expires.get(key);

      if (exp && Date.now() > exp) {
        this.delete(key);
        return undefined;
      }
    }

    return this.map.get(key);
  }

  set(key: K, value: V): void {
    this.map.set(key, value);
    if (this.config?.ttlMs) {
      this.expires.set(key, Date.now() + this.config.ttlMs);
    }
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): void {
    this.map.delete(key);
    this.expires.delete(key);
  }

  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }

  clear(): void {
    this.map.clear();
    this.expires.clear();
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [key, exp] of this.expires) {
      if (now > exp) this.delete(key);
    }
  }
}
