'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function ReportModal({ listingId }: { listingId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("Agent claims it's unavailable, demands money to see another place");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const REASONS = [
    "Agent claims it's unavailable, demands money to see another place",
    "Photos do not match reality",
    "Misleading/false pricing"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createClient();
    
    // Call the RPC
    await supabase.rpc('report_listing', {
      p_listing_id: listingId,
      p_reason: reason,
      p_details: details
    });

    setIsSubmitting(false);
    setSuccess(true);
    setTimeout(() => {
      setIsOpen(false);
      setSuccess(false);
      setDetails("");
    }, 2000);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full mt-4 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-100 flex justify-center items-center gap-1.5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Report Listing
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-base/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-navy-base mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Report this listing
            </h2>
            
            {success ? (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg text-center font-medium border border-emerald-100">
                Thank you. Your report has been securely submitted to our trust team for review.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-navy-base mb-1.5">Reason</label>
                  <select 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none text-navy-base focus:border-navy-light transition-colors cursor-pointer"
                  >
                    {REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy-base mb-1.5">Additional Details (Optional)</label>
                  <textarea 
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2.5 outline-none text-navy-base resize-none focus:border-navy-light transition-colors"
                    placeholder="Provide any extra context that might help us investigate..."
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
