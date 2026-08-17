import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';

import './globals.css';
import { siteConfig } from '@/lib/config';
import SnowplowInit from '@/components/snowplow-init';
import Header from '@/components/Header';
import DemoFooter from '@/components/DemoFooter';
import ConsentManager from '@/components/ConsentManager';
import SignalsInspector from '@/components/SignalsInspector';
import InterventionBanner from '@/components/InterventionBanner';

// PLACEHOLDER fonts — the Design phase swaps these for the demo's typefaces and
// updates the CSS variable names in tailwind.config.ts / globals.css.
const sans = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.seo.url),
  title: siteConfig.seo.title,
  description: siteConfig.seo.description,
  keywords: siteConfig.seo.keywords,
  openGraph: {
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    url: siteConfig.seo.url,
    siteName: siteConfig.brand.name,
    images: [{ url: siteConfig.seo.ogImage }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    images: [siteConfig.seo.ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-background font-body text-body">
        <SnowplowInit>
          <InterventionBanner />
          <Header />
          <main className="flex-1">{children}</main>
          <DemoFooter />
          <ConsentManager />
          <SignalsInspector />
        </SnowplowInit>
      </body>
    </html>
  );
}
