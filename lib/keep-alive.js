/**
 * Keep-alive pinger for Render free tier.
 * Render spins down free services after ~15 min of inactivity.
 * This pings the app's own /api/ping endpoint every 10 minutes
 * so it never goes idle during working hours.
 *
 * Called once from app/layout.js (server component, runs on boot).
 * Uses setInterval inside a try/catch so it never crashes the app.
 */

const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
let started = false;

export function startKeepAlive() {
  // Only start once, only on the server
  if (typeof window !== 'undefined') return;
  if (started) return;
  started = true;

  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3000';

  setInterval(async () => {
    try {
      await fetch(`${base}/api/ping`, { cache: 'no-store' });
    } catch {
      // Silently swallow — if the server is restarting, the next interval will succeed
    }
  }, PING_INTERVAL_MS);
}
