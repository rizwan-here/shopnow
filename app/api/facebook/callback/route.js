import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireSession } from '@/lib/auth-store';
import FacebookConnection from '@/models/FacebookConnection';

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || 'http://localhost:3000';
}

const NONCE_COOKIE = 'fb_oauth_nonce';
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function redirectTo(path, baseUrl) {
  const response = NextResponse.redirect(new URL(path, baseUrl));
  response.cookies.set(NONCE_COOKIE, '', { path: '/api/facebook', maxAge: 0 });
  return response;
}

export async function GET(request) {
  const session = await requireSession();
  const baseUrl = getBaseUrl();
  if (!session?.user?.id) {
    return redirectTo('/dashboard?facebook=login_required', baseUrl);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error') || searchParams.get('error_message');

  if (error || !code) {
    return redirectTo('/dashboard?facebook=oauth_error', baseUrl);
  }

  // State is mandatory and must match the nonce cookie set when the flow started.
  if (!state) {
    return redirectTo('/dashboard?facebook=state_invalid', baseUrl);
  }
  try {
    const parsedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    const cookieNonce = request.cookies.get(NONCE_COOKIE)?.value || '';
    const nonceOk =
      typeof parsedState.nonce === 'string' &&
      cookieNonce.length > 0 &&
      parsedState.nonce.length === cookieNonce.length &&
      crypto.timingSafeEqual(Buffer.from(parsedState.nonce), Buffer.from(cookieNonce));
    if (!nonceOk || Date.now() - Number(parsedState.ts) > STATE_MAX_AGE_MS) {
      return redirectTo('/dashboard?facebook=state_mismatch', baseUrl);
    }
    if (parsedState.userId !== session.user.id) {
      return redirectTo('/dashboard?facebook=state_mismatch', baseUrl);
    }
  } catch {
    return redirectTo('/dashboard?facebook=state_invalid', baseUrl);
  }

  try {
    const redirectUri = `${baseUrl}/api/facebook/callback`;
    const tokenParams = new URLSearchParams({
      client_id: process.env.AUTH_FACEBOOK_ID,
      client_secret: process.env.AUTH_FACEBOOK_SECRET,
      redirect_uri: redirectUri,
      code
    });

    const tokenResponse = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams.toString()}`, { cache: 'no-store' });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData?.error?.message || 'Could not exchange Facebook code');
    }

    const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(tokenData.access_token)}`, { cache: 'no-store' });
    const pagesData = await pagesResponse.json();
    const pages = Array.isArray(pagesData?.data)
      ? pagesData.data.filter((page) => page.id && page.name && page.access_token).map((page) => ({ pageId: page.id, pageName: page.name, accessToken: page.access_token }))
      : [];

    if (!pages.length) {
      return redirectTo('/dashboard?facebook=no_pages', baseUrl);
    }

    await connectToDatabase();
    const existing = await FacebookConnection.findOne({ ownerId: session.user.id });
    const selectedPage = existing?.selectedPageId ? pages.find((page) => page.pageId === existing.selectedPageId) || pages[0] : pages[0];

    await FacebookConnection.findOneAndUpdate(
      { ownerId: session.user.id },
      {
        $set: {
          pages,
          selectedPageId: selectedPage.pageId,
          selectedPageName: selectedPage.pageName,
          connectedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    return redirectTo('/dashboard?facebook=connected&tab=settings', baseUrl);
  } catch {
    return redirectTo('/dashboard?facebook=connect_failed', baseUrl);
  }
}
