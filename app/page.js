import Link from 'next/link';
import BrandMark from '@/components/BrandMark';
import LandingClient from '@/components/LandingClient';

export const metadata = {
  title: 'Storeatgo — Social-first storefronts for sellers in Bangladesh',
  description: 'Create a polished shop link in minutes. Showcase your products, collect COD orders, and move buyers into WhatsApp or Messenger. Built for social sellers in Bangladesh.',
};

const FEATURES = [
  {
    icon: '🛍️',
    title: 'Your own branded storefront',
    body: 'Get a clean, mobile-first shop at storeatgo.xyz/yourname. Add your logo, banner, product photos, and bio — looks premium from the first click.'
  },
  {
    icon: '📦',
    title: 'Product & category management',
    body: 'Upload unlimited products with images, prices, sizes, and stock status. Organise them into categories your buyers can browse easily.'
  },
  {
    icon: '💬',
    title: 'WhatsApp & Messenger ready',
    body: 'One tap sends buyers straight into a WhatsApp or Messenger conversation with you — the fastest way to confirm and close orders.'
  },
  {
    icon: '🧾',
    title: 'COD order management',
    body: 'Buyers place orders directly on your storefront. You get a clean order dashboard to track, confirm, pack, and mark delivered — all in one place.'
  },
  {
    icon: '📊',
    title: 'Built-in sales analytics',
    body: 'See your revenue by week, top-selling products, order sources, and delivery zone breakdown — everything you need to run your store smarter.'
  },
  {
    icon: '🔗',
    title: 'One link for everything',
    body: 'Share a single link in your Instagram bio, Facebook page, or anywhere online. Your full store, contact options, and order form all in one destination.'
  },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Sign up with Google', body: 'Create your account in seconds. No credit card, no complicated forms.' },
  { step: '2', title: 'Set up your store', body: 'Add your logo, banner, products, and prices. Your storefront goes live immediately.' },
  { step: '3', title: 'Share your link', body: 'Drop your storeatgo.xyz/yourname link in your bio, stories, and everywhere you sell.' },
  { step: '4', title: 'Get orders & grow', body: 'Buyers order directly. You manage everything from your dashboard and close sales over WhatsApp.' },
];

const TESTIMONIALS = [
  {
    name: 'Nadia R.',
    role: 'Fashion seller, Dhaka',
    quote: 'Before Storeatgo my customers had to DM me just to see what I had in stock. Now I send one link and they can browse everything and order on their own.',
  },
  {
    name: 'Imran H.',
    role: 'Electronics reseller, Chittagong',
    quote: 'The order dashboard saves me so much time. I can see everything in one place and update statuses without going back and forth on WhatsApp.',
  },
  {
    name: 'Sumaiya K.',
    role: 'Handmade jewellery, Sylhet',
    quote: 'My store looks more professional than shops that have been running for years. Customers trust it immediately when they land on the page.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Static server-rendered landing — fully crawlable by Google ── */}
      <div className="landing-shell">

        {/* NAV */}
        <header className="landing-hero">
          <div className="container landing-nav">
            <BrandMark size="nav" showTagline={true} />
            <nav className="landing-nav-links">
              <Link href="/about">About</Link>
              <Link href="/#features">Features</Link>
              <Link href="/#how-it-works">How it works</Link>
              <Link href="/contact">Contact</Link>
            </nav>
            <div className="responsive-stack">
              <LandingClient />
            </div>
          </div>

          {/* HERO */}
          <div className="container landing-hero-grid">
            <div className="landing-copy slide-up">
              <div className="landing-pill">Built for sellers who close orders from social media</div>
              <h1>Turn casual visitors into <span className="headline-emphasis">paying customers</span> with a storefront that feels premium from the first click.</h1>
              <p className="landing-subcopy">Give your shop a polished home for launches, bestsellers, and everyday orders. Share one clean link across Instagram, Facebook, and WhatsApp — show your products beautifully, and move buyers straight into conversation to close the sale faster.</p>
              <div className="landing-cta-row">
                <a className="soft-button button-with-icon" href="#signup-options">
                  <span className="btn-icon">✦</span>Create my store — free
                </a>
                <a className="soft-button-ghost button-with-icon" href="#how-it-works">
                  <span className="btn-icon">→</span>See how it works
                </a>
              </div>
              <div className="landing-proof-row">
                <span>✓ One branded shop link</span>
                <span>✓ COD orders built in</span>
                <span>✓ WhatsApp &amp; Messenger ready</span>
              </div>
            </div>

            <div className="landing-showcase slide-up-delay">
              <div className="showcase-card soft-card">
                <div className="showcase-browser">
                  <span /><span /><span />
                </div>
                <div className="showcase-hero">
                  <img
                    src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80"
                    alt="Example Storeatgo storefront showing fashion products on mobile"
                    width={600}
                    height={340}
                  />
                  <div className="showcase-overlay">
                    <strong>storeatgo.xyz/yourname</strong>
                    <p>Your products, your brand, your link — built to turn profile traffic into real orders.</p>
                  </div>
                </div>
                <div className="showcase-stats">
                  <div><strong>More trust</strong><span>Sharper first impressions</span></div>
                  <div><strong>More clicks</strong><span>Cleaner product discovery</span></div>
                  <div><strong>More orders</strong><span>WhatsApp &amp; Messenger ready</span></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* FEATURES */}
        <section className="container lp-section" id="features">
          <div className="lp-section-label">What you get</div>
          <h2 className="lp-section-title">Everything a social seller needs — nothing they don't</h2>
          <div className="lp-features-grid">
            {FEATURES.map(({ icon, title, body }) => (
              <article className="soft-card lp-feature-card" key={title}>
                <div className="lp-feature-icon">{icon}</div>
                <h3>{title}</h3>
                <p className="muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="container lp-section" id="how-it-works">
          <div className="lp-section-label">How it works</div>
          <h2 className="lp-section-title">Your store is live in under 5 minutes</h2>
          <div className="lp-steps-grid">
            {HOW_IT_WORKS.map(({ step, title, body }) => (
              <div className="lp-step-card" key={step}>
                <div className="lp-step-num">{step}</div>
                <h3>{title}</h3>
                <p className="muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* STORY / VISUAL SPLIT */}
        <section className="container lp-section story-grid">
          <div className="soft-card story-card">
            <img
              src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80"
              alt="Seller managing their online store on a laptop"
              width={600}
              height={380}
            />
            <div>
              <h2>Make your first impression feel like a real brand, not just another social profile.</h2>
              <p className="muted">Use one elegant shop link across your bio, stories, campaigns, and customer chats. Showcase your products, your identity, and your best offers in one polished destination that works on every device.</p>
              <a className="soft-button" href="#signup-options" style={{ marginTop: '1rem', display: 'inline-block' }}>Start for free</a>
            </div>
          </div>
          <div className="soft-card story-card">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
              alt="Buyer browsing products on a phone and messaging seller on WhatsApp"
              width={600}
              height={380}
            />
            <div>
              <h2>Turn interested shoppers into conversations you can actually close.</h2>
              <p className="muted">Buyers already trust WhatsApp and Messenger. Storeatgo sends them there at the right moment — so they can ask, confirm, and order without any friction or back-and-forth confusion.</p>
              <a className="soft-button-ghost" href="#how-it-works" style={{ marginTop: '1rem', display: 'inline-block' }}>See how it works</a>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="container lp-section" id="testimonials">
          <div className="lp-section-label">Seller stories</div>
          <h2 className="lp-section-title">Sellers across Bangladesh are already using Storeatgo</h2>
          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map(({ name, role, quote }) => (
              <blockquote className="soft-card lp-testimonial-card" key={name}>
                <p className="lp-testimonial-quote">"{quote}"</p>
                <footer>
                  <strong>{name}</strong>
                  <span className="muted">{role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="container lp-section" id="faq">
          <div className="lp-section-label">FAQ</div>
          <h2 className="lp-section-title">Common questions</h2>
          <div className="lp-faq-grid">
            {[
              ['Is Storeatgo free to use?', 'Yes. Creating your store, adding products, and receiving orders is completely free. Start selling today with no upfront cost.'],
              ['What payment methods are supported?', 'Storeatgo is built for Cash on Delivery (COD) — the most trusted payment method for online buyers in Bangladesh.'],
              ['Do I need a website or technical skills?', 'Not at all. Sign up with Google, pick a username, and your store is live. No coding, no hosting setup required.'],
              ['Can buyers order directly from my store?', 'Yes. Buyers can browse your products and place COD orders directly on your storefront. You manage everything from your dashboard.'],
              ['How do I share my store?', 'You get a link like storeatgo.xyz/yourname. Share it in your Instagram bio, Facebook page, WhatsApp status, or anywhere else you promote your business.'],
              ['Where can I get help?', 'Email us at storeatgoofficial.contact@gmail.com or visit our contact page. We\'re happy to help.'],
            ].map(([q, a]) => (
              <div className="lp-faq-item" key={q}>
                <h3>{q}</h3>
                <p className="muted">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SIGN UP / LOGIN */}
        <section className="container lp-section auth-panels">
          <div className="soft-card auth-choice-card" id="signup-options">
            <div className="landing-pill">Sign up — it's free</div>
            <h2>Create a new <span className="headline-emphasis">store</span></h2>
            <p className="muted">Use a Google account not already linked to a Storeatgo store. After signing up you will choose your unique username and your store goes live instantly.</p>
            <div className="auth-buttons">
              <LandingClient mode="signup" />
            </div>
            <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
              By signing up you agree to our <Link href="/terms-and-conditions">Terms &amp; Conditions</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.
            </p>
          </div>

          <div className="soft-card auth-choice-card" id="login-options">
            <div className="landing-pill landing-pill-outline">Log in</div>
            <h2>Access your <span className="headline-emphasis">existing dashboard</span></h2>
            <p className="muted">Use the same Google account you used when you first created your Storeatgo store.</p>
            <div className="auth-buttons">
              <LandingClient mode="login" />
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="container lp-footer-inner">
            <div className="lp-footer-brand">
              <BrandMark size="nav" />
              <p className="muted" style={{ fontSize: '0.83rem', marginTop: '0.4rem' }}>Social-first storefronts for independent sellers in Bangladesh.</p>
            </div>
            <nav className="lp-footer-links">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
            </nav>
            <p className="muted lp-footer-copy">© {new Date().getFullYear()} Storeatgo · Mirpur, Dhaka, Bangladesh</p>
          </div>
        </footer>
      </div>
    </>
  );
}
