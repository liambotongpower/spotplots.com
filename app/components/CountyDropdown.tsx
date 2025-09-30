'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface CountyDropdownProps {
  inputValue: string;
  isVisible: boolean;
  selected: string[];
  onToggle: (county: string) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}

export const ALL_COUNTIES: string[] = [
  'Antrim', 'Armagh', 'Carlow', 'Cavan', 'Clare', 'Cork', 'Derry', 'Donegal', 'Down',
  'Dublin', 'Fermanagh', 'Galway', 'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim',
  'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon',
  'Sligo', 'Tipperary', 'Tyrone', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow'
];

export default function CountyDropdown({
  inputValue,
  isVisible,
  selected,
  onToggle,
  onApply,
  onClear,
  onClose,
}: CountyDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return ALL_COUNTIES;

    // Rank counties by startsWith, then includes, then Levenshtein-ish length diff
    const startsWith: string[] = [];
    const includes: string[] = [];
    for (const county of ALL_COUNTIES) {
      const c = county.toLowerCase();
      if (c.startsWith(query)) startsWith.push(county);
      else if (c.includes(query)) includes.push(county);
    }
    return [...startsWith, ...includes];
  }, [inputValue]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if ((e.metaKey || e.ctrlKey)) {
            onApply();
          } else if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            onToggle(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, suggestions, selectedIndex, onToggle, onApply, onClose]);

  // Reset on new suggestions
  useEffect(() => setSelectedIndex(-1), [suggestions]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isVisible) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
    >
      {suggestions.length === 0 ? (
        <div className="px-4 py-3 text-gray-500 text-center">No matches</div>
      ) : (
        suggestions.map((county, index) => {
          const checkboxId = `county-${county.toLowerCase().replace(/\s+/g, '-')}`;
          return (
            <div
              key={county}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={selected.includes(county)}
                  onChange={() => onToggle(county)}
                  aria-label={`Select ${county}`}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={checkboxId} className="font-medium text-gray-900 text-sm cursor-pointer select-none">
                  {county}
                </label>
              </div>
            </div>
          );
        })
      )}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex items-center justify-between">
        <span className="text-xs text-gray-600 ml-1">{selected.length} selected</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onApply}
            className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}


