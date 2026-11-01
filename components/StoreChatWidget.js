'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const SUGGESTIONS = [
  'What are the delivery charges?',
  'Which items are in stock?',
  'What is your exchange policy?',
  'What are your best sellers?'
];

const MAX_LEN = 500; // server caps messages at 600 chars
const CLOSE_MS = 200; // keep in sync with chatPanelOut in globals.css
const REQUEST_TIMEOUT_MS = 30000;

/* ---------- tiny, safe rich-text renderer (no innerHTML) ---------- */
function Inline({ text }) {
  const parts = String(text).split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((part, i) =>
    part.length > 4 && part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function RichText({ text }) {
  const blocks = [];
  let list = [];
  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`}>
        {list.map((item, i) => <li key={i}><Inline text={item} /></li>)}
      </ul>
    );
    list = [];
  };
  String(text || '').split('\n').forEach((raw) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*(?:[-*•])\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1]);
      return;
    }
    flush();
    if (line.trim()) blocks.push(<p key={`p-${blocks.length}`}><Inline text={line} /></p>);
  });
  flush();
  return blocks;
}

/* ---------- icons ---------- */
const iconProps = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false' };
const ChatIcon = (props) => (
  <svg {...iconProps} {...props}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.8 8.8 0 0 1-3.6-.8L3 21l1.9-5.1A8.3 8.3 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" /><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" strokeWidth="2.6" /></svg>
);
const CloseIcon = (props) => (<svg {...iconProps} {...props}><path d="M18 6 6 18M6 6l12 12" /></svg>);
const SendIcon = (props) => (<svg {...iconProps} {...props}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></svg>);
const RefreshIcon = (props) => (<svg {...iconProps} {...props}><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" /></svg>);

export default function StoreChatWidget({ profile, storeSlug }) {
  const storeName = profile?.storeName || 'this store';
  const avatarUrl = profile?.profilePicture || profile?.storeLogo || '';
  const initial = (storeName.trim()[0] || 'S').toUpperCase();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // panel stays in the DOM during its exit animation
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState('idle'); // idle | typing | done
  const [teaser, setTeaser] = useState(false);
  const [everOpened, setEverOpened] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const fabRef = useRef(null);
  const idRef = useRef(0);
  const messagesRef = useRef([]);
  const abortRef = useRef(null);
  const closeTimer = useRef(null);
  const greetTimer = useRef(null);
  const aliveRef = useRef(true);

  messagesRef.current = messages;
  const nextId = () => { idRef.current += 1; return idRef.current; };

  /* ----- lifecycle ----- */
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      clearTimeout(closeTimer.current);
      clearTimeout(greetTimer.current);
      abortRef.current?.abort();
    };
  }, []);

  // One-time friendly nudge a few seconds after the storefront loads.
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('chatTeaserSeen') === '1'; } catch { /* storage unavailable */ }
    if (seen) return undefined;
    const show = setTimeout(() => {
      setTeaser(true);
      try { sessionStorage.setItem('chatTeaserSeen', '1'); } catch { /* ignore */ }
    }, 3500);
    const hide = setTimeout(() => setTeaser(false), 13000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  const openChat = useCallback(() => {
    clearTimeout(closeTimer.current);
    setMounted(true);
    setOpen(true);
    setTeaser(false);
    setEverOpened(true);
  }, []);

  const closeChat = useCallback((returnFocus = true) => {
    setOpen(false);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMounted(false), CLOSE_MS);
    if (returnFocus) fabRef.current?.focus();
  }, []);

  // Greeting (with a short "typing…" beat) the first time the chat opens.
  useEffect(() => {
    if (!open || greeting !== 'idle') return;
    setGreeting('typing');
    greetTimer.current = setTimeout(() => {
      if (!aliveRef.current) return;
      setMessages([{
        id: nextId(),
        role: 'assistant',
        content: `Hi! 👋 I’m the shopping assistant for ${storeName}. Ask me about products, prices, sizes or delivery.`
      }]);
      setGreeting('done');
    }, 800);
  }, [open, greeting, storeName]);

  // Escape closes; focus the input on desktop (not on touch, to avoid an instant keyboard).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeChat(); };
    document.addEventListener('keydown', onKey);
    let focusTimer;
    if (!window.matchMedia('(pointer: coarse)').matches) {
      focusTimer = setTimeout(() => inputRef.current?.focus(), 300);
    }
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(focusTimer); };
  }, [open, closeChat]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [messages, loading, greeting, mounted]);

  /* ----- sending ----- */
  const send = useCallback(async (rawText, { retry = false } = {}) => {
    const text = String(rawText || '').trim().slice(0, MAX_LEN);
    if (!text || loading) return;

    // History = everything before this message (errors excluded).
    let prior = messagesRef.current.filter((m) => !m.error);
    if (retry && prior.length && prior[prior.length - 1].role === 'user') prior = prior.slice(0, -1);
    const history = prior.slice(-8).map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => (retry
      ? prev.filter((m) => !m.error)
      : [...prev, { id: nextId(), role: 'user', content: text }]));
    if (!retry) setInput('');
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const pushAssistant = (content, error = false) =>
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content, error, retryText: error ? text : undefined }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeSlug, userMessage: text, messages: history }),
        signal: controller.signal
      });
      let data = null;
      try { data = await response.json(); } catch { /* non-JSON response */ }
      if (!aliveRef.current) return;
      if (response.ok && data?.reply) {
        pushAssistant(data.reply);
      } else if (response.status === 429) {
        pushAssistant(data?.error || 'You’re sending messages quickly. Please wait a moment and try again.', true);
      } else {
        pushAssistant('Sorry, I couldn’t answer that just now.', true);
      }
    } catch (error) {
      if (!aliveRef.current) return;
      pushAssistant(
        error?.name === 'AbortError'
          ? 'That took too long. Please try again.'
          : 'Couldn’t reach the shop assistant. Check your connection and try again.',
        true
      );
    } finally {
      clearTimeout(timeout);
      if (aliveRef.current) setLoading(false);
    }
  }, [loading, storeSlug]);

  const resetChat = () => {
    abortRef.current?.abort();
    clearTimeout(greetTimer.current);
    setMessages([]);
    setInput('');
    setLoading(false);
    setGreeting('idle'); // the greeting effect re-runs because the chat is open
  };

  const onSubmit = (event) => {
    event.preventDefault();
    send(input);
  };

  const showSuggestions = greeting === 'done' && !loading && !messages.some((m) => m.role === 'user');
  const showTyping = loading || greeting === 'typing';

  // plain helper (not a component) so the avatar isn't remounted on every render
  const avatar = (className) => (
    <span className={className} aria-hidden="true">
      {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initial}</span>}
    </span>
  );

  return (
    <div className="chat-widget" data-open={open ? 'true' : 'false'}>
      {mounted && (
        <section
          id="store-chat-panel"
          className="chat-panel"
          data-state={open ? 'open' : 'closing'}
          role="dialog"
          aria-label={`Chat with the ${storeName} shopping assistant`}
        >
          <header className="chat-head">
            <span className="chat-avatar-wrap">
              {avatar('chat-avatar')}
              <i className="chat-online" aria-hidden="true" />
            </span>
            <div className="chat-head-text">
              <strong>{storeName}</strong>
              <span>AI shopping assistant<span className="chat-head-extra"> · replies instantly</span></span>
            </div>
            <button type="button" className="chat-icon-btn" onClick={resetChat} aria-label="Start a new chat" title="New chat">
              <RefreshIcon width={18} height={18} />
            </button>
            <button type="button" className="chat-icon-btn" onClick={() => closeChat()} aria-label="Close chat" title="Close">
              <CloseIcon width={20} height={20} />
            </button>
          </header>

          <div className="chat-list" ref={listRef} role="log" aria-live="polite" aria-relevant="additions">
            {messages.map((m) => (
              <div key={m.id} className={`chat-row ${m.role}${m.error ? ' is-error' : ''}`}>
                {m.role === 'assistant' && avatar('chat-mini-avatar')}
                <div className="chat-bubble">
                  <RichText text={m.content} />
                  {m.error && m.retryText && (
                    <button type="button" className="chat-retry" onClick={() => send(m.retryText, { retry: true })} disabled={loading}>
                      Try again
                    </button>
                  )}
                </div>
              </div>
            ))}

            {showTyping && (
              <div className="chat-row assistant" aria-label="Assistant is typing">
                {avatar('chat-mini-avatar')}
                <div className="chat-bubble chat-typing" role="status"><i /><i /><i /></div>
              </div>
            )}

            {showSuggestions && (
              <div className="chat-chips" aria-label="Suggested questions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={s} type="button" className="chat-chip" style={{ '--i': i }} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form className="chat-form" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, sizes, delivery…"
              aria-label="Your message"
              maxLength={MAX_LEN}
              autoComplete="off"
              enterKeyHint="send"
            />
            <button type="submit" className="chat-send" aria-label="Send message" disabled={loading || !input.trim()}>
              <SendIcon width={20} height={20} />
            </button>
          </form>
          <p className="chat-foot">
            AI can make mistakes.{profile?.whatsappNumber ? ' Confirm orders on WhatsApp.' : ''}
          </p>
        </section>
      )}

      {teaser && !open && (
        <div className="chat-teaser" role="note">
          <button type="button" className="chat-teaser-open" onClick={openChat}>
            <span aria-hidden="true">👋</span> Need help? <strong>Ask me!</strong>
          </button>
          <button type="button" className="chat-teaser-dismiss" onClick={() => setTeaser(false)} aria-label="Dismiss">
            <CloseIcon width={14} height={14} />
          </button>
        </div>
      )}

      <button
        ref={fabRef}
        type="button"
        className="chat-fab"
        data-attention={!everOpened && !open ? 'true' : 'false'}
        onClick={() => (open ? closeChat(false) : openChat())}
        aria-label={open ? 'Close chat' : 'Chat with our shopping assistant'}
        aria-expanded={open}
        aria-controls="store-chat-panel"
      >
        <ChatIcon className="chat-fab-icon chat-fab-icon--chat" />
        <CloseIcon className="chat-fab-icon chat-fab-icon--close" />
      </button>
    </div>
  );
}
