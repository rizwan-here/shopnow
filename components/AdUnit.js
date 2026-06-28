'use client';

import { useEffect, useRef } from 'react';

export default function AdUnit({ slot, format = 'auto', layout, className = '', style = {} }) {
  const insRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!slot || pushed.current) return;
    // 300ms delay ensures the AdSense script (loaded with afterInteractive)
    // has had time to initialise before we call push()
    const timer = setTimeout(() => {
      try {
        pushed.current = true;
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [slot]);

  if (!slot || slot === 'REPLACE_WITH_YOUR_SLOT_ID') return null;

  return (
    <div className={`ad-unit-wrap ${className}`} style={style} aria-label="Advertisement">
      <span className="ad-label">Ad</span>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-4059675757874048"
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        data-full-width-responsive="true"
      />
    </div>
  );
}
