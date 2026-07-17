// lib/rateLimit.ts
//
// In-memory sliding-window rate limiter.
//
// NOTE (serverless caveat): state lives in one serverless instance's memory
// and is NOT shared across Vercel's concurrent instances or cold starts. It
// reliably stops a single client hammering a warm instance — the realistic
// bill-shock threat — with zero external dependencies. If sustained traffic
// grows, swap the Map for a shared store (Upstash Redis / Postgres) behind
// this same interface without touching the call sites.

type Timestamps = number[]; // request times in ms, oldest-first

const store = new Map<string, Timestamps>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/**
 * Records a hit for `key` and reports whether it's within `limit` requests
 * per `windowMs`. Blocked requests do NOT consume a slot (the window isn't
 * extended by rejected calls).
 */
export function rateLimit(key: string, opts: { limit: number; windowMs: number }): RateLimitResult {
  const now = Date.now();
  const windowStart = now - opts.windowMs;
  const hits = (store.get(key) || []).filter((t) => t > windowStart);

  if (hits.length >= opts.limit) {
    store.set(key, hits);
    const retryAfterSec = Math.max(1, Math.ceil((hits[0] + opts.windowMs - now) / 1000));
    return { ok: false, retryAfterSec };
  }

  hits.push(now);
  store.set(key, hits);
  return { ok: true };
}

// Periodic cleanup so a long-lived warm instance doesn't grow the Map forever.
let lastSweep = 0;
export function maybeSweep(maxWindowMs: number) {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, hits] of store) {
    const alive = hits.filter((t) => t > now - maxWindowMs);
    if (alive.length === 0) store.delete(key);
    else store.set(key, alive);
  }
}

/** Best-effort client IP from common proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return (req.headers.get('x-real-ip') || 'unknown').trim();
}
