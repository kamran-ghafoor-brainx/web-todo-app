type Limit = { max: number; windowMs: number };

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

const hitsByKey = new Map<string, number[]>();

export function checkRateLimit(key: string, { max, windowMs }: Limit): RateLimitResult {
  const now = Date.now();
  const recent = (hitsByKey.get(key) ?? []).filter((time) => now - time < windowMs);

  if (recent.length >= max) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    hitsByKey.set(key, recent);
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  hitsByKey.set(key, recent);
  return { allowed: true };
}

export function resetRateLimits(): void {
  hitsByKey.clear();
}
