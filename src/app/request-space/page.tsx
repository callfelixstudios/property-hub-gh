"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';
import { RESIDENTIAL_CATEGORIES, COMMERCIAL_CATEGORIES, GHANA_REGIONS } from '@/data/propertyCategories';
import { useCurrency } from '@/context/CurrencyContext';
import type { Currency } from '@/utils/currency-cookie';

export default function RequestSpacePage() {
  const router = useRouter();
  const supabase = createClient();
  const { displayCurrency } = useCurrency();

  const [formData, setFormData] = useState({
    seeker_name: '',
    whatsapp_number: '',
    purpose: 'Residential',
    property_type: 'Apartment',
    region: '',
    neighborhood: '',
    additional_details: ''
  });

  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState<Currency>(displayCurrency);
  const [paymentTerm, setPaymentTerm] = useState<"month" | "year">("month");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePurposeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      purpose: value,
      property_type: value === 'Residential' ? 'Apartment' : 'Business Center'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    if (!formData.seeker_name || !formData.whatsapp_number || !formData.region || !budgetAmount) {
      setErrorMsg("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    const locationPreview = [formData.neighborhood, formData.region].filter(Boolean).join(', ');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('space_requests').insert({
        seeker_name: formData.seeker_name,
        whatsapp_number: formData.whatsapp_number,
        location: locationPreview,
        property_type: formData.property_type,
        budget: Number(budgetAmount),
        purpose: formData.purpose,
        additional_details: formData.additional_details,
        user_id: user?.id || null,
        status: 'active'
      });

      if (error) {
        console.error("Supabase insert error:", error);
        setErrorMsg(error.message);
      } else {
        setSuccess(true);

        const webhookUrl = process.env.NEXT_PUBLIC_ADMIN_WEBHOOK_URL;
        if (webhookUrl) {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `🔔 **New Space Request**\n**Seeker:** ${formData.seeker_name}\n**Location:** ${locationPreview}\n**Budget:** ${budgetCurrency} ${budgetAmount} / ${paymentTerm === 'month' ? 'month' : 'year'}\n**Category:** ${formData.property_type} (${formData.purpose})\n**Contact:** ${formData.whatsapp_number}`
            })
          }).catch(err => console.error("Webhook notification failed:", err));
        }
      }
    } catch (err: unknown) {
      console.error("Unexpected error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(errorMessage);
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
                    onClick={() => { setSuccess(false); setFormData({ seeker_name: '', whatsapp_number: '', purpose: 'Residential', property_type: 'Apartment', region: '', neighborhood: '', additional_details: '' }); setBudgetAmount(""); setBudgetCurrency(displayCurrency); setPaymentTerm("month"); }}
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

                {/* Purpose — moved first so category dropdown is immediately contextual */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">I am looking for *</label>
                  <div className="flex gap-4">
                    {['Residential', 'Commercial'].map((opt) => (
                      <label key={opt} className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl border cursor-pointer transition-all ${formData.purpose === opt ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-500' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                        <input
                          type="radio"
                          name="purpose"
                          value={opt}
                          checked={formData.purpose === opt}
                          onChange={() => handlePurposeChange(opt)}
                          className="sr-only"
                        />
                        <span className="font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Name + WhatsApp */}
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

                {/* Property Category + Region */}
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
                        {formData.purpose === 'Residential' ? (
                          RESIDENTIAL_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))
                        ) : (
                          COMMERCIAL_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Region *</label>
                    <div className="relative">
                      <select
                        name="region"
                        value={formData.region}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-shadow"
                        required
                      >
                        <option value="">Select Region...</option>
                        {GHANA_REGIONS.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Neighborhood — standalone full-width */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Neighborhood / Area (Optional)</label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    placeholder="e.g. East Legon, Spintex, Osu"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-shadow"
                  />
                  <p className="text-xs text-gray-500 mt-1">Specific area within the region for better targeting.</p>
                </div>

                {/* Maximum Budget — isolated full-width row */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Budget *</label>
                  <div className="flex flex-col sm:flex-row gap-3 w-full items-start sm:items-center">
                    <div className="flex-1 w-full">
                      <input
                        type="number"
                        value={budgetAmount}
                        onChange={(e) => setBudgetAmount(e.target.value)}
                        placeholder="e.g. 2,500"
                        min="0"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-shadow"
                        required
                      />
                    </div>
                    <div className="relative w-full sm:w-[110px]">
                      <select
                        value={budgetCurrency}
                        onChange={(e) => setBudgetCurrency(e.target.value as Currency)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-shadow text-sm font-medium"
                      >
                        <option value="GHS">₵ GHS</option>
                        <option value="USD">$ USD</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative w-full sm:w-[170px]">
                      <select
                        value={paymentTerm}
                        onChange={(e) => setPaymentTerm(e.target.value as "month" | "year")}
                        className="w-full border border-gray-300 rounded-xl px-3 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-shadow text-sm"
                      >
                        <option value="month">per month</option>
                        <option value="year">per year (Advance)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
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
