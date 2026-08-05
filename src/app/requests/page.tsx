import type { Metadata } from 'next';
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';
import { MapPin, Wallet, Calendar, Search } from 'lucide-react';
import Link from 'next/link';
import RequestsBudget from '@/components/RequestsBudget';
import SeekerCardActions from '@/components/requests/SeekerCardActions';
import { JsonLd, getBreadcrumbSchema } from '@/components/seo/JsonLd';

export const revalidate = 0; // Disable caching to always show latest requests

export const metadata: Metadata = {
  title: 'Property Requests & Tenant Space Finder | Property Hub GH',
  description: 'Browse active property requests from tenants and buyers seeking apartments, single rooms, hostels, or land across Accra and Ghana.',
  alternates: {
    canonical: 'https://www.propertyhubgh.com/requests',
  },
  openGraph: {
    title: 'Property Requests & Tenant Space Finder | Property Hub GH',
    description: 'Browse active tenant property requests across Ghana.',
    url: 'https://www.propertyhubgh.com/requests',
    images: ['https://www.propertyhubgh.com/opengraph-image'],
  },
};

export default async function RequestsPage() {
  const supabase = await createClient();

  // Fetch space requests
  const { data: requests, error } = await supabase
    .from('space_requests')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching requests:", error);
  }

  interface SpaceRequest {
    id: string;
    seeker_name: string;
    whatsapp_number: string;
    property_type: string;
    purpose: string;
    location: string;
    budget: number;
    additional_details?: string;
    status: string;
    created_at: string;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);
  };

  const generateWhatsAppLink = (request: SpaceRequest) => {
    const message = `Hi ${request.seeker_name}, I saw your request for a ${formatPropertyType(request.property_type)} in ${request.location} with a budget of ${formatCurrency(request.budget)} on Property Hub. I have a property that might fit your needs!`;
    const cleanPhone = request.whatsapp_number.replace(/[^\d+]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const formatPropertyType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pt-32">
      <JsonLd data={getBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Property Requests', url: '/requests' }])} />
      <NavigationHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Seeker Notice Board</h1>
            <p className="text-gray-600 mt-2">Discover verified seekers actively looking for properties to rent or buy.</p>
          </div>
        </div>

        {requests && requests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
                      {req.purpose}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{timeAgo(req.created_at)}</span>
                  </div>
                  
                  <Link href={`/requests/${req.id}`} className="group">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
                      Looking for a {formatPropertyType(req.property_type)}
                    </h3>
                  </Link>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm font-medium">{req.location}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Wallet className="w-4 h-4 mr-2 text-gray-400" />
                      <RequestsBudget amount={req.budget} />
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm font-medium">Seeker: {req.seeker_name}</span>
                    </div>
                  </div>

                  {req.additional_details && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        &quot;{req.additional_details}&quot;
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                  <SeekerCardActions
                    requestId={req.id}
                    whatsappLink={generateWhatsAppLink(req)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-gray-500 mb-6">There are currently no active space requests on the board.</p>
            <Link 
              href="/request-space"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Be the first to post a request
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
