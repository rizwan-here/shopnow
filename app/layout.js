import './globals.css';
import { startKeepAlive } from '@/lib/keep-alive';

startKeepAlive();
import AuthSessionProvider from '@/components/SessionProvider';
import GlobalFooter from '@/components/GlobalFooter';
import { Manrope, Playfair_Display } from 'next/font/google';

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800']
});

const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800']
});

export const metadata = {
  title: 'Storeatgo',
  description: 'Fashion-forward social storefronts for independent sellers',
  metadataBase: new URL('https://shopnow-341d.onrender.com'),
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    shortcut: '/storeatgo-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <head>
        <meta
          name="facebook-domain-verification"
          content="d0m2yvyu2yon2dncmzyxbfy3wpn948"
        />
        {/* Google AdSense — replace ca-pub-XXXX with your real Publisher ID */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-REPLACE_WITH_YOUR_PUBLISHER_ID"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <AuthSessionProvider>
          {children}
          <GlobalFooter />
        </AuthSessionProvider>
      </body>
    </html>
  );
}