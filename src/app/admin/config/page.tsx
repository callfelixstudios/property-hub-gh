import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getCreditConfig, getPlansPricing } from '@/lib/plansPricing';
import ConfigManager from '@/components/admin/ConfigManager';
import PricingManager from '@/components/admin/PricingManager';

export const metadata = {
  title: 'Platform Config | Admin — Property Hub GH',
};

export default async function AdminConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();

  const { data: amenities } = await supabase
    .from('config_amenities')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const [plans, credit] = await Promise.all([getPlansPricing(), getCreditConfig()]);

  const tab = (await searchParams).tab === 'pricing' ? 'pricing' : 'amenities';
  const tabClass = (active: boolean) =>
    `flex-1 py-4 text-sm font-medium text-center border-b-2 ${
      active ? 'border-navy-base text-navy-base' : 'border-transparent text-gray-400 hover:text-gray-600'
    }`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Configuration</h1>
        <p className="text-gray-500 mt-1">Manage dynamically loaded locations and amenities.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="flex border-b border-gray-200">
          <Link href="/admin/config" className={tabClass(tab === 'amenities')}>
            Amenities &amp; Features
          </Link>
          <Link href="/admin/config?tab=pricing" className={tabClass(tab === 'pricing')}>
            Pricing &amp; packages
          </Link>
        </div>

        <div className="p-6">
          {tab === 'pricing' ? (
            <PricingManager plans={plans} credit={credit} />
          ) : (
            <ConfigManager initialAmenities={amenities || []} />
          )}
        </div>
      </div>
    </div>
  );
}
