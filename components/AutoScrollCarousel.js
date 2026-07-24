/**
 * Auto-scrolling horizontal carousel. Renders `items` twice back-to-back and
 * animates the track with a CSS keyframe loop, so the scroll appears seamless.
 * Pure CSS (no client JS needed) — pauses automatically on hover via globals.css.
 */
export default function AutoScrollCarousel({ items, renderItem, className = '', speedSeconds = 32 }) {
  return (
    <div className={`lp-marquee ${className}`}>
      <div className="lp-marquee-track" style={{ animationDuration: `${speedSeconds}s` }}>
        {items.map((item, index) => renderItem(item, `a-${index}`))}
        {items.map((item, index) => renderItem(item, `b-${index}`))}
      </div>
    </div>
  );
}
