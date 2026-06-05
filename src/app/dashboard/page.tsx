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

  return (
    <DashboardTabs 
      initialListings={listings || []} 
      initialProfile={profile || {}} 
      userId={user.id} 
    />
  );
}
