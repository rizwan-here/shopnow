// Minimal in-memory sliding-window rate limiter.
// Good enough for a single-instance deployment (e.g. one Render web service).
// For multi-instance deployments, swap the Map for Redis/Upstash.
const buckets = new Map();
const MAX_KEYS = 10000;

export function getClientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Returns { ok, retryAfter }. `key` should include the route name + identity.
 */
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) {
      if (!v.length || now - v[v.length - 1] > windowMs) buckets.delete(k);
    }
    if (buckets.size > MAX_KEYS) buckets.clear();
  }
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfter: 0 };
}

export function tooManyRequests(NextResponse, retryAfter) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again shortly.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter || 60) } }
  );
}
