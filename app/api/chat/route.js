import { NextResponse } from 'next/server';
import { getStorePayloadBySlug } from '@/lib/store-service';
import { buildChatSystemPrompt, detectLanguageMode } from '@/lib/chatbot';
import { getClientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { str } from '@/lib/validators';

export async function POST(request) {
  const limited = rateLimit(`chat:${getClientIp(request)}`, { limit: 20, windowMs: 5 * 60 * 1000 });
  if (!limited.ok) return tooManyRequests(NextResponse, limited.retryAfter);

  try {
    const body = await request.json();
    const storeSlug = str(body.storeSlug, 100) || undefined;
    const userMessage = str(body.userMessage, 600);
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.error('GROQ_API_KEY is not set.');
      return NextResponse.json({ error: 'Chat is not available right now.' }, { status: 500 });
    }

    const storeData = await getStorePayloadBySlug(storeSlug);
    if (!storeData) {
      return NextResponse.json({ error: 'Store not found.' }, { status: 404 });
    }
    const languageMode = detectLanguageMode(userMessage);
    const systemPrompt = buildChatSystemPrompt({ storeData, languageMode });

    const recentMessages = messages
      .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.5,
        max_tokens: 300,
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentMessages,
          { role: 'user', content: userMessage }
        ]
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error('Groq API error:', data?.error?.message);
      return NextResponse.json({ error: 'The assistant is unavailable right now. Please try again.' }, { status: 502 });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: 'The assistant is unavailable right now. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({ reply, mode: 'ai' });

  } catch (error) {
    console.error('Chat route error:', error);
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
