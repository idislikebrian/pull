type Bucket = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as unknown as {
  pullRateLimitBuckets?: Map<string, Bucket>;
};

const buckets = globalForRateLimit.pullRateLimitBuckets ?? new Map<string, Bucket>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.pullRateLimitBuckets = buckets;
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return { allowed: true, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { allowed: false, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, resetAt: bucket.resetAt };
}
