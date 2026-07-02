import LocationManager from '@/components/admin/LocationManager';

export const metadata = {
  title: 'Location Management | Admin — Property Hub GH',
};

export default function AdminLocationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#191c1e]">Location Management</h1>
        <p className="text-[#45464d] text-sm mt-1">
          Manage the 16 Ghanaian regions and their neighborhoods. Add locations one-by-one or bulk upload via CSV.
        </p>
      </div>

      <LocationManager />
    </div>
  );
}
