import { createClient } from '@/utils/supabase/server';
import ConfigManager from '@/components/admin/ConfigManager';

export const metadata = {
  title: 'Platform Config | Admin — Property Hub GH',
};

export default async function AdminConfigPage() {
  const supabase = await createClient();

  const { data: regions } = await supabase
    .from('config_regions')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const { data: neighborhoods } = await supabase
    .from('config_neighborhoods')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const { data: amenities } = await supabase
    .from('config_amenities')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Configuration</h1>
        <p className="text-gray-500 mt-1">Manage dynamically loaded locations and amenities.</p>
      </div>

      <ConfigManager
        initialRegions={regions || []}
        initialNeighborhoods={neighborhoods || []}
        initialAmenities={amenities || []}
      />
    </div>
  );
}
