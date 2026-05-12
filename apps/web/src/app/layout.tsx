import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'BrandFlow — AI Brand & Marketing Automation',
  description: 'Generate on-brand content, manage approvals, and schedule posts — all in one place.',
};

export default function RootLayout({ 
  children,
  params: { locale } 
}: { 
  children: React.ReactNode;
  params: { locale: string };
}) {
  const isRtl = locale === 'ar';

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} className={inter.variable}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
