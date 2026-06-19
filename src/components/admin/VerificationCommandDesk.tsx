"use client";

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  is_verified: boolean;
  city: string;
  neighborhood: string;
  created_at: string;
}

interface Props {
  initialListings: Listing[];
}

export default function VerificationCommandDesk({ initialListings }: Props) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const supabase = createClient();

  const toggleVerification = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id);
    const newStatus = !currentStatus;

    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_verified: newStatus })
        .eq('id', id);

      if (error) throw error;

      setListings(prev => 
        prev.map(listing => 
          listing.id === id ? { ...listing, is_verified: newStatus } : listing
        )
      );
    } catch (err) {
      console.error("Failed to toggle verification:", err);
      alert("Failed to update verification status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Verification Command Desk</h3>
        <span className="text-sm text-gray-500">{listings.length} Properties</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Property Title</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Price / Category</th>
              <th className="px-6 py-4">Date Added</th>
              <th className="px-6 py-4 text-center">Verification Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {listings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No properties found in the database.
                </td>
              </tr>
            ) : (
              listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="line-clamp-1">{listing.title}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {listing.neighborhood}, {listing.city}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">GHS {listing.price.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 capitalize">{listing.category?.replace('_', ' ') || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 flex justify-center">
                    <button
                      onClick={() => toggleVerification(listing.id, listing.is_verified)}
                      disabled={updatingId === listing.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        listing.is_verified 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {updatingId === listing.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : listing.is_verified ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {listing.is_verified ? 'Verified' : 'Unverified'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
