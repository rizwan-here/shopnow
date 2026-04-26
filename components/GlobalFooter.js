import BrandMark from '@/components/BrandMark';

export default function GlobalFooter() {
  return (
    <footer className="global-site-footer">
      <div className="container global-site-footer-inner">
        <div>
          <BrandMark size="footer" />
          <p className="muted">A social-first storefront for fashion sellers, creators, and growing online businesses.</p>
        </div>
        <nav className="global-footer-links" aria-label="Legal">
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms-and-conditions">Terms & Conditions</a>
        </nav>
      </div>
    </footer>
  );
}
