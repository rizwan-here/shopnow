/**
 * Auto-scrolling horizontal carousel. Renders `items` twice back-to-back and
 * animates the track with a CSS keyframe loop, so the scroll appears seamless.
 * Pure CSS (no client JS needed). Moves one card at a time with a "pulled and
 * snapped" easing on each step (a slow anticipation pull, then a fast snap
 * into place with no overshoot/bounce) rather than a constant smooth glide
 * or an instant jump. Never pauses on hover or tap — it keeps moving
 * regardless of interaction.
 */
export default function AutoScrollCarousel({ items, renderItem, className = '', secondsPerItem = 2.2 }) {
  const count = items.length;
  if (count === 0) return null;

  const animationName = `lp-marquee-snap-${count}`;
  const totalSeconds = (count * secondsPerItem).toFixed(2);

  // One keyframe stop per card. Each stop's timing-function governs the
  // "pull and snap" motion of the segment that follows it.
  const stops = Array.from({ length: count + 1 }, (_, index) => {
    const percent = ((index / count) * 100).toFixed(4);
    const translate = ((index / count) * -50).toFixed(4);
    return `${percent}% { transform: translateX(${translate}%); animation-timing-function: cubic-bezier(0.68, -0.55, 0.27, 1); }`;
  }).join(' ');

  return (
    <div className={`lp-marquee ${className}`}>
      <style>{`@keyframes ${animationName} { ${stops} }`}</style>
      <div
        className="lp-marquee-track"
        style={{ '--marquee-name': animationName, '--marquee-duration': `${totalSeconds}s` }}
      >
        {items.map((item, index) => renderItem(item, `a-${index}`))}
        {items.map((item, index) => renderItem(item, `b-${index}`))}
      </div>
    </div>
  );
}
