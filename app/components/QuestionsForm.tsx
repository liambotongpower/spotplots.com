'use client';

import { useEffect, useMemo, useState } from 'react';
import { defaultFilters, Filters } from '../lib/schema';
import { loadFilters, saveFilters } from '../lib/persistence';
import { validateFilters } from '../lib/validation';
import { searchTypes, propertyTypes, facilitiesAll, sortTypes } from '../lib/enumMaps';

type Props = {
  onSearch: (filters: Filters) => void;
  initialFilters?: Partial<Filters>;
};

export default function QuestionsForm({ onSearch, initialFilters }: Props) {
  const [filters, setFilters] = useState<Filters>({ ...defaultFilters });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const saved = loadFilters();
    if (saved) setFilters((prev) => ({ ...prev, ...saved }));
  }, []);

  // Merge in initial filters coming from parent (e.g. parsed from URL)
  useEffect(() => {
    if (!initialFilters) return;
    setFilters((prev) => ({ ...prev, ...initialFilters }));
  }, [initialFilters]);

  // Force update when initialFilters change significantly
  useEffect(() => {
    if (initialFilters && initialFilters.counties && initialFilters.counties.length > 0) {
      setFilters((prev) => ({ ...prev, counties: initialFilters.counties! }));
    }
  }, [initialFilters?.counties]);

  useEffect(() => {
    saveFilters(filters);
  }, [filters]);


  const submit = () => {
    const errs = validateFilters(filters);
    setErrors(errs);
    if (errs.length === 0) {
      onSearch({ ...filters, page: 1 });
    }
  };

  return (
    <div className="space-y-6 text-black">

      {/* Search Type */}
      <div>
        <label className="block text-sm font-medium text-black">Search Type</label>
        <div className="mt-2 flex flex-col gap-2">
          {searchTypes.map((t) => {
            const checked = filters.search_type.includes(t);
            return (
              <label key={t} className="inline-flex items-center text-sm text-black">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={checked}
                  onChange={() =>
                    setFilters((p) => ({
                      ...p,
                      search_type: checked ? p.search_type.filter((x) => x !== t) : [...p.search_type, t],
                    }))
                  }
                />
                {t.replace(/_/g, ' ')}
              </label>
            );
          })}
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-sm font-medium text-black">Property Type</label>
        <div className="mt-2 flex flex-col gap-2">
          {propertyTypes.map((t) => {
            const checked = filters.property_type.includes(t);
            return (
              <label key={t} className="inline-flex items-center text-sm text-black">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={checked}
                  onChange={() =>
                    setFilters((p) => ({
                      ...p,
                      property_type: checked ? p.property_type.filter((x) => x !== t) : [...p.property_type, t],
                    }))
                  }
                />
                {t}
              </label>
            );
          })}
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Bedrooms</label>
        <div className="relative">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <span>Min:</span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.min_beds ?? 1}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const numValue = Number(value);
                  const maxValue = filters.max_beds ?? 10;
                  if (value === '' || (numValue >= 1 && numValue <= 10 && numValue < maxValue)) {
                    setFilters((p) => ({ ...p, min_beds: value === '' ? 1 : numValue }));
                  }
                }}
                className="w-12 px-1 py-0.5 text-xs border rounded text-center"
                aria-label="Minimum bedrooms"
                title="Minimum bedrooms"
              />
            </div>
            <div className="flex items-center gap-1">
              <span>Max:</span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.max_beds ?? 10}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const numValue = Number(value);
                  const minValue = filters.min_beds ?? 0;
                  if (value === '' || (numValue >= 0 && numValue <= 10 && numValue > minValue)) {
                    setFilters((p) => ({ ...p, max_beds: value === '' ? 10 : numValue }));
                  }
                }}
                className="w-12 px-1 py-0.5 text-xs border rounded text-center"
                aria-label="Maximum bedrooms"
                title="Maximum bedrooms"
              />
            </div>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-lg">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider"
              value={filters.min_beds ?? 1}
              onChange={(e) => {
                const value = Number(e.target.value);
                const maxValue = filters.max_beds ?? 10;
                if (value < maxValue) {
                  setFilters((p) => ({ ...p, min_beds: value }));
                }
              }}
              aria-label="Minimum bedrooms"
            />
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider"
              value={filters.max_beds ?? 10}
              onChange={(e) => {
                const value = Number(e.target.value);
                const minValue = filters.min_beds ?? 0;
                if (value > minValue) {
                  setFilters((p) => ({ ...p, max_beds: value }));
                }
              }}
              aria-label="Maximum bedrooms"
            />
          </div>
        </div>
      </div>

      {/* Bathrooms */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Bathrooms</label>
        <div className="relative">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <span>Min:</span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.min_baths ?? 1}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const numValue = Number(value);
                  const maxValue = filters.max_baths ?? 10;
                  if (value === '' || (numValue >= 1 && numValue <= 10 && numValue < maxValue)) {
                    setFilters((p) => ({ ...p, min_baths: value === '' ? 1 : numValue }));
                  }
                }}
                className="w-12 px-1 py-0.5 text-xs border rounded text-center"
                aria-label="Minimum bathrooms"
                title="Minimum bathrooms"
              />
            </div>
            <div className="flex items-center gap-1">
              <span>Max:</span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.max_baths ?? 10}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const numValue = Number(value);
                  const minValue = filters.min_baths ?? 0;
                  if (value === '' || (numValue >= 0 && numValue <= 10 && numValue > minValue)) {
                    setFilters((p) => ({ ...p, max_baths: value === '' ? 10 : numValue }));
                  }
                }}
                className="w-12 px-1 py-0.5 text-xs border rounded text-center"
                aria-label="Maximum bathrooms"
                title="Maximum bathrooms"
              />
            </div>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-lg">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider"
              value={filters.min_baths ?? 1}
              onChange={(e) => {
                const value = Number(e.target.value);
                const maxValue = filters.max_baths ?? 10;
                if (value < maxValue) {
                  setFilters((p) => ({ ...p, min_baths: value }));
                }
              }}
              aria-label="Minimum bathrooms"
            />
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider"
              value={filters.max_baths ?? 10}
              onChange={(e) => {
                const value = Number(e.target.value);
                const minValue = filters.min_baths ?? 0;
                if (value > minValue) {
                  setFilters((p) => ({ ...p, max_baths: value }));
                }
              }}
              aria-label="Maximum bathrooms"
            />
          </div>
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Price (€)</label>
        <div className="relative">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <span>Min:</span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.min_price === null ? '' : filters.min_price}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value === '') {
                    setFilters((p) => ({ ...p, min_price: null }));
                  } else {
                    const numValue = Number(value);
                    if (numValue <= 10000000) {
                      setFilters((p) => ({ ...p, min_price: numValue }));
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const numValue = Number(value);
                  const maxValue = filters.max_price ?? 10000000;
                  if (value === '' || numValue < 1000) {
                    setFilters((p) => ({ ...p, min_price: 1000 }));
                  } else if (numValue >= maxValue) {
                    setFilters((p) => ({ ...p, min_price: maxValue - 1000 }));
                  }
                }}
                className="w-20 px-1 py-0.5 text-xs border rounded text-center"
                aria-label="Minimum price"
                title="Minimum price"
                placeholder="1000"
              />
            </div>
            <div className="flex items-center gap-1">
              <span>Max:</span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.max_price === null ? '' : filters.max_price}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value === '') {
                    setFilters((p) => ({ ...p, max_price: null }));
                  } else {
                    const numValue = Number(value);
                    if (numValue <= 10000000) {
                      setFilters((p) => ({ ...p, max_price: numValue }));
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const numValue = Number(value);
                  const minValue = filters.min_price ?? 1000;
                  if (value === '' || numValue < 1000) {
                    setFilters((p) => ({ ...p, max_price: 10000000 }));
                  } else if (numValue <= minValue) {
                    setFilters((p) => ({ ...p, max_price: minValue + 1000 }));
                  }
                }}
                className="w-20 px-1 py-0.5 text-xs border rounded text-center"
                aria-label="Maximum price"
                title="Maximum price"
                placeholder="10000000"
              />
            </div>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-lg">
            <input
              type="range"
              min={1000}
              max={10000000}
              step={1000}
              className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider"
              value={filters.min_price ?? 1000}
              onChange={(e) => {
                const value = Number(e.target.value);
                const maxValue = filters.max_price ?? 10000000;
                if (value < maxValue) {
                  setFilters((p) => ({ ...p, min_price: value }));
                }
              }}
              aria-label="Minimum price"
            />
            <input
              type="range"
              min={1000}
              max={10000000}
              step={1000}
              className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider"
              value={filters.max_price ?? 10000000}
              onChange={(e) => {
                const value = Number(e.target.value);
                const minValue = filters.min_price ?? 1000;
                if (value > minValue) {
                  setFilters((p) => ({ ...p, max_price: value }));
                }
              }}
              aria-label="Maximum price"
            />
          </div>
        </div>
      </div>

      {/* Facilities */}
      <div>
        <label className="block text-sm font-medium text-black">Facilities</label>
        <div className="mt-2 flex flex-col gap-2">
          {facilitiesAll.map((f) => {
            const checked = filters.facilities.includes(f);
            return (
              <label key={f} className="inline-flex items-center text-sm text-black">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={checked}
                  onChange={() =>
                    setFilters((p) => ({
                      ...p,
                      facilities: checked ? p.facilities.filter((x) => x !== f) : [...p.facilities, f],
                    }))
                  }
                />
                {f}
              </label>
            );
          })}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-black">Sort</label>
        <div className="mt-2 flex flex-col gap-2">
          {sortTypes.map((t) => {
            const checked = filters.sort_type.includes(t);
            return (
              <label key={t} className="inline-flex items-center text-sm text-black">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={checked}
                  onChange={() =>
                    setFilters((p) => ({
                      ...p,
                      sort_type: checked ? p.sort_type.filter((x) => x !== t) : [...p.sort_type, t],
                    }))
                  }
                />
                {t.replace(/_/g, ' ')}
              </label>
            );
          })}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="text-red-600 text-sm">
          {errors.map((e) => (
            <div key={e}>{e}</div>
          ))}
        </div>
      )}

      {/* Submit */}
      <div>
        <button
          type="button"
          onClick={submit}
          className="px-4 py-2 rounded-md bg-green-600 text-white text-sm"
        >
          Search
        </button>
      </div>
    </div>
  );
}


