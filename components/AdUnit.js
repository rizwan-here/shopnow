'use client';

import { useEffect, useRef } from 'react';

/**
 * AdUnit — renders a Google AdSense unit that blends with the Storeatgo design.
 * Only mounts when window is available (client-side only).
 *
 * Props:
 *   slot        — AdSense ad slot ID (string, from your AdSense dashboard)
 *   format      — 'auto' | 'fluid' | 'rectangle' etc. Default: 'auto'
 *   layout      — optional, e.g. 'in-article' for fluid ads
 *   className   — extra class names on the wrapper
 *   style       — inline style overrides on the wrapper
 */
export default function AdUnit({ slot, format = 'auto', layout, className = '', style = {} }) {
  const insRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Only push once per mount, and only when the slot is provided
    if (!slot || pushed.current) return;
    try {
      pushed.current = true;
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [slot]);

  // Don't render anything if no slot configured yet
  if (!slot || slot === 'REPLACE_WITH_YOUR_SLOT_ID') return null;

  return (
    <div className={`ad-unit-wrap ${className}`} style={style} aria-label="Advertisement">
      <span className="ad-label">Ad</span>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="pub-4059675757874048"
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        data-full-width-responsive="true"
      />
    </div>
  );
}
