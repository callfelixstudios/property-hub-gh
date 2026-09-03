import { createClient } from '@/utils/supabase/server';
import { getCreditConfig, getPlansPricing } from '@/lib/plansPricing';
import PricingClient from '@/components/PricingClient';
import CreditPurchaseButton from '@/components/CreditPurchaseButton';
import Footer from '@/components/Footer';

export async function generateMetadata() {
  return {
    title: 'Pricing & Packages | Property Hub GH',
    description:
      'Simple monthly plans for agents and developers on Property Hub GH — Free, Pro and Developer tiers with verified badges, analytics and priority placement.',
    alternates: {
      canonical: 'https://www.propertyhubgh.com/pricing',
    },
  };
}

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;

  const [plans, credit] = await Promise.all([getPlansPricing(), getCreditConfig()]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: plans.map((plan, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: plan.name,
        offers: {
          '@type': 'Offer',
          price: plan.price_ghs,
          priceCurrency: 'GHS',
          availability: 'https://schema.org/InStock',
          url: 'https://www.propertyhubgh.com/pricing',
        },
      },
    })),
  };

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <section className="relative bg-navy-base pt-32 pb-24 sm:pt-40 sm:pb-32 lg:pt-44 lg:pb-36 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-gold/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent-gold/30 bg-accent-gold/10 text-accent-gold text-xs font-bold tracking-widest uppercase mb-6 sm:mb-8">
              <span aria-hidden="true">&#x2726;</span>
              Simple &amp; Transparent Pricing
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6 leading-tight tracking-tight">
              Subscriptions &amp; Pricing
            </h1>

            <div className="h-1 w-16 bg-accent-gold rounded-full mx-auto mb-5 sm:mb-6" />

            <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
              Simple monthly plans for agents and developers. Start free, upgrade when you
              need verified badges, analytics and priority placement.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 -mt-10 sm:-mt-14 lg:-mt-16 relative z-10 pb-24 sm:pb-32">
        <PricingClient plans={plans} isAuthed={isAuthed} />

        <section
          id="credits"
          className="mt-16 sm:mt-20 lg:mt-24 bg-navy-base rounded-2xl p-6 sm:p-8 lg:p-10 border-l-4 border-accent-gold shadow-ambient"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-accent-gold shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
                </svg>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-accent-gold">
                  Boost credits
                </h2>
              </div>
              <p className="text-slate-300 leading-relaxed max-w-xl text-xs sm:text-sm md:text-base">
                1 credit = 1 {credit.boost_duration_days}-day top placement. GHS{' '}
                {credit.credit_price_ghs} per credit.
              </p>
            </div>
            <div className="shrink-0 w-full sm:w-auto">
              <CreditPurchaseButton
                creditPriceGhs={credit.credit_price_ghs}
                minQty={credit.credit_min_qty}
                maxQty={credit.credit_max_qty}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
