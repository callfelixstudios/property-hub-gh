export const ghanaLocations: Record<string, string[]> = {
  "Greater Accra": ["East Legon", "Cantonments", "Airport Residential Area", "Labone", "Spintex", "Madina", "Osu", "Dzorwulu", "Tema", "Dansoman", "Achimota"],
  "Ashanti": ["Kumasi", "Nhyiaeso", "Ahodwo", "Asokwa", "Bantama", "Adum", "Tafo"],
  "Central": ["Cape Coast", "Kasoa", "Winneba", "Elmina", "Saltpond"],
  "Eastern": ["Koforidua", "Aburi", "Nsawam", "Nkawkaw", "Akropong"],
  "Northern": ["Tamale", "Sagnarigu", "Yendi"],
  "Western": ["Takoradi", "Sekondi", "Tarkwa", "Axim"],
  "Volta": ["Ho", "Keta", "Aflao", "Hohoe", "Sogakope"],
  "Bono": ["Sunyani", "Berekum", "Dormaa Ahenkro"],
  "Bono East": ["Techiman", "Kintampo", "Nkoranza"],
  "Ahafo": ["Goaso", "Bechem", "Duayaw Nkwanta"],
  "Savannah": ["Damongo", "Salaga", "Bole"],
  "North East": ["Nalerigu", "Walewale", "Gambaga"],
  "Upper East": ["Bolgatanga", "Navrongo", "Bawku"],
  "Upper West": ["Wa", "Tumu", "Lawra"],
  "Western North": ["Sefwi Wiawso", "Bibiani", "Enchi"],
  "Oti": ["Dambai", "Jasikan", "Kadjebi"]
};

export const regionToLocationKey: Record<string, string> = {
  greater_accra: "Greater Accra",
  ashanti: "Ashanti",
  central: "Central",
  eastern: "Eastern",
  northern: "Northern",
  western: "Western",
  volta: "Volta",
  bono: "Bono",
  bono_east: "Bono East",
  ahafo: "Ahafo",
  savannah: "Savannah",
  north_east: "North East",
  upper_east: "Upper East",
  upper_west: "Upper West",
  western_north: "Western North",
  oti: "Oti"
};

// Phase 3: Dynamic Location Fetching
import { createClient } from '@/utils/supabase/server';

export async function fetchLocations() {
  try {
    const supabase = await createClient();
    
    const { data: regions, error: regionError } = await supabase
      .from('config_regions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
      
    if (regionError) throw regionError;
    
    const { data: neighborhoods, error: neighborhoodError } = await supabase
      .from('config_neighborhoods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
      
    if (neighborhoodError) throw neighborhoodError;
    
    if (!regions || regions.length === 0) {
      return { locations: ghanaLocations, regionToKey: regionToLocationKey, rawRegions: [] };
    }
    
    const dynamicLocations: Record<string, string[]> = {};
    const dynamicRegionToKey: Record<string, string> = {};
    
    regions.forEach(region => {
      const regionNeighborhoods = (neighborhoods || [])
        .filter(n => n.region_id === region.id)
        .map(n => n.name);
        
      dynamicLocations[region.name] = regionNeighborhoods;
      dynamicRegionToKey[region.slug] = region.name;
    });
    
    return { 
      locations: dynamicLocations, 
      regionToKey: dynamicRegionToKey,
      rawRegions: regions 
    };
  } catch (error) {
    console.error('Failed to fetch dynamic locations, falling back to static:', error);
    return { locations: ghanaLocations, regionToKey: regionToLocationKey, rawRegions: [] };
  }
}
