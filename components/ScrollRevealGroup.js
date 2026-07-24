'use client';

import { useEffect, useRef } from 'react';

/**
 * Wraps a list of direct children (e.g. cards in a grid) and reveals each one
 * with a staggered fade/slide-up animation as it scrolls into view.
 * Falls back to fully visible content if IntersectionObserver isn't available.
 */
export default function ScrollRevealGroup({ children, className = '', staggerMs = 90 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(container.children);

    if (typeof IntersectionObserver === 'undefined') {
      items.forEach((item) => item.classList.add('reveal-in'));
      return;
    }

    items.forEach((item, index) => {
      item.classList.add('reveal-item');
      item.style.transitionDelay = `${index * staggerMs}ms`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [staggerMs]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
