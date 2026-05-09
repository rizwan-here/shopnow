import './globals.css';
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
  title: 'Shopnow',
  description: 'Fashion-forward social storefronts for independent sellers',
  metadataBase: new URL('https://shopnow-341d.onrender.com')
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <head>
        <meta
          name="facebook-domain-verification"
          content="d0m2yvyu2yon2dncmzyxbfy3wpn948"
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