'use client';

import { useState, useTransition } from 'react';
import { Plus, Edit2, Check, X, Loader2 } from 'lucide-react';
import { addAmenity, updateAmenity } from '@/app/actions/configActions';

export interface AmenityConfig {
  id: string;
  name: string;
  category: string;
  slug: string;
  is_active: boolean;
}

export default function ConfigManager({
  initialAmenities,
}: {
  initialAmenities: AmenityConfig[];
}) {
  const [isPending, startTransition] = useTransition();

  // Amenity State
  const [newAmenityName, setNewAmenityName] = useState('');
  const [newAmenityCategory, setNewAmenityCategory] = useState('residential');

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
                        className="text-xs text-gray-500 hover:text-gray-900"
                      >
                        {amenity.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
    </div>
  );
}
