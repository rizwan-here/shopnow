import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-store';

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || 'http://localhost:3000';
}

export async function GET() {
  const session = await requireSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/dashboard?facebook=login_required', getBaseUrl()));
  }

  if (!process.env.AUTH_FACEBOOK_ID || !process.env.AUTH_FACEBOOK_SECRET) {
    return NextResponse.redirect(new URL('/dashboard?facebook=not_configured', getBaseUrl()));
  }

  const redirectUri = `${getBaseUrl()}/api/facebook/callback`;
  const state = Buffer.from(JSON.stringify({ userId: session.user.id, ts: Date.now() })).toString('base64url');
  const params = new URLSearchParams({
    client_id: process.env.AUTH_FACEBOOK_ID,
    redirect_uri: redirectUri,
    state,
    response_type: 'code',
    scope: 'pages_show_list,pages_read_engagement,pages_manage_posts'
  });

  return NextResponse.redirect(`https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`);
}
