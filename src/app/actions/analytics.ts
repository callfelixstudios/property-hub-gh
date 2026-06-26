'use server';

import { createClient } from '@/utils/supabase/server';
import { TimeframePeriod } from '@/components/dashboard/TimeframeSelector';

function getDateThreshold(period: TimeframePeriod): string | null {
  const now = new Date();
  switch (period) {
    case '24h': now.setHours(now.getHours() - 24); break;
    case '7d':  now.setDate(now.getDate() - 7); break;
    case '30d': now.setDate(now.getDate() - 30); break;
    case '3m':  now.setMonth(now.getMonth() - 3); break;
    case '6m':  now.setMonth(now.getMonth() - 6); break;
    case '1y':  now.setFullYear(now.getFullYear() - 1); break;
    case 'all': default: return null;
  }
  return now.toISOString();
}

export async function fetchTimeframeAnalytics(posterId: string, period: TimeframePeriod) {
  const supabase = createClient();
  const dateThreshold = getDateThreshold(period);

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, status')
    .eq('poster_id', posterId);

  if (!listings || listings.length === 0) {
    return { totalViews: 0, totalLeads: 0, conversionRate: '0.0', listingBreakdown: [] };
  }

  const listingIds = listings.map((l) => l.id);

  let query = supabase
    .from('property_analytics')
    .select('listing_id, event_type')
    .in('listing_id', listingIds);

  if (dateThreshold) {
    query = query.gte('created_at', dateThreshold);
  }

  const { data: events } = await query;
  const safeEvents = events || [];

  const totalViews = safeEvents.filter((e) => e.event_type === 'view').length;
  const totalLeads = safeEvents.filter((e) => e.event_type === 'whatsapp').length;
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0.0';

  const listingBreakdown = listings.map((listing) => {
    const pEvents = safeEvents.filter((e) => e.listing_id === listing.id);
    const views = pEvents.filter((e) => e.event_type === 'view').length;
    const leads = pEvents.filter((e) => e.event_type === 'whatsapp').length;
    return {
      id: listing.id,
      title: listing.title,
      status: listing.status || 'active',
      views_count: views,
      whatsapp_leads_count: leads,
      conversion_rate: views > 0 ? ((leads / views) * 100).toFixed(1) : '0.0',
    };
  });

  return { totalViews, totalLeads, conversionRate, listingBreakdown };
}
