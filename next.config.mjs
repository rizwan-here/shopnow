const isProd = process.env.NODE_ENV === 'production';

// Content-Security-Policy is shipped in REPORT-ONLY mode so it cannot break
// AdSense / Paddle / Cloudinary / social images. Watch the browser console for
// violations, tighten as needed, then rename the header to
// "Content-Security-Policy" to enforce it.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://cdn.paddle.com https://*.paddle.com https://www.googletagservices.com https://adservice.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.paddle.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net",
  "frame-src 'self' https://*.paddle.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://*.paddle.com")' },
  { key: 'Content-Security-Policy-Report-Only', value: csp },
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }] : [])
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // The app renders images with plain <img>; next/image is not used. Restrict
  // the optimizer so /_next/image cannot be used as an open proxy.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' }
    ]
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  }
};

export default nextConfig;
