export interface Plan {
  slug: 'free' | 'pro' | 'developer';
  name: string;
  price_ghs: number;
  billing_cycle: 'monthly';
  features: string[];
  highlighted?: boolean;
  cta: string;
  active_listing_cap: number;
  archive_after_days: number;
}

export const PLAN_CAPS: Record<Plan['slug'], { active_listing_cap: number; archive_after_days: number }> = {
  free: { active_listing_cap: 2, archive_after_days: 30 },
  pro: { active_listing_cap: 15, archive_after_days: 60 },
  developer: { active_listing_cap: 50, archive_after_days: 90 },
};

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
    active_listing_cap: 2,
    archive_after_days: 30,
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
    active_listing_cap: 15,
    archive_after_days: 60,
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
    active_listing_cap: 50,
    archive_after_days: 90,
  },
];

export function getPlanBySlug(slug: string): Plan | undefined {
  return PLANS.find((p) => p.slug === slug);
}