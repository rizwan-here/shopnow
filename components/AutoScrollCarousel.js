/**
 * Auto-scrolling horizontal carousel. Renders `items` twice back-to-back and
 * animates the track with a CSS keyframe loop, so the scroll appears seamless.
 * Pure CSS (no client JS needed). The motion advances in discrete, snappy
 * steps (one card at a time) rather than a smooth continuous glide, and never
 * pauses on hover or tap — it keeps moving regardless of interaction.
 */
export default function AutoScrollCarousel({ items, renderItem, className = '', secondsPerItem = 1.6 }) {
  const totalSeconds = items.length * secondsPerItem;

  return (
    <div className={`lp-marquee ${className}`}>
      <div
        className="lp-marquee-track"
        style={{
          animationDuration: `${totalSeconds}s`,
          animationTimingFunction: `steps(${items.length}, jump-start)`
        }}
      >
        {items.map((item, index) => renderItem(item, `a-${index}`))}
        {items.map((item, index) => renderItem(item, `b-${index}`))}
      </div>
    </div>
  );
}
