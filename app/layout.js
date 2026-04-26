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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32x32.png'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <AuthSessionProvider>
          {children}
          <GlobalFooter />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
