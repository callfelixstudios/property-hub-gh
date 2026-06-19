"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';

export default function RequestSpacePage() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    seeker_name: '',
    whatsapp_number: '',
    location: '',
    property_type: 'apartment',
    budget: '',
    purpose: 'Residential',
    additional_details: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    if (!formData.seeker_name || !formData.whatsapp_number || !formData.location || !formData.budget) {
      setErrorMsg("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from('space_requests').insert({
        seeker_name: formData.seeker_name,
        whatsapp_number: formData.whatsapp_number,
        location: formData.location,
        property_type: formData.property_type,
        budget: Number(formData.budget),
        purpose: formData.purpose,
        additional_details: formData.additional_details
      });

      if (error) {
        console.error("Supabase insert error:", error);
        setErrorMsg(error.message);
      } else {
        setSuccess(true);

        // Dispatch live notification if webhook URL is configured
        const webhookUrl = process.env.NEXT_PUBLIC_ADMIN_WEBHOOK_URL;
        if (webhookUrl) {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `🔔 **New Space Request**\n**Seeker:** ${formData.seeker_name}\n**Location:** ${formData.location}\n**Budget:** GHS ${formData.budget}\n**Category:** ${formData.property_type.replace('_', ' ')} (${formData.purpose})\n**Contact:** ${formData.whatsapp_number}`
            })
          }).catch(err => console.error("Webhook notification failed:", err));
        }
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col pt-32">
      <NavigationHeader />
      
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-emerald-600 px-8 py-6 text-white">
            <h1 className="text-3xl font-bold tracking-tight">Request a Space</h1>
            <p className="mt-2 text-emerald-100 font-medium">Post your requirements and let property owners pitch to you directly on WhatsApp.</p>
          </div>

          <div className="p-8">
            {success ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Posted Successfully!</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Your space request is now live on our notice board. Agents and landlords will contact you on WhatsApp with matching properties.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => router.push('/requests')}
                    className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-md"
                  >
                    View Notice Board
                  </button>
                  <button
                    onClick={() => { setSuccess(false); setFormData({ seeker_name: '', whatsapp_number: '', location: '', property_type: 'apartment', budget: '', purpose: 'Residential', additional_details: '' }); }}
                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Post Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {errorMsg && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="font-medium text-sm">{errorMsg}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name *</label>
                    <input
                      type="text"
                      name="seeker_name"
                      value={formData.seeker_name}
                      onChange={handleChange}
                      placeholder="e.g. Kwame Mensah"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-shadow"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp Number *</label>
                    <input
                      type="tel"
                      name="whatsapp_number"
                      value={formData.whatsapp_number}
                      onChange={handleChange}
                      placeholder="e.g. +233541234567"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-shadow"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Include country code (e.g. +233)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. East Legon, Spintex, or Osu"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-shadow"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Property Category *</label>
                    <div className="relative">
                      <select
                        name="property_type"
                        value={formData.property_type}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-shadow"
                        required
                      >
                        <option value="single_room">Single Room</option>
                        <option value="chamber_hall">Chamber and Hall</option>
                        <option value="apartment">Apartment</option>
                        <option value="house">House / Villa</option>
                        <option value="block_of_flat">Block of Flats</option>
                        <option value="hostel">Hostel</option>
                        <option value="commercial">Commercial Space</option>
                        <option value="land">Land</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Budget (GHS) *</label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="e.g. 2000"
                      min="0"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-shadow"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose *</label>
                  <div className="flex gap-4">
                    {['Residential', 'Commercial'].map((opt) => (
                      <label key={opt} className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl border cursor-pointer transition-all ${formData.purpose === opt ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-500' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                        <input
                          type="radio"
                          name="purpose"
                          value={opt}
                          checked={formData.purpose === opt}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className="font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Details (Optional)</label>
                  <textarea
                    name="additional_details"
                    value={formData.additional_details}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe specific amenities, conditions, or anything else you need (e.g. must have steady water flow, secure parking...)"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-shadow resize-none"
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Posting Request...
                      </>
                    ) : (
                      "Post Space Request"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
