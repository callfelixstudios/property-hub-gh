"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import imageCompression from 'browser-image-compression';
import { ghanaLocations, regionToLocationKey } from "@/data/ghanaLocations";
import { 
  RESIDENTIAL_CATEGORIES,
  COMMERCIAL_CATEGORIES
} from "@/data/propertyCategories";
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

interface Listing {
  id: string;
  title: string;
  status: string;
  transaction_type: 'rent' | 'sale';
  base_rent?: number;
  outright_price?: number;
  service_charge?: number;
  safemove_active?: boolean;
  safemove_enabled?: boolean;
  views?: number;
  description?: string;
  category?: string;
  region?: string;
  neighborhood?: string;
  gps_address?: string;
  bedrooms?: number;
  bathrooms?: number;
  furnishing_status?: string;
  land_size?: string;
  land_use?: string;
  square_meters?: number;
  parking_capacity?: number;
  amenities?: string[];
  poster_role?: 'owner' | 'agent';
  advance_period?: string;
  legal_status?: string;
  media_urls?: string[];
  video_url?: string | null;
  currency?: string;
  rent_advance_months?: number;
  listing_category_type?: 'residential' | 'commercial';
  condition?: string;
  parking_space?: string;
  is_verified?: boolean;
  [key: string]: unknown;
}

interface EditListingModalProps {
  listing: Listing;
  userId: string;
  onClose: () => void;
  onSaved: (updatedListing: Listing) => void;
}

export default function EditListingModal({ listing, userId, onClose, onSaved }: EditListingModalProps) {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSaving, setIsSaving] = useState(false);

  // Phase 3: Dynamic Config
  const [dynamicRegions, setDynamicRegions] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [dynamicLocations, setDynamicLocations] = useState<Record<string, string[]>>({});
  const [dynamicAmenities, setDynamicAmenities] = useState<{ id: string; name: string; category: string }[]>([]);

  React.useEffect(() => {
    async function loadConfig() {
      const data = await getConfigData();
        setDynamicRegions(GHANA_REGIONS.map(r => ({ id: r, name: r, slug: r })));
        const locs: Record<string, string[]> = {};
        GHANA_REGIONS.forEach(r => {
          locs[r] = (data.neighborhoods || [])
            .filter((n: { name: string; region: string }) => n.region === r)
            .map((n: { name: string; region: string }) => n.name);
        });
      setDynamicLocations(locs);
      setDynamicAmenities(data.amenities || []);
    }
    loadConfig();
  }, []);

  // ── Step 1 State: Essentials ──
  const [listingType, setListingType] = useState<"rent" | "sale">(listing.transaction_type || "rent");
  const [title, setTitle] = useState(listing.title || "");
  const [description, setDescription] = useState(listing.description || "");
  const [category, setCategory] = useState(listing.category || "");
  const [region, setRegion] = useState(listing.region || "");
  const [neighborhood, setNeighborhood] = useState(listing.neighborhood || "");
  const [gpsAddress, setGpsAddress] = useState(listing.gps_address || "");
  const [bedrooms, setBedrooms] = useState(listing.bedrooms?.toString() || "");
  const [bathrooms, setBathrooms] = useState(listing.bathrooms?.toString() || "");
  const [furnishingStatus, setFurnishingStatus] = useState(listing.furnishing_status || "");

  const extractLandData = (rawLandSize: string | null | undefined) => {
    if (!rawLandSize) return { size: "", unit: "Plots" };
    const cleanString = String(rawLandSize).trim();
    const match = cleanString.match(/^([\d.]+)\s*(.*)$/);
    if (match) {
      return {
        size: match[1],
        unit: match[2] || "Plots"
      };
    }
    return { size: cleanString, unit: "Plots" };
  };

  const landData = extractLandData(listing.land_size);
  const [landSize, setLandSize] = useState<string>(landData.size);
  const [landUnit, setLandUnit] = useState<string>(landData.unit);
  const [landUse, setLandUse] = useState(listing.land_use || "");
  const [propertySize, setPropertySize] = useState(listing.square_meters?.toString() || "");
  const [sizeUnit, setSizeUnit] = useState<string>('m²');
  const [parkingCapacity, setParkingCapacity] = useState(listing.parking_capacity?.toString() || "");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(listing.amenities || []);
  const [posterRole, setPosterRole] = useState<"owner" | "agent" | "">(listing.poster_role || "");
  const [listingCategoryType, setListingCategoryType] = useState<'residential' | 'commercial'>(listing.listing_category_type || 'residential');
  const [conditionValue, setConditionValue] = useState(listing.condition || '');
  const [parkingSpace, setParkingSpace] = useState(listing.parking_space || '');

  const isLand = category === 'Plot of Land';
  const isCommercial = listingCategoryType === 'commercial' || ['Commercial Property / Office'].includes(category);
  const isResidential = !isLand && !isCommercial;

  const AMENITIES_LIST = dynamicAmenities.length > 0 
    ? dynamicAmenities
        .filter(a => a.category === (isLand ? 'land' : isCommercial ? 'commercial' : 'residential'))
        .map(a => String(a.name))
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

  // ── Step 2 State: Pricing ──
  const [baseRent, setBaseRent] = useState(listing.base_rent?.toString() || "");
  const [serviceCharge, setServiceCharge] = useState(listing.service_charge?.toString() || "");
  const [outrightPrice, setOutrightPrice] = useState(listing.outright_price?.toString() || "");
  const [legalStatus, setLegalStatus] = useState(listing.legal_status || "");
  const [advancePeriod, setAdvancePeriod] = useState(listing.advance_period || "");
  const [customMonths, setCustomMonths] = useState<number>(0);

  const getAdvanceLabel = (months: number): string => {
    if (months <= 0) return "None";
    if (months <= 12) return `${months} ${months > 1 ? 'Months' : 'Month'} Advance`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths === 0
      ? `${years} ${years > 1 ? 'Years' : 'Year'} Advance`
      : `${years} ${years > 1 ? 'Years' : 'Year'}, ${remainingMonths} ${remainingMonths > 1 ? 'Months' : 'Month'} Advance`;
  };

  // ── Step 3 State: Media & Trust ──
  const [safeMoveActive, setSafeMoveActive] = useState(listing.safemove_active || false);
  const [editMediaUrls, setEditMediaUrls] = useState<string[]>([...(listing.media_urls || [])]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState(listing.video_url || "");

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
    const totalAllowed = 6 - editMediaUrls.length;

    setIsCompressing(true);
    try {
      const compressed: File[] = [];
      for (const file of incoming) {
        try {
          const result = await imageCompression(file, compressionOptions);
          compressed.push(new File([result], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
        } catch {
          try {
            const fallback = await imageCompression(file, { ...compressionOptions, fileType: 'image/jpeg' as const });
            compressed.push(new File([fallback], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } catch {
            compressed.push(file);
          }
        }
      }
      const combined = [...newImageFiles, ...compressed].slice(0, totalAllowed);
      setNewImageFiles(combined);
      setNewImagePreviews(combined.map(f => URL.createObjectURL(f)));
    } finally {
      setIsCompressing(false);
    }
  };

  const removeExistingImage = (index: number) => {
    setEditMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    const updatedFiles = newImageFiles.filter((_, i) => i !== index);
    setNewImageFiles(updatedFiles);
    setNewImagePreviews(updatedFiles.map(f => URL.createObjectURL(f)));
  };

  // Re-ordering helpers for existing images
  const moveExistingLeft = (index: number) => {
    if (index <= 0) return;
    const arr = [...editMediaUrls];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    setEditMediaUrls(arr);
  };
  const moveExistingRight = (index: number) => {
    if (index >= editMediaUrls.length - 1) return;
    const arr = [...editMediaUrls];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    setEditMediaUrls(arr);
  };

  // Re-ordering helpers for new images
  const moveNewLeft = (index: number) => {
    if (index <= 0) return;
    const nf = [...newImageFiles]; const np = [...newImagePreviews];
    [nf[index - 1], nf[index]] = [nf[index], nf[index - 1]];
    [np[index - 1], np[index]] = [np[index], np[index - 1]];
    setNewImageFiles(nf); setNewImagePreviews(np);
  };
  const moveNewRight = (index: number) => {
    if (index >= newImageFiles.length - 1) return;
    const nf = [...newImageFiles]; const np = [...newImagePreviews];
    [nf[index], nf[index + 1]] = [nf[index + 1], nf[index]];
    [np[index], np[index + 1]] = [np[index + 1], np[index]];
    setNewImageFiles(nf); setNewImagePreviews(np);
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3) as 1 | 2 | 3);
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3);

  // ── Submit Handler ──
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Upload any new images
      const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
      const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

      for (const file of newImageFiles) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          alert(`"${file.name}" is not a supported image type. Only JPEG, PNG or WEBP images are allowed.`);
          setIsSaving(false);
          return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          alert(`"${file.name}" exceeds the 10MB upload limit.`);
          setIsSaving(false);
          return;
        }
      }

      const uploadedNewUrls: string[] = [];
      for (const file of newImageFiles) {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${userId}/${Date.now()}-${sanitizedName}`;
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (uploadError) {
          alert(`Failed to upload image "${file.name}": ${uploadError.message}`);
          setIsSaving(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);
        uploadedNewUrls.push(publicUrlData.publicUrl);
      }

      const finalMedia = [...editMediaUrls, ...uploadedNewUrls];

      // Derive rent_advance_months
      let rentAdvanceMonths = listing.rent_advance_months || 1;
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

      const updatePayload: Record<string, unknown> = {
        transaction_type: listingType,
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
        safemove_active: safeMoveActive,
        media_urls: finalMedia.length > 0 ? finalMedia : null,
        video_url: videoUrl || null,
        bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
        bathrooms: bathrooms ? parseInt(bathrooms, 10) : null,
        furnishing_status: furnishingStatus || null,
        land_size: landSize ? `${landSize} ${landUnit}` : null,
        land_use: landUse || null,
        square_meters: sizeUnit === 'Acres' ? (propertySize ? parseFloat(propertySize) * 4046.86 : null) : (propertySize ? parseFloat(propertySize) : null),
        parking_capacity: parkingCapacity ? parseInt(parkingCapacity, 10) : null,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : null,
        poster_role: posterRole || null,
        listing_category_type: listingCategoryType,
        condition: conditionValue || null,
        parking_space: parkingSpace || null,
      };

      const { error } = await supabase
        .from('listings')
        .update(updatePayload)
        .eq('id', listing.id)
        .eq('poster_id', userId);

      if (error) {
        alert("Failed to update listing: " + error.message);
      } else {
        const wasApproved = listing.moderation_status === 'approved';
        if (wasApproved) {
          alert("Your changes have been submitted for review. The listing will go live again once approved.");
        }
        onSaved({
          ...listing,
          ...updatePayload,
          ...(wasApproved ? { status: 'pending', moderation_status: 'pending' } : {}),
        });
        router.refresh();

        // Fire-and-forget: re-geocode neighborhood into lat/lng
        const newRegion = region || listing.region;
        const newNeighborhood = neighborhood || listing.neighborhood;
        if (newRegion && newNeighborhood) {
          const regionName = REGION_LABELS[newRegion] || newRegion;
          const geoQuery = `${newNeighborhood}, ${regionName}, Ghana`;
          fetch(`/api/geocode?q=${encodeURIComponent(geoQuery)}`)
            .then(r => r.json())
            .then(data => {
              if (data && data.length > 0) {
                supabase
                  .from('listings')
                  .update({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) })
                  .eq('id', listing.id)
                  .then(() => {});
              }
            })
            .catch(() => {});
        }
      }
    } catch (error: unknown) {
      console.error("Update error:", error);
      alert((error as Error)?.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Shared input styles ──
  const inputCls = "w-full bg-slate-50 border border-gray-200 rounded-lg px-4 py-3 text-navy-base outline-none focus:border-navy-light focus:ring-1 focus:ring-navy-light/30 transition-all";
  const labelCls = "block text-sm font-bold text-navy-base mb-2";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100">

        {/* ── Modal Header ── */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-xl font-extrabold text-navy-base">Edit Listing</h3>
            <p className="text-xs text-gray-400 mt-0.5">Modify every detail of your property listing.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* ── Progress Bar ── */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between relative">
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
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] font-medium text-gray-400">Essentials</span>
            <span className="text-[10px] font-medium text-gray-400">Pricing</span>
            <span className="text-[10px] font-medium text-gray-400">Media & Trust</span>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* STEP 1: Essentials Dashboard */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <h2 className="text-xl font-bold text-navy-base">Essentials Dashboard</h2>

              <div>
                <label className={labelCls}>Listing Type</label>
                <div className="flex bg-slate-50 p-1 rounded-lg border border-gray-200">
                  <button onClick={() => setListingType("rent")} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${listingType === "rent" ? "bg-navy-base text-white shadow-sm" : "text-gray-500 hover:text-navy-base"}`}>For Rent</button>
                  <button onClick={() => setListingType("sale")} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${listingType === "sale" ? "bg-navy-base text-white shadow-sm" : "text-gray-500 hover:text-navy-base"}`}>For Sale</button>
                </div>
              </div>

              <div>
                <label className={labelCls}>Listing Title <span className="text-red-500">*</span></label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Modern 3 Bedroom House in Cantonments" className={inputCls} required />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the property, features, and any other important details..." rows={4} className={`${inputCls} resize-y`} />
              </div>

              <div>
                <label className={labelCls}>Category</label>
                <div className="flex bg-slate-50 p-1 rounded-lg border border-gray-200">
                  <button onClick={() => handleCategoryTypeChange('residential')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${listingCategoryType === 'residential' ? 'bg-navy-base text-white shadow-sm' : 'text-gray-500 hover:text-navy-base'}`}>Residential</button>
                  <button onClick={() => handleCategoryTypeChange('commercial')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${listingCategoryType === 'commercial' ? 'bg-navy-base text-white shadow-sm' : 'text-gray-500 hover:text-navy-base'}`}>Commercial</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Property Type</label>
                  <select value={category} onChange={(e) => handleCategoryChange(e.target.value)} className={inputCls}>
                    <option value="">Select Property Type...</option>
                    {listingCategoryType === 'residential'
                      ? RESIDENTIAL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                      : COMMERCIAL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                    }
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Region</label>
                  <select value={region} onChange={(e) => {
                    setRegion(e.target.value);
                    setNeighborhood("");
                  }} className={inputCls}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Neighborhood</label>
                  <Combobox
                    options={region ? (dynamicLocations[region] || ghanaLocations[regionToLocationKey[region]] || []) : []}
                    value={neighborhood}
                    onChange={setNeighborhood}
                    disabled={!region}
                    placeholder="e.g., East Legon, Cantonments"
                  />
                </div>
                <div>
                  <label className={labelCls}>Nearest Landmark or Location Description</label>
                  <input type="text" value={gpsAddress} onChange={(e) => setGpsAddress(e.target.value)} placeholder="e.g., Near East Legon Starbites" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Are you listing this property as the Owner or an Agent?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button type="button" onClick={() => setPosterRole('owner')} className={`relative flex items-center justify-center p-4 border-2 rounded-xl transition-all duration-200 hover:border-teal-300 ${posterRole === 'owner' ? 'border-teal-600 bg-teal-50/50' : 'border-gray-200 bg-slate-50 hover:bg-slate-100'}`}>
                    {posterRole === 'owner' && (<div className="absolute top-3 right-3 text-teal-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>)}
                    <span className={`font-bold text-lg ${posterRole === 'owner' ? 'text-teal-900' : 'text-navy-base'}`}>Property Owner</span>
                  </button>
                  <button type="button" onClick={() => setPosterRole('agent')} className={`relative flex items-center justify-center p-4 border-2 rounded-xl transition-all duration-200 hover:border-teal-300 ${posterRole === 'agent' ? 'border-teal-600 bg-teal-50/50' : 'border-gray-200 bg-slate-50 hover:bg-slate-100'}`}>
                    {posterRole === 'agent' && (<div className="absolute top-3 right-3 text-teal-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>)}
                    <span className={`font-bold text-lg ${posterRole === 'agent' ? 'text-teal-900' : 'text-navy-base'}`}>Real Estate Agent</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Pricing Transparency Card */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <h2 className="text-xl font-bold text-navy-base">Pricing Transparency Card</h2>

              {listingType === "rent" ? (
                <>
                  <div>
                    <label className={labelCls}>Base Rent (GHS) per month</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₵</span>
                      <input type="number" value={baseRent} onChange={(e) => setBaseRent(e.target.value)} placeholder="0.00" className={`${inputCls} pl-10`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Recurring Service Charge (GHS) per month</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₵</span>
                      <input type="number" value={serviceCharge} onChange={(e) => setServiceCharge(e.target.value)} placeholder="0.00" className={`${inputCls} pl-10`} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Enter 0 if inclusive or none.</p>
                  </div>
                  <div>
                    <label className={labelCls}>Advance Period</label>
                    <div className={`grid gap-4 ${advancePeriod === 'Custom...' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                      <select value={advancePeriod} onChange={(e) => { setAdvancePeriod(e.target.value); if (e.target.value !== 'Custom...') setCustomMonths(0); }} className={inputCls}>
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
                          <input type="number" min={1} max={120} value={customMonths || ''} onChange={(e) => setCustomMonths(Math.max(0, parseInt(e.target.value, 10) || 0))} placeholder="e.g. 18" className={inputCls} />
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
                    <label className={labelCls}>Outright Total Price (GHS)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₵</span>
                      <input type="number" value={outrightPrice} onChange={(e) => setOutrightPrice(e.target.value)} placeholder="0.00" className={`${inputCls} pl-10`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Legal Status</label>
                    <select value={legalStatus} onChange={(e) => setLegalStatus(e.target.value)} className={inputCls}>
                      <option value="">Select Legal Status...</option>
                      <option value="titled">Titled &amp; Registered</option>
                      <option value="indenture">Indenture Only</option>
                      <option value="unregistered">Unregistered</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Only &apos;Titled &amp; Registered&apos; properties receive the Verified Title Badge.</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: Infrastructure & Media */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
              <h2 className="text-xl font-bold text-navy-base">Infrastructure & Trust</h2>

              {/* Conditional Property Details */}
              {isLand ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Land Size / Area</label>
                    <div className="relative mt-1 rounded-sm shadow-sm">
                      <input
                        type="number"
                        value={landSize}
                        onChange={(e) => setLandSize(e.target.value)}
                        placeholder={landUnit === 'Plots' ? 'e.g., 1' : landUnit === 'Acres' ? 'e.g., 2.5' : 'e.g., 500'}
                        className={`${inputCls} pr-24`}
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
                    <label className={labelCls}>Land Use Classification</label>
                    <select value={landUse} onChange={(e) => setLandUse(e.target.value)} className={inputCls}>
                      <option value="">Select...</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Mixed-Use">Mixed-Use</option>
                      <option value="Agricultural">Agricultural</option>
                    </select>
                  </div>
                </div>
              ) : isCommercial ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Property Size / Area</label>
                    <div className="relative mt-1 rounded-sm shadow-sm">
                      <input
                        type="number"
                        value={propertySize}
                        onChange={(e) => setPropertySize(e.target.value)}
                        placeholder={sizeUnit === 'm²' ? 'e.g., 120' : 'e.g., 2.5'}
                        className={`${inputCls} pr-20`}
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
                    <label className={labelCls}>Bathrooms / Washrooms</label>
                    <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className={inputCls}>
                      <option value="">Select...</option>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (<option key={n} value={n}>{n}</option>))}
                      <option value="10+">10+</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Parking Capacity</label>
                    <input type="number" value={parkingCapacity} onChange={(e) => setParkingCapacity(e.target.value)} placeholder="e.g. 15" className={inputCls} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className={labelCls}>Bedrooms</label>
                    <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className={inputCls}>
                      <option value="">Select...</option>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (<option key={n} value={n}>{n}</option>))}
                      <option value="10+">10+</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Bathrooms</label>
                    <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className={inputCls}>
                      <option value="">Select...</option>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (<option key={n} value={n}>{n}</option>))}
                      <option value="10+">10+</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Property Size / Area</label>
                    <div className="relative mt-1 rounded-sm shadow-sm">
                      <input
                        type="number"
                        value={propertySize}
                        onChange={(e) => setPropertySize(e.target.value)}
                        placeholder={sizeUnit === 'm²' ? 'e.g., 120' : 'e.g., 2.5'}
                        className={`${inputCls} pr-20`}
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
                    <label className={labelCls}>Furnishing Status</label>
                    <select value={furnishingStatus} onChange={(e) => setFurnishingStatus(e.target.value)} className={inputCls}>
                      <option value="">Select...</option>
                      <option value="Unfurnished">Unfurnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Fully Furnished">Fully Furnished</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Condition */}
              <div>
                <label className={labelCls}>Condition</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'Newly Built', value: 'newly_built' },
                    { label: 'Fairly Used', value: 'fairly_used' },
                    { label: 'Old', value: 'old' },
                    { label: 'Uncompleted', value: 'uncompleted' },
                    { label: 'Under Construction', value: 'under_construction' },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setConditionValue(conditionValue === opt.value ? '' : opt.value)}
                      className={`px-4 py-2 border rounded-full text-sm font-medium transition-all ${
                        conditionValue === opt.value
                          ? 'bg-navy-base text-white border-transparent shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-navy-light hover:text-navy-base'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parking Space */}
              <div>
                <label className={labelCls}>Parking Space</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'In House', value: 'in_house' },
                    { label: 'Street Side', value: 'street_side' },
                    { label: 'No Parking Space', value: 'no_parking' },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setParkingSpace(parkingSpace === opt.value ? '' : opt.value)}
                      className={`px-4 py-2 border rounded-full text-sm font-medium transition-all ${
                        parkingSpace === opt.value
                          ? 'bg-navy-base text-white border-transparent shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-navy-light hover:text-navy-base'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className={labelCls}>Amenities & Features</label>
                <div className="flex flex-wrap gap-3">
                  {AMENITIES_LIST.map(amenity => (
                    <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}
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

              {/* Property Images */}
              <div>
                <h3 className={labelCls}>Property Images</h3>

                {/* Existing Images */}
                {editMediaUrls.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Current Images • First image = marketplace cover photo</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {editMediaUrls.map((url, i) => (
                        <div key={`existing-${i}`} className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-accent-gold shadow-md' : 'border-gray-200'}`}>
                          <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover" />
                          <button type="button" onClick={() => removeExistingImage(i)}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          {editMediaUrls.length > 1 && (
                            <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {i > 0 && (
                                <button type="button" onClick={() => moveExistingLeft(i)}
                                  className="w-5 h-5 bg-black/60 hover:bg-navy-base text-white rounded flex items-center justify-center text-[10px] font-bold">←</button>
                              )}
                              {i < editMediaUrls.length - 1 && (
                                <button type="button" onClick={() => moveExistingRight(i)}
                                  className="w-5 h-5 bg-black/60 hover:bg-navy-base text-white rounded flex items-center justify-center text-[10px] font-bold">→</button>
                              )}
                            </div>
                          )}
                          {i === 0 && (<span className="absolute bottom-1 left-1 bg-accent-gold text-navy-base text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">Cover Photo</span>)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dropzone for New Images */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFilesSelected(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragging ? 'border-navy-base bg-navy-base/5' : 'border-gray-300 bg-slate-50 hover:border-navy-light hover:bg-slate-100'
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleFilesSelected(e.target.files)} className="hidden" />
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-navy-base/10' : 'bg-gray-100'}`}>
                      <svg className={`w-6 h-6 ${isDragging ? 'text-navy-base' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-navy-base">Add more images</p>
                    <p className="text-xs text-gray-400">Drag & drop or click to browse • Up to 6 total • Auto-compressed to WebP</p>
                    {isCompressing && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-navy-base font-medium">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        Compressing images…
                      </div>
                    )}
                  </div>
                </div>

                {/* New Image Previews */}
                {newImagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-3">
                    {newImagePreviews.map((src, i) => (
                      <div key={`new-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-emerald-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="Listing preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeNewImage(i); }}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        {newImagePreviews.length > 1 && (
                          <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {i > 0 && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); moveNewLeft(i); }}
                                className="w-5 h-5 bg-black/60 hover:bg-navy-base text-white rounded flex items-center justify-center text-[10px] font-bold">←</button>
                            )}
                            {i < newImagePreviews.length - 1 && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); moveNewRight(i); }}
                                className="w-5 h-5 bg-black/60 hover:bg-navy-base text-white rounded flex items-center justify-center text-[10px] font-bold">→</button>
                            )}
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">New</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Walkthrough URL */}
              <div>
                <h3 className={labelCls}>🎥 Video Walkthrough Tour (YouTube or Vimeo Link)</h3>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="e.g., https://www.youtube.com/watch?v=..."
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">Optional. Paste a YouTube or Vimeo link to show a video tour on your listing page.</p>
              </div>

              {/* SafeMove Toggle */}
              <div className={`p-5 rounded-xl border-2 transition-all ${safeMoveActive ? "border-accent-emerald bg-accent-emerald/5" : "border-gray-200 bg-slate-50"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className={`w-6 h-6 ${safeMoveActive ? "text-accent-emerald" : "text-gray-400"}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-lg font-bold text-navy-base">SafeMove Escrow Protection</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Enable SafeMove to allow tenants to pay their advance into a secure escrow account.
                    </p>
                  </div>
                  <div className="mt-1">
                    <button onClick={() => setSafeMoveActive(!safeMoveActive)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${safeMoveActive ? "bg-accent-emerald" : "bg-gray-300"}`}>
                      <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${safeMoveActive ? "translate-x-6" : "translate-x-0"}`}></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Navigation ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-slate-50/50">
          <button
            onClick={step === 1 ? onClose : prevStep}
            disabled={isSaving}
            className={`px-5 py-2.5 font-bold rounded-lg transition-colors ${isSaving ? "text-gray-400 cursor-not-allowed" : "text-navy-base border border-gray-300 hover:bg-white"}`}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <button
            onClick={() => { if (step < 3) { nextStep(); } else { handleSave(); } }}
            disabled={isSaving}
            className={`px-7 py-2.5 bg-accent-gold text-navy-base font-bold rounded-lg hover:bg-accent-gold/90 transition-colors shadow-sm ${isSaving ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isSaving ? "Saving..." : step === 3 ? "Save Changes" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
