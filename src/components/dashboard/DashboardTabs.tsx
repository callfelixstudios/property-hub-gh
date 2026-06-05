"use client";

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Listing {
  id: string;
  title: string;
  status: string;
  transaction_type: 'rent' | 'sale';
  base_rent?: number;
  outright_price?: number;
  safemove_enabled?: boolean;
  views?: number;
  [key: string]: any;
}

interface Profile {
  id?: string;
  full_name?: string;
  contact_phone?: string;
  whatsapp_link?: string;
  [key: string]: any;
}

interface SafemoveTransaction {
  id: string;
  status: string;
  transaction_amount: number;
  listings?: {
    id: string;
    title: string;
    neighborhood?: string;
    city?: string;
  };
  [key: string]: any;
}

const extractPhoneFromWaLink = (link?: string) => {
  if (!link) return '';
  const match = link.match(/wa\.me\/(\d+)/);
  return match ? match[1] : '';
};

export default function DashboardTabs({
  initialListings,
  initialProfile,
  initialSafemoveTransactions = [],
  userId
}: {
  initialListings: Listing[];
  initialProfile: Profile;
  initialSafemoveTransactions?: SafemoveTransaction[];
  userId: string;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'safemove' | 'profile'>('overview');
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [whatsappInput, setWhatsappInput] = useState(() => extractPhoneFromWaLink(initialProfile.whatsapp_link));
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  
  const supabase = createClient();
  const router = useRouter();

  const handleArchiveListing = async (listingId: string) => {
    const { error } = await supabase
      .from('listings')
      .update({ status: 'archived' })
      .eq('id', listingId);
    
    if (!error) {
      setListings(listings.filter(l => l.id !== listingId));
      router.refresh();
    } else {
      alert("Failed to archive listing.");
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage('');

    let sanitizedNumber = whatsappInput.replace(/\D/g, '');
    if (sanitizedNumber.startsWith('0')) {
      sanitizedNumber = '233' + sanitizedNumber.slice(1);
    }
    const finalWaLink = sanitizedNumber ? `https://wa.me/${sanitizedNumber}` : null;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        contact_phone: profile.contact_phone,
        whatsapp_link: finalWaLink
      })
      .eq('id', userId);

    setIsUpdatingProfile(false);
    if (!error) {
      setProfileMessage('Profile updated successfully!');
      setProfile({ ...profile, whatsapp_link: finalWaLink || undefined });
      router.refresh();
    } else {
      console.error("Supabase update error:", error);
      setProfileMessage(`Error updating profile: ${error.message || JSON.stringify(error)}`);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'listings', label: 'My Listings' },
    { id: 'safemove', label: 'SafeMove Tracker' },
    { id: 'profile', label: 'Profile Settings' },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Left Navigation Rail */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-left px-4 py-3 rounded-md font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-navy-base text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:p-8">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold text-navy-base mb-6">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-md border border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-1">Total Listings</p>
                <p className="text-3xl font-bold text-navy-base">{listings.length}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-md border border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-1">SafeMove Transactions</p>
                <p className="text-3xl font-bold text-navy-base">{initialSafemoveTransactions.length}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-md border border-gray-100">
                <p className="text-sm text-gray-500 font-medium mb-1">Total Views</p>
                <p className="text-3xl font-bold text-navy-base">{listings.reduce((sum, listing) => sum + (listing.views || 0), 0)}</p>
              </div>
            </div>
          </div>
        )}

        {/* MY LISTINGS TAB */}
        {activeTab === 'listings' && (
          <div>
            <h2 className="text-2xl font-bold text-navy-base mb-6">My Listings</h2>
            {listings.length === 0 ? (
              <p className="text-gray-500">You don't have any active listings yet.</p>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-md border border-gray-200 hover:border-gray-300 transition-colors bg-slate-50">
                    <div className="mb-4 sm:mb-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-navy-base text-lg line-clamp-1">{listing.title || 'Untitled Property'}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${listing.status === 'active' ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-gray-200 text-gray-600'}`}>
                          {listing.status ? listing.status.charAt(0).toUpperCase() + listing.status.slice(1) : 'Active'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {listing.transaction_type === 'rent' ? 'For Rent' : 'For Sale'} • 
                        <span className="font-semibold text-navy-base ml-1">
                          ₵{listing.transaction_type === 'rent' ? listing.base_rent : listing.outright_price}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleArchiveListing(listing.id)}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-2 px-4 rounded-md transition-colors sm:w-auto w-full"
                    >
                      Archive Listing
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SAFEMOVE TRACKER TAB */}
        {activeTab === 'safemove' && (
          <div>
            <h2 className="text-2xl font-bold text-navy-base mb-2">SafeMove Tracker</h2>
            <p className="text-gray-500 mb-8 text-sm">Monitor your ongoing secure escrow transactions.</p>
            
            {initialSafemoveTransactions.length === 0 ? (
              <div className="bg-slate-50 rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">You don't have any active SafeMove escrow transactions right now.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {initialSafemoveTransactions.map((tx) => (
                  <div key={tx.id} className="bg-slate-50 rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-navy-base text-lg">Transaction #{tx.id.split('-')[0].toUpperCase()}</h3>
                        <p className="text-sm text-gray-500">{tx.listings?.title || 'Unknown Property'}</p>
                      </div>
                      <div className={`font-bold px-3 py-1 rounded-full text-xs ${tx.status === 'completed' ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-gold/10 text-accent-gold'}`}>
                        {tx.status === 'completed' ? 'Completed' : 'In Progress'}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 mt-8">
                      {/* Step 1: Deposit Locked */}
                      <div className="relative pl-6">
                        <div className={`absolute w-6 h-6 rounded-full -left-[13px] flex items-center justify-center border-4 border-slate-50 ${['gps_pending', 'scheduled_handover', 'completed'].includes(tx.status) ? 'bg-accent-emerald' : (tx.status === 'deposit_locked' ? 'bg-accent-gold' : 'bg-gray-300')}`}>
                          {['gps_pending', 'scheduled_handover', 'completed'].includes(tx.status) ? (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <h4 className="font-bold text-navy-base">Deposit Locked</h4>
                        <p className="text-sm text-gray-500 mt-1">Funds have been securely held in the Property Hub escrow account.</p>
                      </div>
                      
                      {/* Step 2: GPS Verification Pending */}
                      <div className="relative pl-6">
                        <div className={`absolute w-6 h-6 rounded-full -left-[13px] flex items-center justify-center border-4 border-slate-50 ${['scheduled_handover', 'completed'].includes(tx.status) ? 'bg-accent-emerald' : (tx.status === 'gps_pending' ? 'bg-accent-gold' : 'bg-gray-300')}`}>
                          {['scheduled_handover', 'completed'].includes(tx.status) ? (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : tx.status === 'gps_pending' ? (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          ) : null}
                        </div>
                        <h4 className={`font-bold ${['gps_pending', 'scheduled_handover', 'completed'].includes(tx.status) ? 'text-navy-base' : 'text-gray-400'}`}>GPS Verification Pending</h4>
                        <p className="text-sm text-gray-500 mt-1">Awaiting physical verification of the property against provided GPS coordinates.</p>
                      </div>

                      {/* Step 3: Handover & Release Scheduled */}
                      <div className="relative pl-6">
                        <div className={`absolute w-6 h-6 rounded-full -left-[13px] flex items-center justify-center border-4 border-slate-50 ${tx.status === 'completed' ? 'bg-accent-emerald' : (tx.status === 'scheduled_handover' ? 'bg-accent-gold' : 'bg-gray-300')}`}>
                          {tx.status === 'completed' ? (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : tx.status === 'scheduled_handover' ? (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          ) : null}
                        </div>
                        <h4 className={`font-bold ${['scheduled_handover', 'completed'].includes(tx.status) ? 'text-navy-base' : 'text-gray-400'}`}>Handover & Release Scheduled</h4>
                        <p className="text-sm text-gray-500 mt-1">Keys to be handed over and funds released to the landlord.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE SETTINGS TAB */}
        {activeTab === 'profile' && (
          <div>
            <h2 className="text-2xl font-bold text-navy-base mb-6">Profile Settings</h2>
            
            <form onSubmit={handleProfileSubmit} className="max-w-xl space-y-5">
              <div>
                <label className="block text-sm font-semibold text-navy-base mb-1">Agent Display Name</label>
                <input
                  type="text"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-navy-base focus:ring-1 focus:ring-navy-base text-gray-900"
                  placeholder="e.g. John Doe Properties"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-base mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={profile.contact_phone || ''}
                  onChange={(e) => setProfile({ ...profile, contact_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-navy-base focus:ring-1 focus:ring-navy-base text-gray-900"
                  placeholder="e.g. 055 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-base mb-1">WhatsApp Phone Number</label>
                <input
                  type="text"
                  value={whatsappInput}
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-navy-base focus:ring-1 focus:ring-navy-base text-gray-900"
                  placeholder="e.g., 024 412 3456"
                />
                <p className="text-xs text-gray-500 mt-1">Buyers/Renters will use this number to contact you via WhatsApp directly.</p>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-navy-base hover:bg-navy-light text-white font-bold py-2.5 px-6 rounded-md transition-colors disabled:opacity-50"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
                {profileMessage && (
                  <span className={`text-sm font-medium ${profileMessage.includes('Error') ? 'text-red-500' : 'text-accent-emerald'}`}>
                    {profileMessage}
                  </span>
                )}
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
