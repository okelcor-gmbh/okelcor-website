/**
 * lib/rate-limit.ts
 *
 * Lightweight in-memory token-bucket rate limiter for Next.js API routes.
 * Keyed by an arbitrary string (typically "route:ip").
 *
 * Notes:
 * - State is per-process (per Vercel instance). Effective against casual abuse;
 *   not a distributed global lock. Good enough for the current scale.
 * - Map is never explicitly pruned — entries are evicted lazily when their
 *   reset timestamp is exceeded on the next request for the same key.
 */

import { NextResponse } from "next/server";

type Entry = { count: number; reset: number };

const store = new Map<string, Entry>();

/**
 * Check whether a keyed bucket has capacity.
 * Returns true (allowed) or false (over limit).
 *
 * @param key       Unique bucket identifier, e.g. "login:1.2.3.4"
 * @param limit     Max requests in the window
 * @param windowMs  Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

/**
 * Return how many seconds remain in the current window for a key.
 * Returns 0 if the window has already expired (i.e. the next request will be allowed).
 */
export function retryAfter(key: string): number {
  const entry = store.get(key);
  if (!entry) return 0;
  const remaining = Math.ceil((entry.reset - Date.now()) / 1000);
  return Math.max(0, remaining);
}

/**
 * Extract the real client IP from standard proxy headers.
 * Handles Vercel, Cloudflare, and plain reverse-proxy setups.
 */
export function getClientIp(request: Request): string {
  const h = request.headers as { get(k: string): string | null };
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/**
 * Build a 429 JSON response with Retry-After header.
 */
export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      message: "Too many attempts. Please wait and try again.",
      retry_after: retryAfterSeconds,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}

/**
 * Emit a structured console.warn so rate-limit blocks are visible in server
 * logs without being noisy in development.
 */
export function warnRateLimit(
  route: string,
  method: string,
  ip: string,
  userAgent: string
): void {
  console.warn(
    `[rate-limit] BLOCKED route=${route} method=${method} ip=${ip} ua="${(userAgent ?? "").slice(0, 100)}"`
  );
}
