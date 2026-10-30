// Small input-validation helpers shared by API routes.

/** Coerce any input to a trimmed string (objects/arrays become ''), preventing NoSQL operator injection. */
export function str(value, maxLen = 500) {
  if (typeof value === 'number' || typeof value === 'boolean') value = String(value);
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

/** Allow only http(s) URLs. Returns the cleaned URL or '' if invalid/empty. */
export function safeHttpUrl(value, maxLen = 2000) {
  const raw = str(value, maxLen);
  if (!raw) return '';
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Image reference: http(s) URL, same-origin path, or raster data URI.
 * Returns the cleaned value, '' when empty, or null when invalid.
 */
export function safeImageRef(value, maxLen = 2_000_000) {
  if (typeof value !== 'string') return value === undefined || value === null ? '' : null;
  const raw = value.trim();
  if (!raw) return '';
  if (/^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=]+$/i.test(raw) && raw.length <= maxLen) return raw;
  if (raw.startsWith('/') && !raw.startsWith('//') && raw.length <= 500) return raw;
  return safeHttpUrl(raw, 2000);
}

export async function readJson(request) {
  try {
    const data = await request.json();
    return data && typeof data === 'object' ? data : {};
  } catch {
    return null;
  }
}
