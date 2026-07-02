export const RESIDENTIAL_CATEGORIES = [
  "Apartment",
  "House",
  "Townhouse / Terrace",
  "Single Room Self-Contain",
  "Chamber and Hall",
  "Hostel",
  "Boys Quarters (BQ)",
  "Studio Apartment",
  "Penthouse",
  "Villa / Mansion",
  "Bungalow",
  "Shared Apartment",
  "Block of Flat",
  "Farm House",
  "Plot of Land"
] as const;

export const COMMERCIAL_CATEGORIES = [
  "Business Center",
  "Office Space",
  "Hotel",
  "Hostel",
  "Shop",
  "Warehouse",
  "Open Space",
  "Farm",
  "Plot of Land"
] as const;

export const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Savannah",
  "North East",
  "Oti",
  "Western North"
] as const;

// Phase 3: Dynamic Category and Amenity Fetching
import { createClient } from '@/utils/supabase/server';

export async function fetchAmenities(category?: 'residential' | 'commercial' | 'land') {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('config_amenities')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
      
    if (category) {
      query = query.eq('category', category);
    }
      
    const { data: amenities, error } = await query;
      
    if (error) throw error;
    
    return amenities || [];
  } catch (error) {
    console.error('Failed to fetch dynamic amenities:', error);
    return [];
  }
}
