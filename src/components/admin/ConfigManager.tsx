'use client';

import { useState, useTransition } from 'react';
import { Plus, Edit2, Check, X, Loader2 } from 'lucide-react';
import { addRegion, updateRegion, addNeighborhood, updateNeighborhood, addAmenity, updateAmenity } from '@/app/actions/configActions';

export interface RegionConfig {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface NeighborhoodConfig {
  id: string;
  region_id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface AmenityConfig {
  id: string;
  name: string;
  category: string;
  slug: string;
  is_active: boolean;
}

export default function ConfigManager({
  initialRegions,
  initialNeighborhoods,
  initialAmenities,
}: {
  initialRegions: RegionConfig[];
  initialNeighborhoods: NeighborhoodConfig[];
  initialAmenities: AmenityConfig[];
}) {
  const [activeTab, setActiveTab] = useState<'locations' | 'amenities'>('locations');
  const [isPending, startTransition] = useTransition();

  // Location State
  const [newRegionName, setNewRegionName] = useState('');
  const [newNeighborhoods, setNewNeighborhoods] = useState<Record<string, string>>({});
  
  // Amenity State
  const [newAmenityName, setNewAmenityName] = useState('');
  const [newAmenityCategory, setNewAmenityCategory] = useState('residential');

  const handleAddRegion = async () => {
    if (!newRegionName.trim()) return;
    const slug = newRegionName.toLowerCase().trim().replace(/\s+/g, '_');
    startTransition(async () => {
      await addRegion(newRegionName, slug);
      setNewRegionName('');
    });
  };

  const handleToggleRegion = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await updateRegion(id, { is_active: !currentStatus });
    });
  };

  const handleAddNeighborhood = async (regionId: string) => {
    const name = newNeighborhoods[regionId];
    if (!name?.trim()) return;
    const slug = name.toLowerCase().trim().replace(/\s+/g, '_');
    
    startTransition(async () => {
      await addNeighborhood(regionId, name, slug);
      setNewNeighborhoods(prev => ({ ...prev, [regionId]: '' }));
    });
  };

  const handleToggleNeighborhood = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await updateNeighborhood(id, { is_active: !currentStatus });
    });
  };

  const handleAddAmenity = async () => {
    if (!newAmenityName.trim()) return;
    const slug = newAmenityName.toLowerCase().trim().replace(/\s+/g, '_') + (newAmenityCategory === 'commercial' ? '_commercial' : '');
    
    startTransition(async () => {
      await addAmenity(newAmenityName, slug, newAmenityCategory);
      setNewAmenityName('');
    });
  };

  const handleToggleAmenity = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await updateAmenity(id, { is_active: !currentStatus });
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('locations')}
          className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'locations' ? 'border-navy-base text-navy-base' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Regions & Neighborhoods
        </button>
        <button
          onClick={() => setActiveTab('amenities')}
          className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'amenities' ? 'border-navy-base text-navy-base' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Amenities & Features
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'locations' && (
          <div className="space-y-8">
            {/* Add Region */}
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="New Region Name (e.g. Greater Accra)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
              />
              <button
                onClick={handleAddRegion}
                disabled={isPending || !newRegionName.trim()}
                className="px-6 py-2 bg-navy-base text-white rounded-lg hover:bg-navy-light disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Region
              </button>
            </div>

            <div className="space-y-4">
              {initialRegions.map(region => {
                const regionNeighborhoods = initialNeighborhoods.filter(n => n.region_id === region.id);
                
                return (
                  <div key={region.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{region.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${region.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>
                          {region.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleRegion(region.id, region.is_active)}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        {region.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Neighborhoods List */}
                      <div className="flex flex-wrap gap-2">
                        {regionNeighborhoods.map(neighborhood => (
                          <div
                            key={neighborhood.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${
                              neighborhood.is_active 
                                ? 'bg-white border-gray-300 text-gray-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-400 line-through'
                            }`}
                          >
                            <span>{neighborhood.name}</span>
                            <button
                              onClick={() => handleToggleNeighborhood(neighborhood.id, neighborhood.is_active)}
                              className="hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Neighborhood to this region */}
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Add neighborhood..."
                          className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={newNeighborhoods[region.id] || ''}
                          onChange={(e) => setNewNeighborhoods(prev => ({ ...prev, [region.id]: e.target.value }))}
                        />
                        <button
                          onClick={() => handleAddNeighborhood(region.id)}
                          disabled={isPending || !newNeighborhoods[region.id]?.trim()}
                          className="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'amenities' && (
          <div className="space-y-8">
            {/* Add Amenity */}
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="New Amenity Name (e.g. Swimming Pool)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={newAmenityName}
                onChange={(e) => setNewAmenityName(e.target.value)}
              />
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
                value={newAmenityCategory}
                onChange={(e) => setNewAmenityCategory(e.target.value)}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>
              <button
                onClick={handleAddAmenity}
                disabled={isPending || !newAmenityName.trim()}
                className="px-6 py-2 bg-navy-base text-white rounded-lg hover:bg-navy-light disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Amenity
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['residential', 'commercial', 'land'].map(category => (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 capitalize">{category}</h3>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {initialAmenities.filter(a => a.category === category).map(amenity => (
                      <div key={amenity.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                        <span className={`text-sm ${!amenity.is_active ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {amenity.name}
                        </span>
                        <button
                          onClick={() => handleToggleAmenity(amenity.id, amenity.is_active)}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          {amenity.is_active ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
