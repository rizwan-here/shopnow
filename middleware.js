import { NextResponse } from 'next/server';

const RESERVED = new Set([
  'api',
  'dashboard',
  'store',
  'privacy-policy',
  'terms-and-conditions',
  '_next',
  'favicon.ico',
  'robots.txt',
  'uploads',
  'media'
]);

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/store/') ||
    pathname.startsWith('/uploads/') ||
    pathname.startsWith('/media/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const slug = pathname.slice(1);
  if (!slug || RESERVED.has(slug)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/store/${slug}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
