import type { Metadata } from "next";
import { cookies } from 'next/headers';
import "./globals.css";
import NavigationHeader from "@/components/NavigationHeader";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Property Hub",
  description: "Utility-First Luxury Property Hub",
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
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
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
