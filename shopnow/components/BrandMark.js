export default function BrandMark({ href = '/', size = 'default', className = '', showTagline = false }) {
  return (
    <a href={href} className={`brand-mark brand-mark-${size} ${className}`.trim()} aria-label="Storeatgo home">
      <img src="/tapstore-logo.png" alt="Storeatgo" className="brand-mark-image" />
      {showTagline ? (
        <span className="brand-mark-tagline">Launch your social-first storefront</span>
      ) : null}
    </a>
  );
}
