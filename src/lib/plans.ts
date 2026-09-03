export interface Plan {
  slug: 'free' | 'pro' | 'developer';
  name: string;
  price_ghs: number;
  billing_cycle: 'monthly';
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export const PLANS: Plan[] = [
  {
    slug: 'free',
    name: 'Free',
    price_ghs: 0,
    billing_cycle: 'monthly' as const,
    features: [
      '2 active listings',
      'Standard search visibility',
      'Standard moderation queue',
      '30-day listing refresh window',
      'Standard email support',
    ],
    cta: 'Start for free',
  },
  {
    slug: 'pro',
    name: 'Pro',
    price_ghs: 99.99,
    billing_cycle: 'monthly' as const,
    features: [
      '15 active listings',
      'Verified Agent badge',
      'Ranked above free listings',
      'Priority moderation',
      'Per-listing views + WhatsApp lead-click analytics',
      'Matching space-request leads forwarded',
      '1 Boost/Pin credit per month (7-day top placement)',
      '60-day listing refresh window',
      'Priority email support',
    ],
    cta: 'Subscribe to Pro',
  },
  {
    slug: 'developer',
    name: 'Developer',
    price_ghs: 299.99,
    billing_cycle: 'monthly' as const,
    highlighted: true,
    features: [
      '50 active listings',
      'Verified Developer badge + company branding',
      'Top placement / featured rotation',
      'Instant priority moderation',
      'Everything in Pro + portfolio dashboard',
      'Leads + bulk export',
      '3 Boost/Pin credits per month',
      '90-day listing refresh window',
      'Dedicated WhatsApp support',
    ],
    cta: 'Subscribe to Developer',
  },
];

export function getPlanBySlug(slug: string): Plan | undefined {
  return PLANS.find((p) => p.slug === slug);
}