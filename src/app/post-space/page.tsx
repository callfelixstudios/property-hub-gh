// Verified GitHub Author Config
// Supabase insert integration verified
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import imageCompression from 'browser-image-compression';
import { ghanaLocations, regionToLocationKey } from "@/data/ghanaLocations";
import { RESIDENTIAL_CATEGORIES, COMMERCIAL_CATEGORIES } from "@/data/propertyCategories";
import { GHANA_REGIONS } from "@/constants/locations";
import { normalizeRegionForDb } from '@/utils/regionMapper';
import { Combobox } from "@/components/ui/Combobox";
import { getConfigData } from '@/app/actions/configActions';

const REGION_LABELS: Record<string, string> = {
  greater_accra:  "Greater Accra Region",
  ashanti:        "Ashanti Region",
  central:        "Central Region",
  ahafo:          "Ahafo Region",
  bono:           "Bono Region",
  bono_east:      "Bono East Region",
  eastern:        "Eastern Region",
  north_east:     "North East Region",
  northern:       "Northern Region",
  oti:            "Oti Region",
  savannah:       "Savannah Region",
  upper_east:     "Upper East Region",
  upper_west:     "Upper West Region",
  volta:          "Volta Region",
  western:        "Western Region",
  western_north:  "Western North Region",
};

export default function PostSpaceWizard() {
  const supabase = createClient();
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login?message=Please%20log%20in%20or%20register%20an%20account%20to%20list%20a%20space");
      }
    });
  }, []);

  const [dynamicRegions, setDynamicRegions] = useState<any[]>([]);
  const [dynamicLocations, setDynamicLocations] = useState<Record<string, string[]>>({});
  const [dynamicAmenities, setDynamicAmenities] = useState<any[]>([]);

  useEffect(() => {
    async function loadConfig() {
      const data = await getConfigData();
      if (data) {
        setDynamicRegions([...GHANA_REGIONS]);
        
        const locs: Record<string, string[]> = {};
        GHANA_REGIONS.forEach(r => {
          locs[r] = (data.neighborhoods || [])
            .filter((n: any) => n.region === r)
            .map((n: any) => n.name);
        });
        
        setDynamicLocations(locs);
        setDynamicAmenities(data.amenities || []);
      }
    }
    loadConfig();
  }, []);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 State
  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [listingCategoryType, setListingCategoryType] = useState<"residential" | "commercial">("residential");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [gpsAddress, setGpsAddress] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [furnishingStatus, setFurnishingStatus] = useState("");
  const [landSize, setLandSize] = useState("");
  const [landUnit, setLandUnit] = useState<string>('Plots');
  const [landUse, setLandUse] = useState("");
  const [propertySize, setPropertySize] = useState("");
  const [sizeUnit, setSizeUnit] = useState<string>('m²');
  const [parkingCapacity, setParkingCapacity] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [posterRole, setPosterRole] = useState<"owner" | "agent" | "">("")
  const [conditionValue, setConditionValue] = useState("");
  const [parkingSpace, setParkingSpace] = useState("");

  const isLand = category === 'Plot of Land';
  const isCommercial = listingCategoryType === 'commercial' || ['Commercial Property / Office'].includes(category);
  const isResidential = !isLand && !isCommercial;



  const AMENITIES_LIST = dynamicAmenities.length > 0 
    ? dynamicAmenities
        .filter(a => a.category === (isLand ? 'land' : isCommercial ? 'commercial' : 'residential'))
        .map(a => a.name)
    : (isResidential 
        ? ["Air Conditioning", "Standby Generator / Plant", "Solar Power System", "Water Reservoir (Polytank)", "24/7 Security", "Fitted Kitchen Cabinets", "Prepaid Meter", "Walled & Gated"]
        : isCommercial 
          ? ["Air Conditioning", "Standby Generator / Plant", "Solar Power System", "Water Reservoir (Polytank)", "24/7 Security", "Fitted Kitchen Cabinets", "Prepaid Meter", "Walled & Gated"]
          : ["Fenced / Walled Compound", "Tarred / Graded Road Access", "Electricity Grid Connected", "Water Pipe Connected", "Registered Indenture / Title Docs", "Non-Waterlogged Area"]);

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setSelectedAmenities([]);
  };

  const handleCategoryTypeChange = (type: 'residential' | 'commercial') => {
    setListingCategoryType(type);
    setCategory('');
    setSelectedAmenities([]);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  // Step 2 State
  const [baseRent, setBaseRent] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [outrightPrice, setOutrightPrice] = useState("");
  const [legalStatus, setLegalStatus] = useState("");
  const [advancePeriod, setAdvancePeriod] = useState("");
  const [customMonths, setCustomMonths] = useState<number>(0);
  const [viewingFee, setViewingFee] = useState("");
  const [agencyCommission, setAgencyCommission] = useState("");

  // Utility: convert raw month count into a human-readable advance label
  const getAdvanceLabel = (months: number): string => {
    if (months <= 0) return "None";
    if (months <= 12) return `${months} ${months > 1 ? 'Months' : 'Month'} Advance`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths === 0
      ? `${years} ${years > 1 ? 'Years' : 'Year'} Advance`
      : `${years} ${years > 1 ? 'Years' : 'Year'}, ${remainingMonths} ${remainingMonths > 1 ? 'Months' : 'Month'} Advance`;
  };

  // Step 3 State  
  const [safeMoveActive, setSafeMoveActive] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState("");

  const compressionOptions = {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: 'image/webp' as const,
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (incoming.length === 0) return;

    setIsCompressing(true);
    try {
      const compressed: File[] = [];
      for (const file of incoming) {
        try {
          const result = await imageCompression(file, compressionOptions);
          compressed.push(new File([result], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
        } catch {
          // Fallback: try jpeg if webp fails
          try {
            const fallback = await imageCompression(file, { ...compressionOptions, fileType: 'image/jpeg' as const });
            compressed.push(new File([fallback], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } catch {
            compressed.push(file); // Use original if all compression fails
          }
        }
      }
      const combined = [...imageFiles, ...compressed].slice(0, 6);
      setImageFiles(combined);
      setImagePreviews(combined.map(f => URL.createObjectURL(f)));
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(updatedFiles);
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(updatedFiles.map(f => URL.createObjectURL(f)));
  };

  const moveImageLeft = (index: number) => {
    if (index <= 0) return;
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    [newPreviews[index - 1], newPreviews[index]] = [newPreviews[index], newPreviews[index - 1]];
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const moveImageRight = (index: number) => {
    if (index >= imageFiles.length - 1) return;
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    [newPreviews[index], newPreviews[index + 1]] = [newPreviews[index + 1], newPreviews[index]];
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3) as 1 | 2 | 3);
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("You must be logged in to post a space.");
        router.push("/login");
        return;
      }

      // --- Image Upload Pipeline ---
      const uploadedUrls: string[] = [];

      for (const file of imageFiles) {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${user.id}/${Date.now()}-${sanitizedName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.error('Image upload failed:', uploadError);
          alert(`Failed to upload image "${file.name}": ${uploadError.message}`);
          setIsSubmitting(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      // --- Database Insert ---
      // Payload sanitized: 'id' removed for auto-generation, 
      // Session correctly bound to 'poster_id', 
      // Image array cleanly mapped to 'media_urls'
      // Derive rent_advance_months from advance period selection
      let rentAdvanceMonths = 1;
      if (advancePeriod === 'Custom...') {
        rentAdvanceMonths = customMonths || 1;
      } else if (advancePeriod === '3 Months Advance') {
        rentAdvanceMonths = 3;
      } else if (advancePeriod === '6 Months Advance') {
        rentAdvanceMonths = 6;
      } else if (advancePeriod === '1 Year Advance') {
        rentAdvanceMonths = 12;
      } else if (advancePeriod === '2 Years Advance') {
        rentAdvanceMonths = 24;
      }

      const { data: inserted, error } = await supabase.from('listings').insert({
        poster_id: user.id,
        transaction_type: listingType,
        listing_category_type: listingCategoryType,
        title: title || null,
        description: description || null,
        category: category || 'Apartment',
        region: normalizeRegionForDb(region) || region || null,
        neighborhood: neighborhood || null,
        gps_address: gpsAddress || null,
        base_rent: parseInt(baseRent, 10) || 0,
        service_charge: parseInt(serviceCharge, 10) || 0,
        outright_price: parseInt(outrightPrice, 10) || 0,
        legal_status: legalStatus || null,
        advance_period: advancePeriod === 'Custom...' ? getAdvanceLabel(customMonths) : (advancePeriod || null),
        rent_advance_months: listingType === 'rent' ? rentAdvanceMonths : null,
        currency: 'GHS',
        generator_backup: false,
        solar_ready: false,
        safemove_active: safeMoveActive,
        media_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
        video_url: videoUrl || null,
        status: 'active',
        bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
        bathrooms: bathrooms ? parseInt(bathrooms, 10) : null,
        furnishing_status: furnishingStatus || null,
        condition: conditionValue || null,
        parking_space: parkingSpace || null,
        land_size: landSize ? `${landSize} ${landUnit}` : null,
        land_use: landUse || null,
        square_meters: sizeUnit === 'Acres' ? (propertySize ? parseFloat(propertySize) * 4046.86 : null) : (propertySize ? parseFloat(propertySize) : null),
        parking_capacity: parkingCapacity ? parseInt(parkingCapacity, 10) : null,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : null,
        poster_role: posterRole || null,
        viewing_fee: viewingFee !== "" ? parseInt(viewingFee, 10) : null,
        agency_commission_percentage: agencyCommission !== "" ? parseFloat(agencyCommission) : null,
      }).select('id');

      if (error) throw error;

      // Fire-and-forget: geocode region/neighborhood into lat/lng
      const listingId = inserted?.[0]?.id;
      if (listingId && region && neighborhood) {
        const regionName = REGION_LABELS[region] || region;
        const geoQuery = `${neighborhood}, ${regionName}, Ghana`;
        fetch(`/api/geocode?q=${encodeURIComponent(geoQuery)}`)
          .then(r => r.json())
          .then(data => {
            if (data && data.length > 0) {
              supabase
                .from('listings')
                .update({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) })
                .eq('id', listingId)
                .then(() => {});
            }
          })
          .catch(() => {});
      }

      // Redirect upon success
      if (listingType === "rent") {
        router.push("/rentals");
      } else {
        router.push("/sales");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      const errorMessage = error?.message || error?.error_description || "Failed to submit space. Check console for details.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary pt-28 px-6 pb-24">
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

                <div>
                  <label className="block text-sm font-bold text-navy-base mb-3">Category</label>
                  <div className="flex bg-surface-primary p-1 rounded-sm border border-gray-200">
                    <button 
                      onClick={() => handleCategoryTypeChange("residential")}
                      className={`flex-1 py-3 text-sm font-bold rounded-sm transition-all ${
                        listingCategoryType === "residential" ? "bg-navy-base text-white shadow-sm" : "text-gray-500 hover:text-navy-base"
                      }`}
                    >
                      Residential
                    </button>
                    <button 
                      onClick={() => handleCategoryTypeChange("commercial")}
                      className={`flex-1 py-3 text-sm font-bold rounded-sm transition-all ${
                        listingCategoryType === "commercial" ? "bg-navy-base text-white shadow-sm" : "text-gray-500 hover:text-navy-base"
                      }`}
                    >
                      Commercial
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-navy-base mb-2">Listing Title <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Modern 3 Bedroom House in Cantonments"
                      className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-navy-base mb-2">Description</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the property, features, and any other important details..."
                      rows={4}
                      className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors resize-y"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-navy-base mb-2">Property Type</label>
                    <select 
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                    >
                      <option value="">Select Property Type...</option>
                      {listingCategoryType === 'residential' 
                        ? RESIDENTIAL_CATEGORIES.map(type => <option key={type} value={type}>{type}</option>)
                        : COMMERCIAL_CATEGORIES.map(type => <option key={type} value={type}>{type}</option>)
                      }
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-navy-base mb-2">Region</label>
                    <select 
                      value={region}
                      onChange={(e) => {
                        setRegion(e.target.value);
                        setNeighborhood("");
                      }}
                      className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                    >
                      <option value="">Select Region...</option>
                      {dynamicRegions.length > 0 
                        ? dynamicRegions.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)
                        : Object.entries(REGION_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label.replace(' Region', '')}</option>
                          ))
                      }
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-navy-base mb-2">Neighborhood</label>
                    <Combobox
                      options={region ? (dynamicLocations[region] || ghanaLocations[regionToLocationKey[region]] || []) : []}
                      value={neighborhood}
                      onChange={setNeighborhood}
                      disabled={!region}
                      placeholder="e.g., East Legon, Cantonments"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-navy-base mb-2">Nearest Landmark or Location Description</label>
                    <input 
                      type="text" 
                      value={gpsAddress}
                      onChange={(e) => setGpsAddress(e.target.value)}
                      placeholder="e.g., Near East Legon Starbites" 
                      className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                    />
                    <p className="text-xs text-gray-400 mt-1">Required for accurate property localization.</p>
                  </div>
                </div>

                <div className="mt-2">
                  <label className="block text-sm font-bold text-navy-base mb-3">Are you listing this property as the Owner or an Agent?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPosterRole('owner')}
                      className={`relative flex items-center justify-center p-4 border-2 rounded-xl transition-all duration-200 text-left hover:border-teal-300 ${posterRole === 'owner' ? 'border-teal-600 bg-teal-50/50' : 'border-gray-200 bg-surface-primary hover:bg-slate-50'}`}
                    >
                      {posterRole === 'owner' && (
                        <div className="absolute top-3 right-3 text-teal-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <span className={`font-bold text-lg ${posterRole === 'owner' ? 'text-teal-900' : 'text-navy-base'}`}>Property Owner</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosterRole('agent')}
                      className={`relative flex items-center justify-center p-4 border-2 rounded-xl transition-all duration-200 text-left hover:border-teal-300 ${posterRole === 'agent' ? 'border-teal-600 bg-teal-50/50' : 'border-gray-200 bg-surface-primary hover:bg-slate-50'}`}
                    >
                      {posterRole === 'agent' && (
                        <div className="absolute top-3 right-3 text-teal-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <span className={`font-bold text-lg ${posterRole === 'agent' ? 'text-teal-900' : 'text-navy-base'}`}>Real Estate Agent</span>
                    </button>
                  </div>
                </div>

                {/* Property conditional attributes and amenities moved to Step 3 */}

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
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Advance Period</label>
                      <div className={`grid gap-4 ${advancePeriod === 'Custom...' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                        <select 
                          value={advancePeriod}
                          onChange={(e) => { setAdvancePeriod(e.target.value); if (e.target.value !== 'Custom...') setCustomMonths(0); }}
                          className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                        >
                          <option value="">Select Advance Period...</option>
                          <option value="None">None</option>
                          <option value="3 Months Advance">3 Months</option>
                          <option value="6 Months Advance">6 Months</option>
                          <option value="1 Year Advance">1 Year</option>
                          <option value="2 Years Advance">2 Years</option>
                          <option value="Custom...">Custom...</option>
                        </select>
                        {advancePeriod === 'Custom...' && (
                          <div className="relative">
                            <input 
                              type="number" 
                              min={1}
                              max={120}
                              value={customMonths || ''}
                              onChange={(e) => setCustomMonths(Math.max(0, parseInt(e.target.value, 10) || 0))}
                              placeholder="e.g. 18"
                              className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">months</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {advancePeriod === 'Custom...' && customMonths > 0
                          ? `Will be saved as: ${getAdvanceLabel(customMonths)}`
                          : 'Select the standard rental advance duration required.'}
                      </p>
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
                      <p className="text-xs text-gray-400 mt-1">Only &apos;Titled &amp; Registered&apos; properties receive the Verified Title Badge.</p>
                    </div>
                  </>
                )}

                {/* ── Viewing Fee (Common) ── */}
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-bold text-navy-base mb-2">
                    Viewing Fee (GHS)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₵</span>
                    <input
                      type="number"
                      value={viewingFee}
                      onChange={(e) => setViewingFee(e.target.value)}
                      placeholder="Leave blank = Undisclosed • Enter 0 = Free Viewing"
                      className="w-full bg-surface-primary border border-gray-200 rounded-sm pl-10 pr-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Set to 0 to display a &quot;Zero Viewing Fee&quot; trust badge on the listing.
                  </p>
                </div>

                {/* ── Agency Commission (Agent Only) ── */}
                {posterRole === 'agent' && (
                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-navy-base mb-2">
                      Agency Commission (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={agencyCommission}
                        onChange={(e) => setAgencyCommission(e.target.value)}
                        placeholder="e.g. 5 for 5%"
                        className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Leave blank to keep undisclosed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Infrastructure & Trust */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-navy-base mb-6">Infrastructure & Trust</h2>
              
              <div className="space-y-8">

                {/* Conditional Property Details */}
                {isLand ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Land Size / Area</label>
                      <div className="relative mt-1 rounded-sm shadow-sm">
                        <input
                          type="number"
                          value={landSize}
                          onChange={(e) => setLandSize(e.target.value)}
                          placeholder={landUnit === 'Plots' ? 'e.g., 1' : landUnit === 'Acres' ? 'e.g., 2.5' : 'e.g., 500'}
                          className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors pr-24"
                          min="0"
                          step="any"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                          <select
                            value={landUnit}
                            onChange={(e) => setLandUnit(e.target.value)}
                            className="h-full rounded-md border-0 bg-transparent py-0 pl-2 pr-8 text-xs font-semibold text-slate-500 focus:outline-none focus:ring-0 cursor-pointer"
                          >
                            <option value="Plots">Plots</option>
                            <option value="Acres">Acres</option>
                            <option value="m²">m²</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Land Use Classification</label>
                      <select 
                        value={landUse} 
                        onChange={(e) => setLandUse(e.target.value)}
                        className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                      >
                        <option value="">Select...</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Mixed-Use">Mixed-Use</option>
                        <option value="Agricultural">Agricultural</option>
                      </select>
                    </div>
                  </div>
                                 ) : isCommercial ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Property Size / Area</label>
                      <div className="relative mt-1 rounded-sm shadow-sm">
                        <input 
                          type="number" 
                          value={propertySize} 
                          onChange={(e) => setPropertySize(e.target.value)} 
                          placeholder={sizeUnit === 'm²' ? 'e.g., 120' : 'e.g., 2.5'}
                          className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors pr-20"
                          min="0"
                          step="any"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                          <select
                            value={sizeUnit}
                            onChange={(e) => setSizeUnit(e.target.value)}
                            className="h-full rounded-md border-0 bg-transparent py-0 pl-2 pr-8 text-xs font-semibold text-slate-500 focus:outline-none focus:ring-0 cursor-pointer"
                          >
                            <option value="m²">m²</option>
                            <option value="Acres">Acres</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Bathrooms / Washrooms</label>
                      <select 
                        value={bathrooms} 
                        onChange={(e) => setBathrooms(e.target.value)} 
                        className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                      >
                        <option value="">Select...</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                        <option value="10+">10+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Parking Capacity</label>
                      <input 
                        type="number" 
                        value={parkingCapacity} 
                        onChange={(e) => setParkingCapacity(e.target.value)} 
                        placeholder="e.g. 15"
                        className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Bedrooms</label>
                      <select 
                        value={bedrooms} 
                        onChange={(e) => setBedrooms(e.target.value)} 
                        className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                      >
                        <option value="">Select...</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                        <option value="10+">10+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Bathrooms</label>
                      <select 
                        value={bathrooms} 
                        onChange={(e) => setBathrooms(e.target.value)} 
                        className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                      >
                        <option value="">Select...</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                        <option value="10+">10+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Property Size / Area</label>
                      <div className="relative mt-1 rounded-sm shadow-sm">
                        <input
                          type="number"
                          value={propertySize}
                          onChange={(e) => setPropertySize(e.target.value)}
                          placeholder={sizeUnit === 'm²' ? 'e.g., 120' : 'e.g., 2.5'}
                          className="w-full rounded-sm border border-gray-200 bg-surface-primary px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors pr-20"
                          min="0"
                          step="any"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                          <select
                            value={sizeUnit}
                            onChange={(e) => setSizeUnit(e.target.value)}
                            className="h-full rounded-md border-0 bg-transparent py-0 pl-2 pr-8 text-xs font-semibold text-slate-500 focus:outline-none focus:ring-0 cursor-pointer"
                          >
                            <option value="m²">m²</option>
                            <option value="Acres">Acres</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-navy-base mb-2">Furnishing Status</label>
                      <select 
                        value={furnishingStatus} 
                        onChange={(e) => setFurnishingStatus(e.target.value)}
                        className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                      >
                        <option value="">Select...</option>
                        <option value="Unfurnished">Unfurnished</option>
                        <option value="Semi-Furnished">Semi-Furnished</option>
                        <option value="Fully Furnished">Fully Furnished</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="mt-6 mb-8">
                  <label className="block text-sm font-bold text-navy-base mb-3">Condition</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'newly_built', label: 'Newly Built' },
                      { id: 'fairly_used', label: 'Fairly Used' },
                      { id: 'old', label: 'Old' },
                      { id: 'uncompleted', label: 'Uncompleted' },
                      { id: 'under_construction', label: 'Under Construction' }
                    ].map(cond => (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => setConditionValue(cond.id)}
                        className={`px-4 py-2 border rounded-full text-sm font-medium transition-all ${
                          conditionValue === cond.id 
                            ? 'bg-navy-base text-white border-transparent shadow-sm' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-navy-light hover:text-navy-base'
                        }`}
                      >
                        {cond.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 mb-8">
                  <label className="block text-sm font-bold text-navy-base mb-3">Parking Space</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'in_house', label: 'In House' },
                      { id: 'street_side', label: 'Street Side' },
                      { id: 'no_parking', label: 'No Parking Space' }
                    ].map(park => (
                      <button
                        key={park.id}
                        type="button"
                        onClick={() => setParkingSpace(park.id)}
                        className={`px-4 py-2 border rounded-full text-sm font-medium transition-all ${
                          parkingSpace === park.id 
                            ? 'bg-navy-base text-white border-transparent shadow-sm' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-navy-light hover:text-navy-base'
                        }`}
                      >
                        {park.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-6 mb-8">
                  <label className="block text-sm font-bold text-navy-base mb-3">Amenities & Features</label>
                  <div className="flex flex-wrap gap-3">
                    {AMENITIES_LIST.map(amenity => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-4 py-2 border rounded-full text-sm font-medium transition-all ${
                          selectedAmenities.includes(amenity) 
                            ? 'bg-navy-base text-white border-transparent shadow-sm' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-navy-light hover:text-navy-base'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Images Dropzone */}
                <div>
                  <h3 className="text-sm font-bold text-navy-base mb-4">Property Images</h3>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFilesSelected(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? 'border-navy-base bg-navy-base/5'
                        : 'border-gray-300 bg-surface-primary hover:border-navy-light hover:bg-slate-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFilesSelected(e.target.files)}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-navy-base/10' : 'bg-gray-100'}`}>
                        <svg className={`w-7 h-7 ${isDragging ? 'text-navy-base' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy-base">Drag & drop images here</p>
                        <p className="text-xs text-gray-400 mt-1">or click to browse • Up to 6 photos • Auto-compressed to WebP</p>
                      </div>
                      {isCompressing && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-navy-base font-medium">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                          Compressing images…
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Previews with Re-ordering */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Drag position to re-order. First image = marketplace cover photo.</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {imagePreviews.map((src, i) => (
                          <div key={i} className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-accent-gold shadow-md' : 'border-gray-200'}`}>
                            <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                              className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            {/* Re-ordering controls */}
                            {imagePreviews.length > 1 && (
                              <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {i > 0 && (
                                  <button type="button" onClick={(e) => { e.stopPropagation(); moveImageLeft(i); }}
                                    className="w-5 h-5 bg-black/60 hover:bg-navy-base text-white rounded flex items-center justify-center text-[10px] font-bold">←</button>
                                )}
                                {i < imagePreviews.length - 1 && (
                                  <button type="button" onClick={(e) => { e.stopPropagation(); moveImageRight(i); }}
                                    className="w-5 h-5 bg-black/60 hover:bg-navy-base text-white rounded flex items-center justify-center text-[10px] font-bold">→</button>
                                )}
                              </div>
                            )}
                            {/* Cover badge */}
                            {i === 0 && (
                              <span className="absolute bottom-1 left-1 bg-accent-gold text-navy-base text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">Cover Photo</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Walkthrough URL */}
                <div>
                  <h3 className="text-sm font-bold text-navy-base mb-2">🎥 Video Walkthrough Tour (YouTube or Vimeo Link)</h3>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="e.g., https://www.youtube.com/watch?v=..."
                    className="w-full bg-surface-primary border border-gray-200 rounded-sm px-4 py-3 text-navy-base outline-none focus:border-navy-light transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1">Optional. Paste a YouTube or Vimeo link to show a video tour on your listing page.</p>
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
