'use client';

import { useState, useEffect, useRef } from 'react';

interface AddressSuggestion {
  id: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface AddressDropdownProps {
  inputValue: string;
  onSelect: (suggestion: AddressSuggestion) => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function AddressDropdown({ 
  inputValue, 
  onSelect, 
  isVisible, 
  onClose 
}: AddressDropdownProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search function
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!inputValue.trim() || inputValue.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(inputValue)}`);
        const data = await response.json();
        
        if (response.ok) {
          setSuggestions(data.suggestions || []);
        } else {
          console.error('Error fetching suggestions:', data.error);
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [inputValue]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            onSelect(suggestions[selectedIndex]);
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
  }, [isVisible, suggestions, selectedIndex, onSelect, onClose]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible || (!loading && suggestions.length === 0)) {
    return null;
  }

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
    >
      {loading ? (
        <div className="px-4 py-3 text-gray-500 text-center">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2">Searching addresses...</span>
        </div>
      ) : (
        suggestions.map((suggestion, index) => (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion)}
            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
              index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 text-sm">
                {suggestion.mainText}
              </span>
              {suggestion.secondaryText && (
                <span className="text-gray-500 text-xs mt-1">
                  {suggestion.secondaryText}
                </span>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );
}
