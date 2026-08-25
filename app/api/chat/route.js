import { NextResponse } from 'next/server';
import { getStorePayloadBySlug } from '@/lib/store-service';
import { buildChatSystemPrompt, detectLanguageMode } from '@/lib/chatbot';

export async function POST(request) {
  try {
    const body = await request.json();
    const storeSlug = body.storeSlug || undefined;
    const userMessage = String(body.userMessage || '').trim();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not set in environment variables.' }, { status: 500 });
    }

    const storeData = await getStorePayloadBySlug(storeSlug);
    const languageMode = detectLanguageMode(userMessage);
    const systemPrompt = buildChatSystemPrompt({ storeData, languageMode });

    const recentMessages = messages
      .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
      .slice(-8);

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
      return NextResponse.json({ error: data?.error?.message || 'Groq API error.', detail: data }, { status: 502 });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: 'Empty response from Groq.', detail: data }, { status: 502 });
    }

    return NextResponse.json({ reply, mode: 'ai' });

  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Unexpected server error.' }, { status: 500 });
  }
}
