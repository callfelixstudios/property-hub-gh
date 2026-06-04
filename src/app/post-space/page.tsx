"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function PostSpaceWizard() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 State
  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [gpsAddress, setGpsAddress] = useState("");

  // Step 2 State
  const [baseRent, setBaseRent] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [outrightPrice, setOutrightPrice] = useState("");
  const [legalStatus, setLegalStatus] = useState("");

  // Step 3 State
  const [generatorBackup, setGeneratorBackup] = useState(false);
  const [solarReady, setSolarReady] = useState(false);
  const [safeMoveActive, setSafeMoveActive] = useState(false);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3) as 1 | 2 | 3);
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // If user isn't logged in, we shouldn't allow this, but for scaffolding we'll pass if not strictly required
      // The DB requires poster_id. If no user, it will fail RLS unless we handle it.
      // Assuming a logged in user for this flow.
      if (!user) {
        alert("You must be logged in to post a space.");
        router.push("/login");
        return;
      }

      const { error } = await supabase.from('listings').insert({
        poster_id: user.id,
        transaction_type: listingType,
        category: category || 'apartment',
        region,
        neighborhood,
        gps_address: gpsAddress,
        base_rent: baseRent ? parseFloat(baseRent) : null,
        service_charge: serviceCharge ? parseFloat(serviceCharge) : null,
        outright_price: outrightPrice ? parseFloat(outrightPrice) : null,
        legal_status: legalStatus,
        generator_backup: generatorBackup,
        solar_ready: solarReady,
        safemove_active: safeMoveActive,
        status: 'active'
      });

      if (error) throw error;

      // Redirect upon success
      if (listingType === "rent") {
        router.push("/rentals");
      } else {
        router.push("/sales");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      alert(error.message || "Failed to submit space");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary py-12 px-6 pb-24">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-navy-base mb-2">Post a Space</h1>
          <p className="text-gray-600">Join Ghana&apos;s most trusted real estate network.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-navy-base rounded-full z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          ></div>
          
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? "bg-navy-base text-white" : "bg-white text-gray-400 border-2 border-gray-200"
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Wizard Container */}
        <div className="bg-white rounded-md shadow-ambient border border-gray-100 p-6 md:p-10 mb-8 transition-all duration-300">
          
          {/* STEP 1: Essentials Dashboard */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-navy-base mb-6">Essentials Dashboard</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-navy-base mb-3">Listing Type</label>
                  <div className="flex bg-surface-primary p-1 rounded-sm border border-gray-200">
                    <button 
                      onClick={() => setListingType("rent")}
                      className={`flex-1 py-3 text-sm font-bold rounded-sm transition-all ${
                        listingType === "rent" ? "bg-navy-base text-white shadow-sm" : "text-gray-500 hover:text-navy-base"
                      }`}
                    >
                      For Rent
                    </button>
                    <button 
                      onClick={() => setListingType("sale")}
                      className={`flex-1 py-3 text-sm font-bold rounded-sm transition-all ${
                        listingType === "sale" ? "bg-navy-base text-white shadow-sm" : "text-gray-500 hover:text-navy-base"
                      }`}
                    >
                      For Sale
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-navy-base mb-2">Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                    >
                      <option value="">Select Category...</option>
                      <option value="apartment">Apartment / Flat</option>
                      <option value="house">House / Villa</option>
                      <option value="single_room">Single Room</option>
                      <option value="land">Land / Plot</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-navy-base mb-2">Region</label>
                    <select 
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                    >
                      <option value="">Select Region...</option>
                      <option value="greater_accra">Greater Accra</option>
                      <option value="ashanti">Ashanti Region</option>
                      <option value="central">Central Region</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-navy-base mb-2">Neighborhood</label>
                    <input 
                      type="text" 
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="e.g., East Legon, Cantoments" 
                      className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-navy-base mb-2">Ghana Post GPS Address</label>
                    <input 
                      type="text" 
                      value={gpsAddress}
                      onChange={(e) => setGpsAddress(e.target.value)}
                      placeholder="e.g., GA-123-4567" 
                      className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                    />
                    <p className="text-xs text-gray-400 mt-1">Required for accurate verification.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Pricing Transparency Card */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-navy-base mb-6">Pricing Transparency Card</h2>
              
              <div className="space-y-6">
                {listingType === "rent" ? (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Base Rent (GHS) per month</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₵</span>
                        <input 
                          type="number" 
                          value={baseRent}
                          onChange={(e) => setBaseRent(e.target.value)}
                          placeholder="0.00" 
                          className="w-full bg-surface-primary border border-gray-200 rounded-sm pl-10 pr-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Recurring Service Charge (GHS) per month</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₵</span>
                        <input 
                          type="number" 
                          value={serviceCharge}
                          onChange={(e) => setServiceCharge(e.target.value)}
                          placeholder="0.00" 
                          className="w-full bg-surface-primary border border-gray-200 rounded-sm pl-10 pr-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Enter 0 if inclusive or none.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Outright Total Price (GHS)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₵</span>
                        <input 
                          type="number" 
                          value={outrightPrice}
                          onChange={(e) => setOutrightPrice(e.target.value)}
                          placeholder="0.00" 
                          className="w-full bg-surface-primary border border-gray-200 rounded-sm pl-10 pr-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Legal Status</label>
                      <select 
                        value={legalStatus}
                        onChange={(e) => setLegalStatus(e.target.value)}
                        className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                      >
                        <option value="">Select Legal Status...</option>
                        <option value="titled">Titled & Registered</option>
                        <option value="indenture">Indenture Only</option>
                        <option value="unregistered">Unregistered</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-1">Only 'Titled & Registered' properties receive the Verified Title Badge.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Utilities & Escrow Integration */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-navy-base mb-6">Utilities & Escrow Integration</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-navy-base mb-4">Infrastructure Essentials</h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`relative flex items-center justify-center w-6 h-6 border-2 rounded-[4px] transition-colors bg-surface-primary ${generatorBackup ? "border-navy-base" : "border-gray-300 group-hover:border-navy-base"}`}>
                        <input 
                          type="checkbox" 
                          checked={generatorBackup}
                          onChange={(e) => setGeneratorBackup(e.target.checked)}
                          className="absolute opacity-0 w-full h-full cursor-pointer peer" 
                        />
                        <svg className={`w-4 h-4 text-navy-base transition-opacity ${generatorBackup ? "opacity-100" : "opacity-0"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-base text-gray-700 font-medium">Generator / Plant Backup</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`relative flex items-center justify-center w-6 h-6 border-2 rounded-[4px] transition-colors bg-surface-primary ${solarReady ? "border-navy-base" : "border-gray-300 group-hover:border-navy-base"}`}>
                        <input 
                          type="checkbox" 
                          checked={solarReady}
                          onChange={(e) => setSolarReady(e.target.checked)}
                          className="absolute opacity-0 w-full h-full cursor-pointer peer" 
                        />
                        <svg className={`w-4 h-4 text-navy-base transition-opacity ${solarReady ? "opacity-100" : "opacity-0"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-base text-gray-700 font-medium">Solar Ready</span>
                    </label>
                  </div>
                </div>

                {/* SafeMove Callout Container */}
                <div className={`p-6 rounded-md border-2 transition-all ${safeMoveActive ? "border-accent-emerald bg-accent-emerald/5" : "border-gray-200 bg-surface-primary"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className={`w-6 h-6 ${safeMoveActive ? "text-accent-emerald" : "text-gray-400"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-lg font-bold text-navy-base">SafeMove Escrow Protection</h3>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4">
                        Enable SafeMove to allow tenants to pay their advance into a secure escrow account. The funds are held safely and only released to you after the tenant successfully moves in, boosting listing trust and conversion.
                      </p>
                    </div>
                    
                    {/* Toggle Switch */}
                    <div className="mt-1">
                      <button 
                        onClick={() => setSafeMoveActive(!safeMoveActive)}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${safeMoveActive ? "bg-accent-emerald" : "bg-gray-300"}`}
                      >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${safeMoveActive ? "translate-x-6" : "translate-x-0"}`}></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <button 
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className={`px-6 py-3 font-bold rounded-sm transition-colors ${
              (step === 1 || isSubmitting) ? "text-gray-400 cursor-not-allowed" : "text-navy-base border border-gray-300 hover:bg-white"
            }`}
          >
            Back
          </button>
          
          <button 
            onClick={() => {
              if (step < 3) {
                nextStep();
              } else {
                handleSubmit();
              }
            }}
            disabled={isSubmitting}
            className={`px-8 py-3 bg-accent-gold text-navy-base font-bold rounded-sm hover:bg-accent-gold/90 transition-colors shadow-sm ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? "Submitting..." : step === 3 ? "Submit Space" : "Next"}
          </button>
        </div>

      </div>
    </div>
  );
}
