# Security fixes

| Area | Fix |
|---|---|
| Hardcoded credentials | Removed live MongoDB URI from `.env.example` (**rotate the password; it is still in git history**) |
| Price tampering | `POST /api/orders` recomputes prices/totals/delivery from the DB |
| Race conditions | Atomic stock reservation (`$gte` guard + `$inc`), rollback on failure |
| NoSQL injection | All request values coerced with `str()` before reaching queries |
| BOLA / data exposure | Orders, owner identity and billing fields only returned to the store owner |
| Order lookup | Fixed empty-phone match; rate limited; unguessable order numbers |
| Payments | `request_pro` no longer grants Pro; Paddle webhook rejects stale timestamps |
| Function-level access | Order status validated against allow-list |
| Stored XSS / CSS injection | Only http(s)/safe image refs stored; banner `url()` JSON-quoted |
| File upload | Magic-byte check, SVG rejected, per-user rate limit |
| Auth/session | Facebook OAuth nonce cookie + expiry; session maxAge 7 days |
| Headers | nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS; CSP in **Report-Only** |
| Dependencies | next 15.5.28, react 19.2.9, next-auth 5.0.0-beta.32 / @auth/core 0.41.3, mongoose 8.24.6 (critical advisories cleared) |

## Known remaining items
- `npm audit`: 7 findings left (build-time: PostCSS bundled inside Next, dev-only eslint glob chain). Fully fixed only by Next 16 (major upgrade).
- Rate limiting is in-memory (single instance). Use Redis/Upstash if you scale out.
- `orders/lookup` still lets anyone with a phone/email list that customer's order numbers/status (needed for the "My orders" feature). Add an OTP/magic-link step to fully close it.
- Promote CSP from Report-Only to enforced after checking the browser console.
