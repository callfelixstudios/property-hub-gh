"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'overview' | 'listings' | 'archived' | 'safemove' | 'profile' | null;

  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'archived' | 'safemove' | 'profile'>(tabParam || 'overview');

  useEffect(() => {
    if (tabParam && ['overview', 'listings', 'archived', 'safemove', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [whatsappInput, setWhatsappInput] = useState(() => extractPhoneFromWaLink(initialProfile.whatsapp_link));
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState({
    title: '', description: '', price: '', neighborhood: '', region: '', transaction_type: 'rent' as 'rent' | 'sale', service_charge: '', gps_address: '', category: ''
  });
  const [editMediaUrls, setEditMediaUrls] = useState<string[]>([]);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  const supabase = createClient();

  const handleArchiveListing = async (listingId: string) => {
    const { error } = await supabase
      .from('listings')
      .update({ status: 'archived' })
      .eq('id', listingId)
      .eq('poster_id', userId);
    
    if (error) {
      console.error('Archive failed:', error.message, error);
      alert(`Failed to archive listing: ${error.message}`);
      return;
    }
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'archived' } : l));
    router.refresh();
  };

  const handleRestoreListing = async (listingId: string) => {
    const { error } = await supabase
      .from('listings')
      .update({ status: 'active' })
      .eq('id', listingId)
      .eq('poster_id', userId);
    
    if (error) {
      console.error('Restore failed:', error.message, error);
      alert(`Failed to restore listing: ${error.message}`);
      return;
    }
    setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'active' } : l));
    router.refresh();
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to permanently delete this listing? This cannot be undone.')) return;
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('poster_id', userId);

    if (error) {
      console.error('Database deletion failed:', error.message, error);
      alert(`Failed to delete listing: ${error.message}`);
      return;
    }
    setListings(prev => prev.filter(l => l.id !== listingId));
    router.refresh();
  };

  const openEditModal = (listing: Listing) => {
    setEditingListing(listing);
    setEditForm({
      title: listing.title || '',
      description: listing.description || '',
      price: (listing.transaction_type === 'rent' ? listing.base_rent : listing.outright_price)?.toString() || '',
      neighborhood: listing.neighborhood || '',
      region: listing.region || '',
      transaction_type: listing.transaction_type,
      service_charge: listing.service_charge?.toString() || '',
      gps_address: listing.gps_address || '',
      category: listing.category || ''
    });
    setEditMediaUrls([...(listing.media_urls || [])]);
    setEditImageFile(null);
  };

  const closeEditModal = () => {
    setEditingListing(null);
    setEditMediaUrls([]);
    setEditImageFile(null);
  };

  const handleUpdateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;
    setIsSavingEdit(true);

    const priceVal = parseInt(editForm.price, 10) || 0;
    const serviceChargeVal = parseInt(editForm.service_charge, 10) || 0;
    const updatePayload: any = {
      title: editForm.title,
      description: editForm.description,
      neighborhood: editForm.neighborhood,
      region: editForm.region,
      gps_address: editForm.gps_address,
      service_charge: serviceChargeVal,
      category: editForm.category,
    };

    // Start with the curated media list (user may have removed images)
    let finalMedia = [...editMediaUrls];

    if (editImageFile) {
      const fileName = `${Date.now()}-${editImageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, editImageFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(uploadData.path);
        finalMedia = [publicUrl, ...finalMedia];
      }
    }

    updatePayload.media_urls = finalMedia;

    if (editForm.transaction_type === 'rent') {
      updatePayload.base_rent = priceVal;
    } else {
      updatePayload.outright_price = priceVal;
    }

    const { error } = await supabase
      .from('listings')
      .update(updatePayload)
      .eq('id', editingListing.id)
      .eq('poster_id', userId);

    setIsSavingEdit(false);
    if (!error) {
      setListings(listings.map(l => l.id === editingListing.id ? { ...l, ...updatePayload } : l));
      closeEditModal();
      router.refresh();
    } else {
      alert("Failed to update listing: " + error.message);
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
    { id: 'archived', label: 'Archived Listings' },
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
              onClick={() => {
                setActiveTab(tab.id);
                router.push(`/dashboard?tab=${tab.id}`, { scroll: false });
              }}
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
            {listings.filter(l => l.status === 'active').length === 0 ? (
              <p className="text-gray-500">You don't have any active listings yet.</p>
            ) : (
              <div className="space-y-4">
                {listings.filter(l => l.status === 'active').map((listing) => (
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
                    <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                      <button
                        onClick={() => openEditModal(listing)}
                        className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold py-2 px-4 rounded-md transition-colors flex-1 sm:flex-none"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleArchiveListing(listing.id)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-bold py-2 px-4 rounded-md transition-colors border border-amber-200 flex-1 sm:flex-none"
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="text-red-600 hover:bg-red-50 text-sm font-bold py-2 px-4 rounded-md transition-colors border border-red-200 flex-1 sm:flex-none"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ARCHIVED LISTINGS TAB */}
        {activeTab === 'archived' && (
          <div>
            <h2 className="text-2xl font-bold text-navy-base mb-6">Archived Listings</h2>
            {listings.filter(l => l.status === 'archived').length === 0 ? (
              <p className="text-gray-500">You don't have any archived listings.</p>
            ) : (
              <div className="space-y-4">
                {listings.filter(l => l.status === 'archived').map((listing) => (
                  <div key={listing.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-md border border-gray-200 hover:border-gray-300 transition-colors bg-slate-50 opacity-75 hover:opacity-100">
                    <div className="mb-4 sm:mb-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-navy-base text-lg line-clamp-1">{listing.title || 'Untitled Property'}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold bg-gray-200 text-gray-600`}>
                          Archived
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {listing.transaction_type === 'rent' ? 'For Rent' : 'For Sale'} • 
                        <span className="font-semibold text-navy-base ml-1">
                          ₵{listing.transaction_type === 'rent' ? listing.base_rent : listing.outright_price}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                      <button
                        onClick={() => openEditModal(listing)}
                        className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold py-2 px-4 rounded-md transition-colors flex-1 sm:flex-none"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRestoreListing(listing.id)}
                        className="text-teal-600 hover:bg-teal-50 text-sm font-bold py-2 px-4 rounded-md transition-colors border border-teal-600 flex-1 sm:flex-none"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="text-red-600 hover:bg-red-50 text-sm font-bold py-2 px-4 rounded-md transition-colors border border-red-200 flex-1 sm:flex-none"
                      >
                        Permanently Delete
                      </button>
                    </div>
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

      {/* Editor Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-navy-base">Edit Listing</h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateListing} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-navy-base mb-1">Title</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-navy-base outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-navy-base mb-1">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-navy-base outline-none" rows={4} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-navy-base mb-1">Price (₵)</label>
                  <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-navy-base outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-navy-base mb-1">Service Charge (₵)</label>
                  <input type="number" value={editForm.service_charge} onChange={e => setEditForm({...editForm, service_charge: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-navy-base outline-none" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-navy-base mb-1">Region</label>
                  <select value={editForm.region} onChange={e => setEditForm({...editForm, region: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-navy-base outline-none">
                    <option value="">Select Region...</option>
                    <option value="greater_accra">Greater Accra</option>
                    <option value="ashanti">Ashanti</option>
                    <option value="central">Central</option>
                    <option value="ahafo">Ahafo</option>
                    <option value="bono">Bono</option>
                    <option value="bono_east">Bono East</option>
                    <option value="eastern">Eastern</option>
                    <option value="north_east">North East</option>
                    <option value="northern">Northern</option>
                    <option value="oti">Oti</option>
                    <option value="savannah">Savannah</option>
                    <option value="upper_east">Upper East</option>
                    <option value="upper_west">Upper West</option>
                    <option value="volta">Volta</option>
                    <option value="western">Western</option>
                    <option value="western_north">Western North</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-navy-base mb-1">Category</label>
                  <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-navy-base outline-none">
                    <option value="">Select Category...</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Townhouse / Terrace">Townhouse / Terrace</option>
                    <option value="Single Room Self-Contain">Single Room Self-Contain</option>
                    <option value="Chamber and Hall">Chamber and Hall</option>
                    <option value="Boys Quarters (BQ)">Boys Quarters (BQ)</option>
                    <option value="Studio Apartment">Studio Apartment</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Villa / Mansion">Villa / Mansion</option>
                    <option value="Bungalow">Bungalow</option>
                    <option value="Shared Apartment">Shared Apartment</option>
                    <option value="Block of Flats">Block of Flats</option>
                    <option value="Farm House">Farm House</option>
                    <option value="Plot of Land">Plot of Land</option>
                    <option value="Commercial Property / Office">Commercial Property / Office</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-navy-base mb-1">Neighborhood</label>
                  <input type="text" value={editForm.neighborhood} onChange={e => setEditForm({...editForm, neighborhood: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-navy-base outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-navy-base mb-1">Nearest Landmark or Location Description</label>
                  <input type="text" value={editForm.gps_address} onChange={e => setEditForm({...editForm, gps_address: e.target.value})} placeholder="e.g. Near East Legon Starbites" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-navy-base outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-navy-base mb-1">Add New Image</label>
                  <input type="file" accept="image/*" onChange={e => setEditImageFile(e.target.files?.[0] || null)} className="w-full px-4 py-1.5 border border-gray-300 rounded-md focus:border-navy-base outline-none text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-navy-base file:text-white hover:file:bg-navy-light cursor-pointer" />
                </div>
              </div>
              {/* Existing Image Thumbnails */}
              {editMediaUrls.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-navy-base mb-2">Current Images</label>
                  <div className="flex flex-wrap gap-3">
                    {editMediaUrls.map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg border border-slate-200 overflow-hidden group">
                        <Image src={url} alt={`Image ${idx + 1}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditMediaUrls(editMediaUrls.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-sm transition-colors z-10"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Click the red ✕ on any image to remove it.</p>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={closeEditModal} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-bold transition-colors">Cancel</button>
                <button type="submit" disabled={isSavingEdit} className="bg-navy-base hover:bg-navy-light transition-colors text-white px-6 py-2 rounded-md font-bold disabled:opacity-50">
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
