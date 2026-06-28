import Link from 'next/link';
import BrandMark from '@/components/BrandMark';

export const metadata = {
  title: 'Contact Storeatgo — Get help or send us a message',
  description: 'Have a question about Storeatgo? Contact our support team by email. We're here to help sellers get set up and running.',
};

export default function ContactPage() {
  return (
    <main className="lp-static-shell">

      <header className="lp-static-nav">
        <div className="container lp-static-nav-inner">
          <BrandMark size="nav" />
          <nav className="landing-nav-links">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/#features">Features</Link>
          </nav>
          <a className="soft-button" href="/#signup-options">Get started free</a>
        </div>
      </header>

      <section className="container lp-static-hero">
        <div className="landing-pill">Get in touch</div>
        <h1>We're here to help.</h1>
        <p className="lp-static-lead">Questions about Storeatgo, your store, or how something works? Send us an email and we'll get back to you as soon as we can.</p>
      </section>

      <section className="container lp-static-body">

        <div className="lp-contact-grid">

          <div className="soft-card lp-contact-card lp-contact-main">
            <h2>Send us a message</h2>
            <p className="muted">Email is the best way to reach us. We aim to reply within 1–2 business days.</p>

            <div className="lp-contact-method">
              <div className="lp-contact-method-icon">✉️</div>
              <div>
                <strong>Support &amp; general enquiries</strong>
                <a
                  href="mailto:storeatgoofficial.contact@gmail.com"
                  className="lp-contact-email"
                >
                  storeatgoofficial.contact@gmail.com
                </a>
              </div>
            </div>

            <div className="lp-contact-topics">
              <p className="muted" style={{ marginBottom: '0.75rem' }}>We can help with:</p>
              {[
                'Setting up your store for the first time',
                'Questions about products, orders, or the dashboard',
                'Account or login issues',
                'Reporting a bug or technical problem',
                'Business or partnership enquiries',
                'Data deletion or privacy requests',
              ].map(topic => (
                <div className="lp-contact-topic-item" key={topic}>
                  <span className="lp-contact-tick">✓</span>
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-contact-sidebar">
            <div className="soft-card lp-contact-card">
              <h3>Business details</h3>
              <div className="lp-biz-detail">
                <span className="muted">Legal entity</span>
                <strong>Storeatgo</strong>
              </div>
              <div className="lp-biz-detail">
                <span className="muted">Address</span>
                <strong>Mirpur, Dhaka, Bangladesh</strong>
              </div>
              <div className="lp-biz-detail">
                <span className="muted">Email</span>
                <a href="mailto:storeatgoofficial.contact@gmail.com" style={{ color: 'var(--accent)', fontWeight: 600, wordBreak: 'break-all' }}>
                  storeatgoofficial.contact@gmail.com
                </a>
              </div>
            </div>

            <div className="soft-card lp-contact-card">
              <h3>Quick links</h3>
              <div className="lp-quick-links">
                <Link href="/privacy-policy">Privacy Policy →</Link>
                <Link href="/terms-and-conditions">Terms &amp; Conditions →</Link>
                <Link href="/about">About Storeatgo →</Link>
                <Link href="/#faq">FAQ →</Link>
              </div>
            </div>

            <div className="soft-card lp-contact-card">
              <h3>Ready to start selling?</h3>
              <p className="muted" style={{ fontSize: '0.88rem' }}>Create your free Storeatgo store in minutes — no credit card needed.</p>
              <a className="soft-button" href="/#signup-options" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
                Create my store free
              </a>
            </div>
          </div>

        </div>

      </section>

      <footer className="lp-footer">
        <div className="container lp-footer-inner">
          <div className="lp-footer-brand">
            <BrandMark size="nav" />
          </div>
          <nav className="lp-footer-links">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
          </nav>
          <p className="muted lp-footer-copy">© {new Date().getFullYear()} Storeatgo · Mirpur, Dhaka, Bangladesh</p>
        </div>
      </footer>
    </main>
  );
}
