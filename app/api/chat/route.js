import { NextResponse } from 'next/server';
import { getStorePayload } from '@/lib/store-service';
import { buildChatSystemPrompt, detectLanguageMode, fallbackSupportReply } from '@/lib/chatbot';

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
    const storeSlug = body.storeSlug || undefined;
    const userMessage = String(body.userMessage || '').trim();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const storeData = await getStorePayload(storeSlug);
    const languageMode = detectLanguageMode(userMessage);
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterKey) {
      const reply = fallbackSupportReply({ userMessage, storeData, history: messages });
      return NextResponse.json({ reply, mode: 'fallback' });
    }

    const systemPrompt = buildChatSystemPrompt({ storeData, languageMode });
    const recentMessages = messages
      .filter((message) => message && typeof message.content === 'string' && (message.role === 'user' || message.role === 'assistant'))
      .slice(-8);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': `${storeData.profile.storeName} Support Inbox`
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openrouter/free',
        temperature: 0.5,
        max_tokens: 220,
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentMessages,
          { role: 'user', content: userMessage }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorText = await response.text();
      const reply = fallbackSupportReply({ userMessage, storeData, history: recentMessages });
      return NextResponse.json({ reply, mode: 'fallback', providerError: errorText }, { status: 200 });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      const fallback = fallbackSupportReply({ userMessage, storeData, history: recentMessages });
      return NextResponse.json({ reply: fallback, mode: 'fallback' });
    }

    return NextResponse.json({ reply, mode: 'ai' });
  } catch (error) {
    try {
      if (body.userMessage) {
        const storeData = await getStorePayload(body.storeSlug || undefined);
        const reply = fallbackSupportReply({ userMessage: body.userMessage, storeData, history: body.messages || [] });
        return NextResponse.json({ reply, mode: 'fallback' });
      }
    } catch {}

    return NextResponse.json({ error: error?.message || 'Unable to generate chat reply.' }, { status: 500 });
  }
}
