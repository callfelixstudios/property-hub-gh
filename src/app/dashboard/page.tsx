import { createClient } from '@/utils/supabase/server';
import DashboardTabs from '@/components/dashboard/DashboardTabs';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch listings for this user
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('poster_id', user.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch safemove transactions (where user is landlord or tenant)
  const { data: safemoveTransactions } = await supabase
    .from('safemove_transactions')
    .select(`
      *,
      listings ( id, title, neighborhood, city )
    `)
    .or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  return (
    <DashboardTabs 
      initialListings={listings || []} 
      initialProfile={profile || {}} 
      initialSafemoveTransactions={safemoveTransactions || []}
      userId={user.id} 
    />
  );
}
