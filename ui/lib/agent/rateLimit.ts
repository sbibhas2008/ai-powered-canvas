import { InMemoryMap } from "@/utils/inMemoryMap";

const RATE_LIMIT_MS = 5_000;

const requests = new InMemoryMap<string, number>({
  ttlMs: RATE_LIMIT_MS,
});

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const last = requests.get(ip);

  if (last && now - last < RATE_LIMIT_MS) return true;

  requests.set(ip, now);

  return false;
}
