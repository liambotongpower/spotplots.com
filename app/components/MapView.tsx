'use client';

import { useEffect, useRef, useState } from 'react';

interface MapViewProps {
  address: string;
}

export default function MapView({ address }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!address) {
      setError('No address provided');
      setIsLoading(false);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    console.log('API Key exists:', !!apiKey);
    
    if (!apiKey) {
      setError('Google Maps API key not found. Please restart the dev server.');
      setIsLoading(false);
      return;
    }

    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded');
        initializeMap();
        return;
      }

      console.log('Loading Google Maps script...');
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', initializeMap);
        return;
      }

      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps script loaded successfully');
        initializeMap();
      };
      script.onerror = (e) => {
        console.error('Failed to load Google Maps script', e);
        setError('Failed to load Google Maps. Check your API key and network connection.');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      console.log('Initializing map...', { mapRefExists: !!mapRef.current, googleExists: !!window.google });
      
      if (!mapRef.current) {
        console.error('Map ref not available');
        setError('Map container not ready');
        setIsLoading(false);
        return;
      }

      if (!window.google || !window.google.maps) {
        console.error('Google Maps API not loaded');
        setError('Google Maps API not loaded');
        setIsLoading(false);
        return;
      }

      const geocoder = new google.maps.Geocoder();
      console.log('Geocoding address:', address);

      // Geocode the address to get coordinates
      geocoder.geocode({ address }, (results, status) => {
        console.log('Geocoding result:', { status, resultsCount: results?.length });
        
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          console.log('Location found:', location.toString());
          
          // Create the map
          const map = new google.maps.Map(mapRef.current!, {
            center: location,
            zoom: 15,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          });

          mapInstanceRef.current = map;

          // Add a marker
          new google.maps.Marker({
            position: location,
            map: map,
            title: address,
          });

          setIsLoading(false);
          console.log('Map initialized successfully');
        } else {
          console.error('Geocoding failed:', status);
          setError(`Unable to find location: ${status}`);
          setIsLoading(false);
        }
      });
    };

    loadGoogleMaps();
  }, [address]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center text-red-600">
          <p className="font-medium">Error loading map</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="text-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-full min-h-[400px] rounded-lg shadow-md"
      />
    </div>
  );
}

// Type declaration for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

