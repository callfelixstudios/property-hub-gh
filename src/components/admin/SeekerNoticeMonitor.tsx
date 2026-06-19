"use client";

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trash2, Loader2, Phone } from 'lucide-react';

interface SpaceRequest {
  id: string;
  seeker_name: string;
  whatsapp_number: string;
  location: string;
  property_type: string;
  budget: number;
  purpose: string;
  created_at: string;
}

interface Props {
  initialRequests: SpaceRequest[];
}

export default function SeekerNoticeMonitor({ initialRequests }: Props) {
  const [requests, setRequests] = useState<SpaceRequest[]>(initialRequests);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  const deleteRequest = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this request?")) return;
    
    setDeletingId(id);

    try {
      const { error } = await supabase
        .from('space_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (err) {
      console.error("Failed to delete request:", err);
      alert("Failed to delete the request.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Seeker Notice Monitor</h3>
        <span className="text-sm text-gray-500">{requests.length} Requests</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Seeker</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Target Location</th>
              <th className="px-6 py-4">Preferences</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No active space requests found.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {req.seeker_name}
                  </td>
                  <td className="px-6 py-4">
                    <a href={`https://wa.me/${req.whatsapp_number.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700">
                      <Phone className="w-4 h-4" />
                      {req.whatsapp_number}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {req.location}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">GHS {req.budget?.toLocaleString()} Max</div>
                    <div className="text-xs text-gray-500 capitalize">{req.property_type?.replace('_', ' ')} • {req.purpose}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteRequest(req.id)}
                      disabled={deletingId === req.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Archive/Delete Request"
                    >
                      {deletingId === req.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
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
