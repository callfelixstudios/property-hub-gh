import type { Metadata } from "next";
import { cookies } from 'next/headers';
import "./globals.css";
import NavigationHeader from "@/components/NavigationHeader";
import { Providers } from "@/components/Providers";
import { JsonLd, getOrganizationSchema, getWebSiteSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.propertyhubgh.com'),
  title: {
    default: 'Property Hub GH | Rent & Buy Properties in Ghana',
    template: '%s | Property Hub GH',
  },
  description: 'Ghana’s unified property directory for renting rooms, hostels, and luxury apartments, or buying litigation-free land and houses across Accra, Kumasi, and all 16 regions.',
  authors: [{ name: 'Property Hub GH Team' }],
  creator: 'Property Hub GH',
  publisher: 'Property Hub GH',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://www.propertyhubgh.com',
    siteName: 'Property Hub GH',
    title: 'Property Hub GH | Rent & Buy Properties in Ghana',
    description: 'Find your next space in Ghana. Search verified rentals, student hostels, apartments, houses for sale, and litigation-free plots of land.',
    images: [
      {
        url: 'https://www.propertyhubgh.com/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Property Hub GH — Rent & Buy Properties in Ghana',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Property Hub GH | Rent & Buy Properties in Ghana',
    description: 'Find your next space in Ghana. Search verified rentals, hostels, apartments, houses for sale & litigation-free land.',
    images: ['https://www.propertyhubgh.com/opengraph-image'],
    creator: '@propertyhub_gh',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.propertyhubgh.com',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialCurrency = cookieStore.get('property_hub_currency')?.value === 'USD' ? 'USD' : 'GHS';

  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <JsonLd data={getOrganizationSchema()} />
        <JsonLd data={getWebSiteSchema()} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers initialCurrency={initialCurrency}>
          <NavigationHeader />
          <main className="flex-grow">
            {/* Sentinel element observed by NavigationHeader IntersectionObserver
                to detect scroll reliably across all auth states */}
            <div id="header-scroll-sentinel" aria-hidden="true" style={{ height: 0, pointerEvents: 'none' }} />
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
