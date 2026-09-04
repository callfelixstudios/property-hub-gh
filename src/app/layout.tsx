import type { Metadata } from "next";
import { cookies } from 'next/headers';
import "./globals.css";
import NavigationHeader from "@/components/NavigationHeader";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";
import { Providers } from "@/components/Providers";
import { getUsdToGhsRate } from "@/lib/fx";
import { createClient } from "@/utils/supabase/server";
import Analytics from "@/components/Analytics";
import ConsentBanner from "@/components/ConsentBanner";
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

  // Server-provided FX rate (no hardcoded fallback). On outage/offline the
  // rate stays NaN and CurrencyContext degrades to GHS-only formatting.
  let initialRate = NaN;
  let initialRateDate = '';
  try {
    const fx = await getUsdToGhsRate();
    initialRate = fx.rate;
    initialRateDate = fx.date;
  } catch (fxError) {
    console.error('[layout] FX fetch failed, trying fx_rates fallback:', fxError);
    try {
      const supabase = await createClient();
      let row: { rate?: unknown; as_of?: unknown; date?: unknown; created_at?: unknown } | null = null;
      // Column names are not guaranteed (table may not exist yet) — try
      // candidate "latest" orderings, then fall back to any latest row.
      for (const orderCol of ['as_of', 'date', 'created_at']) {
        try {
          const { data, error } = await supabase
            .from('fx_rates')
            .select('*')
            .order(orderCol, { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!error && data) {
            row = data as { rate?: unknown; as_of?: unknown; date?: unknown; created_at?: unknown };
            break;
          }
        } catch {
          // try the next candidate column
        }
      }
      const rate = Number(row?.rate);
      if (Number.isFinite(rate) && rate > 0) {
        initialRate = rate;
        initialRateDate = String(row?.as_of ?? row?.date ?? row?.created_at ?? '');
      }
    } catch {
      // fx_rates unavailable — keep NaN + empty date (GHS-only UI).
    }
  }

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
        <Providers initialCurrency={initialCurrency} initialRate={initialRate} initialRateDate={initialRateDate}>
          <ImpersonationBanner />
          <NavigationHeader />
          <main className="flex-grow">
            {/* Sentinel element observed by NavigationHeader IntersectionObserver
                to detect scroll reliably across all auth states */}
            <div id="header-scroll-sentinel" aria-hidden="true" style={{ height: 0, pointerEvents: 'none' }} />
            {children}
          </main>
        </Providers>
        <Analytics />
        <ConsentBanner />
      </body>
    </html>
  );
}
