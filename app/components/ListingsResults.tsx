'use client';

import { FaSearch } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Listing = {
  title?: string | null;
  price?: string | number | null;
  daft_link?: string | null;
};

type Props = {
  listings: Listing[];
};

export default function ListingsResults({ listings }: Props) {
  const router = useRouter();
  const [validatingAddress, setValidatingAddress] = useState<number | null>(null);

  const handleSearchClick = async (listing: Listing, index: number) => {
    const address = listing.title || '';
    if (!address.trim()) return;

    setValidatingAddress(index);
    
    try {
      // Validate address through Google Places API
      const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(address)}`);
      const data = await response.json();
      
      if (response.ok && data.suggestions && data.suggestions.length > 0) {
        // Use the first (best match) validated address
        const validatedAddress = data.suggestions[0].description;
        router.push(`/any-spot?q=${encodeURIComponent(validatedAddress)}`);
      } else {
        // If validation fails, use original address
        console.warn('Address validation failed, using original address');
        router.push(`/any-spot?q=${encodeURIComponent(address.trim())}`);
      }
    } catch (error) {
      console.error('Error validating address:', error);
      // Fallback to original address if API call fails
      router.push(`/any-spot?q=${encodeURIComponent(address.trim())}`);
    } finally {
      setValidatingAddress(null);
    }
  };

  if (!listings || listings.length === 0) {
    return <div className="text-gray-500 text-sm">No results yet.</div>;
  }
  return (
    <div className="space-y-3 text-black">
      {listings.map((l, idx) => (
        <div key={idx} className="border rounded-md p-3 relative">
          <div className="font-medium text-black">{l.title || 'Untitled'}</div>
          <div className="text-sm text-black">{l.price ?? ''}</div>
          {l.daft_link && (
            <a href={l.daft_link} target="_blank" rel="noreferrer" className="text-green-600 text-sm underline">
              View listing
            </a>
          )}
          <button 
            className="absolute bottom-3 right-8 p-9C text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            onClick={() => handleSearchClick(l, idx)}
            disabled={validatingAddress === idx}
            title="View details"
          >
            {validatingAddress === idx ? (
              <div className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-gray-600"></div>
            ) : (
              <FaSearch size={14} />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}


