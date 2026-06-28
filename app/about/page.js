import Link from 'next/link';
import BrandMark from '@/components/BrandMark';

export const metadata = {
  title: 'About Storeatgo — Social storefronts built for Bangladesh sellers',
  description: 'Storeatgo helps independent sellers in Bangladesh create polished storefronts, collect COD orders, and sell faster through WhatsApp and Messenger.',
};

export default function AboutPage() {
  return (
    <main className="lp-static-shell">

      <header className="lp-static-nav">
        <div className="container lp-static-nav-inner">
          <BrandMark size="nav" />
          <nav className="landing-nav-links">
            <Link href="/">Home</Link>
            <Link href="/#features">Features</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <a className="soft-button" href="/#signup-options">Get started free</a>
        </div>
      </header>

      <section className="container lp-static-hero">
        <div className="landing-pill">Our story</div>
        <h1>Built by sellers, for sellers — right here in Bangladesh.</h1>
        <p className="lp-static-lead">Storeatgo started with a simple observation: thousands of talented sellers across Bangladesh were running real businesses entirely through social media DMs — no clean product page, no order tracking, no way to look professional without an expensive custom website.</p>
      </section>

      <section className="container lp-static-body">

        <div className="soft-card lp-about-block">
          <h2>Why we built Storeatgo</h2>
          <p>Social commerce in Bangladesh is massive. Sellers on Facebook, Instagram, and WhatsApp are moving millions of takas worth of clothing, electronics, food, jewellery, and handmade goods every day — but almost entirely through manual conversations, screenshot orders, and voice notes.</p>
          <p>That system works until it doesn't. Orders get lost. Customers get confused. Sellers spend hours repeating product information instead of selling. Buyers don't trust a seller with no proper storefront.</p>
          <p>We built Storeatgo to fix that — a platform that gives every independent seller a polished, professional storefront in minutes, with the order management and buyer communication tools built right in.</p>
        </div>

        <div className="soft-card lp-about-block">
          <h2>What we believe</h2>
          <div className="lp-about-beliefs">
            {[
              ['Sellers deserve professional tools', 'A clothing seller in Mirpur or a jewellery maker in Sylhet deserves the same quality storefront as a brand with a development team. We make that possible without the cost or complexity.'],
              ['Speed wins in social commerce', 'Buyers in Bangladesh make fast decisions. Your storefront needs to load instantly, look great on every phone, and move people to action in seconds. We obsess over that.'],
              ['WhatsApp and Messenger are where trust lives', 'Most buyers in Bangladesh want to confirm their order over chat before committing. We make it one tap to get there — so more conversations turn into completed orders.'],
              ['Simple is powerful', 'We say no to complexity. Storeatgo does exactly what a social seller needs and nothing more — so you spend your time selling, not managing software.'],
            ].map(([title, body]) => (
              <div className="lp-belief-item" key={title}>
                <h3>{title}</h3>
                <p className="muted">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="soft-card lp-about-block">
          <h2>Who uses Storeatgo</h2>
          <p>Storeatgo is used by independent sellers across Bangladesh who run their business through social media — fashion and clothing sellers, electronics resellers, food and home goods sellers, handmade and craft sellers, and anyone who takes COD orders and manages customers over WhatsApp or Messenger.</p>
          <p>If you sell anything online and you're tired of managing orders through DMs and screenshots, Storeatgo is built for you.</p>
        </div>

        <div className="soft-card lp-about-block">
          <h2>Where we're based</h2>
          <p>Storeatgo is based in <strong>Mirpur, Dhaka, Bangladesh</strong>. We're building for the Bangladeshi seller community first — with deep knowledge of how social commerce actually works here, including COD delivery culture, customer chat behaviour, and the platforms sellers rely on most.</p>
          <p>Have questions or want to get in touch? <Link href="/contact" style={{ color: 'var(--accent)' }}>Visit our contact page →</Link></p>
        </div>

      </section>

      <section className="container lp-static-cta">
        <div className="soft-card lp-cta-card">
          <h2>Ready to give your store a proper home?</h2>
          <p className="muted">Create your Storeatgo storefront in minutes — free, no credit card required.</p>
          <a className="soft-button" href="/#signup-options">Create my store free</a>
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
