import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';
import RequestsBudget from '@/components/RequestsBudget';
import { MapPin, Calendar, ArrowLeft, ArrowRight, Lock } from 'lucide-react';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Property Request | Property Hub GH',
  robots: { index: false, follow: false },
};

function formatPropertyType(type: string) {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
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

function generateWhatsAppLink(request: SpaceRequest) {
  const message = `Hi ${request.seeker_name}, I saw your request for a ${formatPropertyType(request.property_type)} in ${request.location} with a budget of ${formatCurrency(request.budget)} on Property Hub. I have a property that might fit your needs!`;
  const cleanPhone = request.whatsapp_number.replace(/[^\d+]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const fullColumns = 'id, seeker_name, whatsapp_number, location, property_type, purpose, additional_details, budget, status, created_at';
  const safeColumns = 'id, seeker_name, location, property_type, purpose, additional_details, budget, status, created_at';

  const { data: request, error } = await supabase
    .from('space_requests')
    .select(user ? fullColumns : safeColumns)
    .eq('id', id)
    .single() as unknown as {
    data: SpaceRequest | null;
    error: { message: string } | null;
  };

  if (error || !request || request.status !== 'active') {
    notFound();
  }

  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans pt-32">
        <NavigationHeader />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
          <Link
            href="/requests"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-navy-base transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notice Board
          </Link>

          <div className="max-w-lg mx-auto mt-16">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-center p-10">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Lock className="w-7 h-7 text-slate-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Want to view seeker details and pitch your property?
              </h2>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                Sign in or create an account to access seeker contact information and pitch your available properties directly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={`/login?next=/requests/${id}`}
                  className="px-6 py-3 bg-navy-base text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  Log In
                </Link>
                <Link
                  href={`/register?next=/requests/${id}`}
                  className="px-6 py-3 bg-white text-navy-base font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pt-32">
      <NavigationHeader />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <Link
          href="/requests"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-navy-base transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notice Board
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
                      {request.purpose}
                    </span>
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                      {formatPropertyType(request.property_type)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(request.created_at)}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">
                  Looking for a {formatPropertyType(request.property_type)} in {request.location}
                </h1>

                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span className="text-base font-medium">{request.location}</span>
                </div>

                <div className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-base font-medium">{request.seeker_name}</span>
                </div>
              </div>
            </div>

            {request.additional_details && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 sm:p-8">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Requirements & Details</h2>
                  <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-line">
                    {request.additional_details}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6 sticky top-28">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Budget</h3>
                <div className="text-3xl font-extrabold text-navy-base">
                  <RequestsBudget amount={request.budget} />
                </div>
                <p className="text-xs text-gray-500 mt-2">Maximum budget for this request</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Contact Seeker</h3>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  Pitch your available property directly to {request.seeker_name} via WhatsApp.
                </p>
                <a
                  href={generateWhatsAppLink(request)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  Contact via WhatsApp
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
