'use client';

import { useState, useTransition, useCallback, useRef } from 'react';
import {
  MapPin,
  Upload,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ChevronDown,
  Search,
} from 'lucide-react';
import { GHANA_REGIONS, type GhanaRegion } from '@/constants/locations';
import {
  getNeighborhoodsByRegion,
  addSingleNeighborhood,
  bulkAddNeighborhoods,
  deleteNeighborhood,
  type Neighborhood,
} from '@/app/actions/locationActions';

// ─── Feedback Toast ───────────────────────────────────────────────────────
interface Toast {
  type: 'success' | 'error';
  message: string;
}

export default function LocationManager() {
  // ── Core state ──────────────────────────────────────────────────────────
  const [selectedRegion, setSelectedRegion] = useState<GhanaRegion | null>(null);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<Toast | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Single input state ──────────────────────────────────────────────────
  const [singleName, setSingleName] = useState('');

  // ── CSV state ───────────────────────────────────────────────────────────
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const showToast = useCallback((type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadNeighborhoods = useCallback(async (region: GhanaRegion) => {
    try {
      const data = await getNeighborhoodsByRegion(region);
      setNeighborhoods(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load neighborhoods';
      showToast('error', msg);
    }
  }, [showToast]);

  // ── Region selection ────────────────────────────────────────────────────
  const handleRegionSelect = useCallback(
    (region: GhanaRegion) => {
      setSelectedRegion(region);
      setSingleName('');
      setCsvFile(null);
      setCsvPreview([]);
      setSearchQuery('');
      startTransition(() => {
        loadNeighborhoods(region);
      });
    },
    [loadNeighborhoods, startTransition]
  );

  // ── Add single neighborhood ─────────────────────────────────────────────
  const handleAddSingle = useCallback(async () => {
    if (!selectedRegion || !singleName.trim()) return;
    startTransition(async () => {
      try {
        await addSingleNeighborhood(selectedRegion, singleName);
        setSingleName('');
        showToast('success', `Added "${singleName.trim()}" to ${selectedRegion}`);
        await loadNeighborhoods(selectedRegion);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to add neighborhood';
        showToast('error', msg);
      }
    });
  }, [selectedRegion, singleName, showToast, loadNeighborhoods, startTransition]);

  // ── CSV file handler ────────────────────────────────────────────────────
  const handleCSVSelect = useCallback(async (file: File) => {
    setCsvFile(file);
    const text = await file.text();
    const rows = text
      .split(/\r?\n/)
      .map(row => row.replace(/^"|"$/g, '').trim())
      .filter(row => row.length > 0);
    setCsvPreview(rows);
  }, []);

  const handleCSVUpload = useCallback(async () => {
    if (!selectedRegion || csvPreview.length === 0) return;
    setIsUploading(true);
    try {
      const result = await bulkAddNeighborhoods(selectedRegion, csvPreview);
      showToast(
        'success',
        `Bulk upload complete: ${result.inserted} added, ${result.duplicates} duplicates skipped.`
      );
      setCsvFile(null);
      setCsvPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadNeighborhoods(selectedRegion);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk upload failed';
      showToast('error', msg);
    } finally {
      setIsUploading(false);
    }
  }, [selectedRegion, csvPreview, showToast, loadNeighborhoods]);

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!selectedRegion) return;
      startTransition(async () => {
        try {
          await deleteNeighborhood(id);
          showToast('success', `Removed "${name}"`);
          await loadNeighborhoods(selectedRegion);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to delete';
          showToast('error', msg);
        }
      });
    },
    [selectedRegion, showToast, loadNeighborhoods, startTransition]
  );

  // ── Filtered + sorted neighborhoods ─────────────────────────────────────
  const displayed = neighborhoods
    .filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const isLocked = selectedRegion === null;

  return (
    <div className="space-y-6">
      {/* ── Toast Notification ─────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg text-sm font-medium transition-all animate-in slide-in-from-right ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          {toast.message}
        </div>
      )}

      {/* ── Step 1: Region Context Lock ────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#191c1e] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#785a00]" />
            Region Selector
          </h2>
          <p className="text-sm text-[#45464d] mt-0.5">
            Select a region to manage its neighborhoods.
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {GHANA_REGIONS.map(region => (
              <button
                key={region}
                onClick={() => handleRegionSelect(region)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                  selectedRegion === region
                    ? 'bg-[#131b2e] text-white border-[#131b2e] shadow-sm'
                    : 'bg-white text-[#45464d] border-gray-200 hover:bg-[#f2f4f6] hover:border-gray-300'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Step 2: Contextual Input Forms ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Input */}
        <div
          className={`bg-white border rounded-xl shadow-sm transition-opacity ${
            isLocked ? 'opacity-50 pointer-events-none border-gray-100' : 'border-gray-200'
          }`}
        >
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-[#191c1e] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#785a00]" />
              Add Single Neighborhood
            </h3>
          </div>
          <div className="p-6">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder={isLocked ? 'Select a region first...' : `Add neighborhood to ${selectedRegion}...`}
                disabled={isLocked}
                value={singleName}
                onChange={e => setSingleName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSingle()}
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:border-[#131b2e] focus:ring-1 focus:ring-[#131b2e]/10 transition-all"
              />
              <button
                onClick={handleAddSingle}
                disabled={isLocked || isPending || !singleName.trim()}
                className="px-5 py-2.5 text-sm font-medium bg-[#131b2e] text-white rounded-lg hover:bg-[#131b2e]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>
        </div>

        {/* CSV Bulk Upload */}
        <div
          className={`bg-white border rounded-xl shadow-sm transition-opacity ${
            isLocked ? 'opacity-50 pointer-events-none border-gray-100' : 'border-gray-200'
          }`}
        >
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-[#191c1e] flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#785a00]" />
              CSV Bulk Upload
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Drop zone */}
            <label
              htmlFor="csv-upload"
              className={`flex flex-col items-center justify-center w-full py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                csvFile
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-gray-200 hover:border-[#785a00]/40 hover:bg-[#f2f4f6]'
              }`}
            >
              {csvFile ? (
                <>
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2" />
                  <span className="text-sm font-medium text-emerald-800">{csvFile.name}</span>
                  <span className="text-xs text-emerald-600 mt-0.5">{csvPreview.length} entries detected</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-[#76777d] mb-2" />
                  <span className="text-sm text-[#45464d]">
                    Drop a <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">.csv</code> file or click to browse
                  </span>
                  <span className="text-xs text-[#76777d] mt-1">One neighborhood name per row</span>
                </>
              )}
              <input
                id="csv-upload"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                disabled={isLocked}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleCSVSelect(file);
                }}
              />
            </label>

            {/* CSV Preview */}
            {csvPreview.length > 0 && (
              <div className="space-y-3">
                <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100 bg-[#f7f9fb]">
                  <div className="p-3 flex flex-wrap gap-1.5">
                    {csvPreview.slice(0, 50).map((name, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs bg-white border border-gray-200 rounded-full text-[#45464d]">
                        {name}
                      </span>
                    ))}
                    {csvPreview.length > 50 && (
                      <span className="px-2.5 py-1 text-xs bg-gray-100 rounded-full text-[#76777d]">
                        +{csvPreview.length - 50} more
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCSVUpload}
                  disabled={isUploading}
                  className="w-full px-4 py-2.5 text-sm font-medium bg-[#785a00] text-white rounded-lg hover:bg-[#785a00]/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload {csvPreview.length} neighborhoods to {selectedRegion}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Step 3: Isolated Data View Matrix ──────────────────────────── */}
      <div
        className={`bg-white border rounded-xl shadow-sm transition-opacity ${
          isLocked ? 'opacity-50 pointer-events-none border-gray-100' : 'border-gray-200'
        }`}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#191c1e]">
              {selectedRegion ? `${selectedRegion} — Neighborhoods` : 'Neighborhoods'}
            </h3>
            <p className="text-xs text-[#76777d] mt-0.5">
              {displayed.length} entr{displayed.length === 1 ? 'y' : 'ies'} · sorted A → Z
            </p>
          </div>
          {!isLocked && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#76777d]" />
              <input
                type="text"
                placeholder="Filter..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#131b2e] focus:ring-1 focus:ring-[#131b2e]/10 w-48"
              />
            </div>
          )}
        </div>

        <div className="p-6">
          {isPending && neighborhoods.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#76777d]" />
            </div>
          ) : displayed.length === 0 && selectedRegion ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-[#45464d]">No neighborhoods yet</p>
              <p className="text-xs text-[#76777d] mt-1">
                Add one above or upload a CSV file.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {displayed.map(n => (
                <div
                  key={n.id}
                  className="group flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-100 bg-[#f7f9fb] hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <span className="text-sm text-[#191c1e] font-medium truncate">{n.name}</span>
                  <button
                    onClick={() => handleDelete(n.id, n.name)}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all disabled:opacity-30"
                    title={`Delete ${n.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
