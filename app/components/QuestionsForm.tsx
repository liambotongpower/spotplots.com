'use client';

import { useEffect, useMemo, useState, useImperativeHandle, forwardRef } from 'react';
import { defaultFilters, Filters } from '../lib/schema';
import { loadFilters, saveFilters } from '../lib/persistence';
import { validateFilters } from '../lib/validation';
import { searchTypes, propertyTypes, facilitiesAll, sortTypes, sortLabels, searchTypeLabels, propertyTypeLabels, facilityLabels } from '../lib/enumMaps';
import { FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

type Props = {
  onSearch: (filters: Filters) => void;
  initialFilters?: Partial<Filters>;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export type QuestionsFormRef = {
  submit: () => void;
};

const QuestionsForm = forwardRef<QuestionsFormRef, Props>(({ onSearch, initialFilters, onCollapsedChange }, ref) => {
  const [filters, setFilters] = useState<Filters>({ ...defaultFilters });
  const [errors, setErrors] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState({
    sort: true,
    searchType: true,
    propertyType: true,
    bedrooms: true,
    bathrooms: true,
    price: true,
    facilities: true,
  });

  useEffect(() => {
    // Set default selections first
    const defaults = {
      sort_type: "PUBLISH_DATE_DESC", // Newest First
      search_type: "RESIDENTIAL_SALE", // Residential Sale
      property_type: "HOUSE" // House
    };
    
    const saved = loadFilters();
    if (saved) {
      // Merge saved filters with defaults, but only override if saved value is not null
      setFilters((prev) => {
        const merged = { ...prev, ...defaults };
        Object.keys(saved).forEach((key) => {
          const k = key as keyof Filters;
          const value = saved[k];
          // Only override defaults if the saved value is meaningful (not null/undefined)
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              // Only override arrays if they have content
              if (value.length > 0) {
                (merged as any)[k] = value;
              }
            } else {
              (merged as any)[k] = value;
            }
          }
        });
        return merged;
      });
    } else {
      // No saved filters, just use defaults
      setFilters((prev) => ({ ...prev, ...defaults }));
    }
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

  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(collapsed);
    }
  }, [collapsed, onCollapsedChange]);

  const submit = () => {
    const errs = validateFilters(filters);
    setErrors(errs);
    if (errs.length === 0) {
      onSearch({ ...filters, page: 1 });
    }
  };

  useImperativeHandle(ref, () => ({
    submit,
  }));

  return (
    <div className="space-y-6 text-black">
      
      {/* Collapse Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          title={collapsed ? 'Show filters' : 'Hide filters'}
          aria-label={collapsed ? 'Show filters' : 'Hide filters'}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      {!collapsed && (
        <>
      {/* Sort */}
      <div>
        <button
          type="button"
          onClick={() => setOpen((p) => ({ ...p, sort: !p.sort }))}
          className="w-full flex items-center justify-between"
        >
          <span className="block text-sm font-medium text-black">Sort</span>
          <FiChevronDown className={`text-gray-600 transition-transform ${open.sort ? 'rotate-180' : ''}`} />
        </button>
        {open.sort && (
          <div className="mt-2 grid grid-cols-1 gap-2">
            {sortTypes.map((t) => (
              <label key={t} className="inline-flex items-center text-sm text-black">
                <input
                  type="radio"
                  className="mr-2"
                  checked={filters.sort_type === t}
                  onChange={() => setFilters((p) => ({ ...p, sort_type: t }))}
                />
                {sortLabels[t] || t}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Search Type */}
      <div>
        <button
          type="button"
          onClick={() => setOpen((p) => ({ ...p, searchType: !p.searchType }))}
          className="w-full flex items-center justify-between"
        >
          <span className="block text-sm font-medium text-black">Search Type</span>
          <FiChevronDown className={`text-gray-600 transition-transform ${open.searchType ? 'rotate-180' : ''}`} />
        </button>
        {open.searchType && (
          <div className="mt-2 grid grid-cols-1 gap-2">
            {searchTypes.map((t) => (
              <label key={t} className="inline-flex items-center text-sm text-black">
                <input
                  type="radio"
                  className="mr-2"
                  checked={filters.search_type === t}
                  onChange={() => setFilters((p) => ({ ...p, search_type: t }))}
                />
                {searchTypeLabels[t] || t}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Property Type */}
      <div>
        <button
          type="button"
          onClick={() => setOpen((p) => ({ ...p, propertyType: !p.propertyType }))}
          className="w-full flex items-center justify-between"
        >
          <span className="block text-sm font-medium text-black">Property Type</span>
          <FiChevronDown className={`text-gray-600 transition-transform ${open.propertyType ? 'rotate-180' : ''}`} />
        </button>
        {open.propertyType && (
          <div className="mt-2 grid grid-cols-1 gap-2">
            {propertyTypes.map((t) => (
              <label key={t} className="inline-flex items-center text-sm text-black">
                <input
                  type="radio"
                  className="mr-2"
                  checked={filters.property_type === t}
                  onChange={() => setFilters((p) => ({ ...p, property_type: t }))}
                />
                {propertyTypeLabels[t] || t}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Bedrooms */}
      <div>
        <button
          type="button"
          onClick={() => setOpen((p) => ({ ...p, bedrooms: !p.bedrooms }))}
          className="w-full flex items-center justify-between"
        >
          <span className="block text-sm font-medium text-black">Bedrooms</span>
          <FiChevronDown className={`text-gray-600 transition-transform ${open.bedrooms ? 'rotate-180' : ''}`} />
        </button>
        {open.bedrooms && (
        <div className="relative mt-2">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <span>Min:</span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.min_beds === null ? '' : filters.min_beds}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value === '') {
                    setFilters((p) => ({ ...p, min_beds: null }));
                  } else {
                    const numValue = Number(value);
                    if (numValue <= 10) {
                      setFilters((p) => ({ ...p, min_beds: numValue }));
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const numValue = Number(value);
                  const maxValue = filters.max_beds ?? 10;
                  if (value === '' || numValue < 1) {
                    setFilters((p) => ({ ...p, min_beds: 1 }));
                  } else if (numValue >= maxValue) {
                    setFilters((p) => ({ ...p, min_beds: maxValue - 1 }));
                  }
                }}
                className="w-12 px-1 py-0.5 text-xs border rounded text-center"
                aria-label="Minimum bedrooms"
                title="Minimum bedrooms"
                placeholder="1"
              />
            </div>
            <div className="flex items-center gap-1">
              <span>Max:</span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.max_beds === null ? '' : filters.max_beds}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value === '') {
                    setFilters((p) => ({ ...p, max_beds: null }));
                  } else {
                    const numValue = Number(value);
                    if (numValue <= 10) {
                      setFilters((p) => ({ ...p, max_beds: numValue }));
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const numValue = Number(value);
                  const minValue = filters.min_beds ?? 1;
                  if (value === '' || numValue < 1) {
                    setFilters((p) => ({ ...p, max_beds: 10 }));
                  } else if (numValue <= minValue) {
                    setFilters((p) => ({ ...p, max_beds: minValue + 1 }));
                  }
                }}
                className="w-12 px-1 py-0.5 text-xs border rounded text-center"
                aria-label="Maximum bedrooms"
                title="Maximum bedrooms"
                placeholder="10"
              />
            </div>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-lg">
            <input
              type="range"
              min={0}
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
        )}
      </div>

      {/* Bathrooms */}
      <div>
        <button
          type="button"
          onClick={() => setOpen((p) => ({ ...p, bathrooms: !p.bathrooms }))}
          className="w-full flex items-center justify-between"
        >
          <span className="block text-sm font-medium text-black">Bathrooms</span>
          <FiChevronDown className={`text-gray-600 transition-transform ${open.bathrooms ? 'rotate-180' : ''}`} />
        </button>
        {open.bathrooms && (
        <div className="relative mt-2">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <span>Min:</span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.min_baths === null ? '' : filters.min_baths}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value === '') {
                    setFilters((p) => ({ ...p, min_baths: null }));
                  } else {
                    const numValue = Number(value);
                    if (numValue <= 10) {
                      setFilters((p) => ({ ...p, min_baths: numValue }));
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const numValue = Number(value);
                  const maxValue = filters.max_baths ?? 10;
                  if (value === '' || numValue < 1) {
                    setFilters((p) => ({ ...p, min_baths: 1 }));
                  } else if (numValue >= maxValue) {
                    setFilters((p) => ({ ...p, min_baths: maxValue - 1 }));
                  }
                }}
                className="w-12 px-1 py-0.5 text-xs border rounded text-center"
                aria-label="Minimum bathrooms"
                title="Minimum bathrooms"
                placeholder="1"
              />
            </div>
            <div className="flex items-center gap-1">
              <span>Max:</span>
              <input
                type="text"
                inputMode="numeric"
                value={filters.max_baths === null ? '' : filters.max_baths}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value === '') {
                    setFilters((p) => ({ ...p, max_baths: null }));
                  } else {
                    const numValue = Number(value);
                    if (numValue <= 10) {
                      setFilters((p) => ({ ...p, max_baths: numValue }));
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const numValue = Number(value);
                  const minValue = filters.min_baths ?? 1;
                  if (value === '' || numValue < 1) {
                    setFilters((p) => ({ ...p, max_baths: 10 }));
                  } else if (numValue <= minValue) {
                    setFilters((p) => ({ ...p, max_baths: minValue + 1 }));
                  }
                }}
                className="w-12 px-1 py-0.5 text-xs border rounded text-center"
                aria-label="Maximum bathrooms"
                title="Maximum bathrooms"
                placeholder="10"
              />
            </div>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-lg">
            <input
              type="range"
              min={0}
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
        )}
      </div>

      {/* Price */}
      <div>
        <button
          type="button"
          onClick={() => setOpen((p) => ({ ...p, price: !p.price }))}
          className="w-full flex items-center justify-between"
        >
          <span className="block text-sm font-medium text-black">Price (€)</span>
          <FiChevronDown className={`text-gray-600 transition-transform ${open.price ? 'rotate-180' : ''}`} />
        </button>
        {open.price && (
        <div className="relative mt-2">
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
                    if (numValue <= 5000000) {
                      setFilters((p) => ({ ...p, min_price: numValue }));
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const numValue = Number(value);
                  const maxValue = filters.max_price ?? 5000000;
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
                value={filters.max_price === null ? '' : filters.max_price === 5000000 ? '5000000+' : filters.max_price}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9+]/g, '');
                  if (value === '') {
                    setFilters((p) => ({ ...p, max_price: null }));
                  } else if (value === '5000000+') {
                    setFilters((p) => ({ ...p, max_price: 5000000 }));
                  } else {
                    const numValue = Number(value);
                    if (numValue <= 5000000) {
                      setFilters((p) => ({ ...p, max_price: numValue }));
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/[^0-9+]/g, '');
                  const numValue = value === '5000000+' ? 5000000 : Number(value);
                  const minValue = filters.min_price ?? 1000;
                  if (value === '' || numValue < 1000) {
                    setFilters((p) => ({ ...p, max_price: 5000000 }));
                  } else if (numValue <= minValue) {
                    setFilters((p) => ({ ...p, max_price: minValue + 1000 }));
                  }
                }}
                className="w-20 px-1 py-0.5 text-xs border rounded text-center"
                aria-label="Maximum price"
                title="Maximum price"
                placeholder="5000000+"
              />
            </div>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-lg">
            <input
              type="range"
              min={1000}
              max={5000000}
              step={1000}
              className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider"
              value={filters.min_price ?? 1000}
              onChange={(e) => {
                const value = Number(e.target.value);
                const maxValue = filters.max_price ?? 5000000;
                if (value < maxValue) {
                  setFilters((p) => ({ ...p, min_price: value }));
                }
              }}
              aria-label="Minimum price"
            />
            <input
              type="range"
              min={1000}
              max={5000000}
              step={1000}
              className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider"
              value={filters.max_price ?? 5000000}
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
        )}
      </div>

      {/* Facilities */}
      <div>
        <button
          type="button"
          onClick={() => setOpen((p) => ({ ...p, facilities: !p.facilities }))}
          className="w-full flex items-center justify-between"
        >
          <span className="block text-sm font-medium text-black">Facilities</span>
          <FiChevronDown className={`text-gray-600 transition-transform ${open.facilities ? 'rotate-180' : ''}`} />
        </button>
        {open.facilities && (
          <div className="mt-2 grid grid-cols-1 gap-2">
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
                  {facilityLabels[f] || f}
                </label>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="text-red-600 text-sm">
          {errors.map((e) => (
            <div key={e}>{e}</div>
          ))}
        </div>
      )}
    </div>
  );
});

QuestionsForm.displayName = 'QuestionsForm';

export default QuestionsForm;




