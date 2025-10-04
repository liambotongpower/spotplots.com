'use client';

import { FaPlus, FaMicrophone, FaHome, FaSearch, FaBus } from 'react-icons/fa';
import { } from 'react-icons/fi';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddressDropdown from '../components/AddressDropdown';
import DataPanel from '../components/DataPanel';
import Spacer from '../components/Spacer';
import SectionHeader from '../components/SectionHeader';

// Loader Component
function Loader() {
  return (
    <div className="loader-container">
      <div className="half"></div>
      <div className="half"></div>
      <style jsx>{`
        .loader-container {
          --uib-size: 135px;
          --uib-color: #2563eb;
          --uib-speed: 1.75s;
          --uib-bg-opacity: .1;
          position: relative;
          display: flex;
          flex-direction: column;
          height: var(--uib-size);
          width: var(--uib-size);
          transform: rotate(45deg);
          animation: rotate calc(var(--uib-speed) * 2) ease-in-out infinite;
        }

        .half {
          --uib-half-size: calc(var(--uib-size) * 0.435);
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          width: var(--uib-half-size);
          height: var(--uib-half-size);
          overflow: hidden;
          isolation: isolate;
        }

        .half:first-child {
          top: 8.25%;
          left: 8.25%;
          border-radius: 50% 50% calc(var(--uib-size) / 15);
        }

        .half:last-child {
          bottom: 8.25%;
          right: 8.25%;
          transform: rotate(180deg);
          align-self: flex-end;
          border-radius: 50% 50% calc(var(--uib-size) / 15);
        }

        .half:last-child::after {
          animation-delay: calc(var(--uib-speed) * -1);
        }

        .half::before {
          content: '';
          height: 100%;
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
          background-color: var(--uib-color);
          opacity: var(--uib-bg-opacity);
          transition: background-color 0.3s ease;
        }

        .half::after {
          content: '';
          position: relative;
          z-index: 1;
          display: block;
          background-color: var(--uib-color);
          height: 100%;
          transform: rotate(45deg) translate(-3%, 50%) scaleX(1.2);
          width: 100%;
          transform-origin: bottom right;
          border-radius: 0 0 calc(var(--uib-size) / 20) 0;
          animation: flow calc(var(--uib-speed) * 2) linear infinite both;
          transition: background-color 0.3s ease;
        }

        @keyframes flow {
          0% {
            transform: rotate(45deg) translate(-3%, 50%) scaleX(1.2);
          }
          30% {
            transform: rotate(45deg) translate(115%, 50%) scaleX(1.2);
          }

          30.001%,
          50% {
            transform: rotate(0deg) translate(-85%, -85%) scaleX(1);
          }

          80%,
          100% {
            transform: rotate(0deg) translate(0%, 0%) scaleX(1);
          }
        }

        @keyframes rotate {
          0%,
          30% {
            transform: rotate(45deg);
          }

          50%,
          80% {
            transform: rotate(225deg);
          }

          100% {
            transform: rotate(405deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function AnySpotPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const isResultsView = !!query;
  const [isLoading, setIsLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState(0);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [departuresResults, setDeparturesResults] = useState<any>(null);
  
  const loadingTasks = useMemo(() => [
    'Getting nearby stops',
    'Getting transport departures'
  ], []);

  // Stop count percentiles data for comparison
  const stopPercentiles = useMemo(() => [
    { percentile: 1, stop_count: 0 },
    { percentile: 2, stop_count: 0 },
    { percentile: 3, stop_count: 0 },
    { percentile: 4, stop_count: 0 },
    { percentile: 5, stop_count: 0 },
    { percentile: 6, stop_count: 0 },
    { percentile: 7, stop_count: 0 },
    { percentile: 8, stop_count: 0 },
    { percentile: 9, stop_count: 0 },
    { percentile: 10, stop_count: 0 },
    { percentile: 11, stop_count: 0 },
    { percentile: 12, stop_count: 0 },
    { percentile: 13, stop_count: 0 },
    { percentile: 14, stop_count: 0 },
    { percentile: 15, stop_count: 0 },
    { percentile: 16, stop_count: 0 },
    { percentile: 17, stop_count: 0 },
    { percentile: 18, stop_count: 0 },
    { percentile: 19, stop_count: 0 },
    { percentile: 20, stop_count: 0 },
    { percentile: 21, stop_count: 0 },
    { percentile: 22, stop_count: 0 },
    { percentile: 23, stop_count: 0 },
    { percentile: 24, stop_count: 0 },
    { percentile: 25, stop_count: 0 },
    { percentile: 26, stop_count: 0 },
    { percentile: 27, stop_count: 0 },
    { percentile: 28, stop_count: 0 },
    { percentile: 29, stop_count: 0 },
    { percentile: 30, stop_count: 0 },
    { percentile: 31, stop_count: 0 },
    { percentile: 32, stop_count: 0 },
    { percentile: 33, stop_count: 0 },
    { percentile: 34, stop_count: 0 },
    { percentile: 35, stop_count: 0 },
    { percentile: 36, stop_count: 0 },
    { percentile: 37, stop_count: 0 },
    { percentile: 38, stop_count: 0 },
    { percentile: 39, stop_count: 0 },
    { percentile: 40, stop_count: 0 },
    { percentile: 41, stop_count: 0 },
    { percentile: 42, stop_count: 0 },
    { percentile: 43, stop_count: 0 },
    { percentile: 44, stop_count: 0 },
    { percentile: 45, stop_count: 0 },
    { percentile: 46, stop_count: 0 },
    { percentile: 47, stop_count: 0 },
    { percentile: 48, stop_count: 0 },
    { percentile: 49, stop_count: 0 },
    { percentile: 50, stop_count: 0 },
    { percentile: 51, stop_count: 0 },
    { percentile: 52, stop_count: 0 },
    { percentile: 53, stop_count: 0 },
    { percentile: 54, stop_count: 0 },
    { percentile: 55, stop_count: 0 },
    { percentile: 56, stop_count: 0 },
    { percentile: 57, stop_count: 0 },
    { percentile: 58, stop_count: 0 },
    { percentile: 59, stop_count: 0 },
    { percentile: 60, stop_count: 0 },
    { percentile: 61, stop_count: 0 },
    { percentile: 62, stop_count: 0 },
    { percentile: 63, stop_count: 0 },
    { percentile: 64, stop_count: 0 },
    { percentile: 65, stop_count: 1 },
    { percentile: 66, stop_count: 1 },
    { percentile: 67, stop_count: 2 },
    { percentile: 68, stop_count: 2 },
    { percentile: 69, stop_count: 2 },
    { percentile: 70, stop_count: 2 },
    { percentile: 71, stop_count: 2 },
    { percentile: 72, stop_count: 2 },
    { percentile: 73, stop_count: 2 },
    { percentile: 74, stop_count: 2 },
    { percentile: 75, stop_count: 2 },
    { percentile: 76, stop_count: 2 },
    { percentile: 77, stop_count: 2 },
    { percentile: 78, stop_count: 2 },
    { percentile: 79, stop_count: 2 },
    { percentile: 80, stop_count: 3 },
    { percentile: 81, stop_count: 3 },
    { percentile: 82, stop_count: 4 },
    { percentile: 83, stop_count: 5 },
    { percentile: 84, stop_count: 5 },
    { percentile: 85, stop_count: 8 },
    { percentile: 86, stop_count: 10 },
    { percentile: 87, stop_count: 15 },
    { percentile: 88, stop_count: 20 },
    { percentile: 89, stop_count: 25 },
    { percentile: 90, stop_count: 29 },
    { percentile: 91, stop_count: 33 },
    { percentile: 92, stop_count: 35 },
    { percentile: 93, stop_count: 39 },
    { percentile: 94, stop_count: 43 },
    { percentile: 95, stop_count: 46 },
    { percentile: 96, stop_count: 50 },
    { percentile: 97, stop_count: 50 },
    { percentile: 98, stop_count: 50 },
    { percentile: 99, stop_count: 50 }
  ], []);
  
  const phrases = useMemo(() => [
    'Dublin',
    'Cork',
    'Limerick',
    'Galway',
    'Waterford',
    'Drogheda',
    'Dundalk',
    'Swords',
    'Bray',
    'Navan',
    'Kilkenny',
    'Ennis',
    'Carlow',
    'Tralee',
    'Newbridge',
    'Portlaoise',
    'Balbriggan',
    'Naas',
    'Athlone',
    'Mullingar'
  ], []);

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [inputValue, setInputValue] = useState(query);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Function to calculate percentile based on stop count
  const calculateStopPercentile = (stopCount: number) => {
    // Find all percentiles that have this exact stop count
    const matchingPercentiles = stopPercentiles.filter(p => p.stop_count === stopCount);
    
    if (matchingPercentiles.length === 0) {
      // If no exact match, find the highest percentile where stop count is <= our count
      for (let i = stopPercentiles.length - 1; i >= 0; i--) {
        if (stopCount >= stopPercentiles[i].stop_count) {
          return stopPercentiles[i].percentile;
        }
      }
      return 1; // If no stops, return 1st percentile
    }
    
    // Calculate average percentile for matching stop counts
    const averagePercentile = matchingPercentiles.reduce((sum, p) => sum + p.percentile, 0) / matchingPercentiles.length;
    return Math.round(averagePercentile);
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  const handleAddressSelect = (suggestion: any) => {
    const selectedText = suggestion.description;
    setInputValue(selectedText);
    setShowDropdown(false);
    // Immediately navigate using the selected address
    if (selectedText && selectedText.trim()) {
      router.push(`/any-spot?q=${encodeURIComponent(selectedText.trim())}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowDropdown(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setShowDropdown(false);
      router.push(`/any-spot?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const goHome = () => {
    router.push('/');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing effect
        if (displayedText.length < currentPhrase.length) {
          setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
        } else {
          // Start deleting after a pause
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        // Deleting effect
        if (displayedText.length > 0) {
          setDisplayedText(displayedText.slice(0, -1));
        } else {
          // Move to next phrase
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, isDeleting ? 100 : 150);

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentPhraseIndex, phrases]);

  // Geocode address and find nearby stops
  useEffect(() => {
    const geocodeAddressAndFindStops = async () => {
      if (query) {
        // Start loading when we begin
        setIsLoading(true);
        setCurrentTask(0);
        setSearchResults(null);
        
        try {
          // First, geocode the address
          const geocodeResponse = await fetch(`/api/places/geocode?address=${encodeURIComponent(query)}`);
          const geocodeData = await geocodeResponse.json();
          
          if (geocodeResponse.ok && geocodeData.coordinates) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📍 ADDRESS GEOCODING RESULTS');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Address:', query);
            console.log('Formatted Address:', geocodeData.formatted_address);
            console.log('Coordinates:', geocodeData.coordinates);
            console.log('  Latitude:', geocodeData.coordinates.lat);
            console.log('  Longitude:', geocodeData.coordinates.lng);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // Then, find nearby stops using manual method
            try {
              const stopsResponse = await fetch(
                `/api/get_nearby_stops?lat=${geocodeData.coordinates.lat}&lng=${geocodeData.coordinates.lng}&maxDistance=1000&limit=1000&useManual=true`
              );
              const stopsData = await stopsResponse.json();
              
              if (stopsResponse.ok && stopsData.success) {
                
                // Store results
                setSearchResults({
                  address: query,
                  formattedAddress: geocodeData.formatted_address,
                  coordinates: geocodeData.coordinates,
                  stops: stopsData.results.stops,
                  totalCount: stopsData.results.count
                });
                
                // Move to next task - getting departures
                setCurrentTask(1);
                
                // Now get transport departures using the OPTIMIZED method
                try {
                  const departuresResponse = await fetch('/api/get_nearby_routes', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      stops: stopsData.results.stops
                    })
                  });
                  const departuresData = await departuresResponse.json();
                  
                  if (departuresResponse.ok && departuresData.success) {
                    // Store routes results
                    setDeparturesResults({
                      routes: departuresData.results.routes,
                      totalRoutes: departuresData.results.totalRoutes,
                      totalDepartures: departuresData.results.totalDepartures,
                      csv: departuresData.results.csv,
                      note: departuresData.results.note
                    });
                  } else {
                    console.error('Failed to find transport departures:', departuresData.error);
                    console.error('Response status:', departuresResponse.status);
                    console.error('Response data:', departuresData);
                  }
                } catch (departuresError) {
                  console.error('Error finding transport departures:', departuresError);
                }
                
                // Hide loader when all tasks are complete
                setIsLoading(false);
              } else {
                console.error('Failed to find nearby stops:', stopsData.error);
                setIsLoading(false);
              }
            } catch (stopsError) {
              console.error('Error finding nearby stops:', stopsError);
              setIsLoading(false);
            }
          } else {
            console.error('Failed to geocode address:', geocodeData.error);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error geocoding address:', error);
          setIsLoading(false);
        }
      }
    };
    
    geocodeAddressAndFindStops();
  }, [query]);


  // Results view (Google-like layout)
  if (isResultsView) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-16 relative">
              {/* Home Button */}
              <button
                onClick={goHome}
                className="absolute left-0 flex items-center text-blue-600 hover:text-blue-700 transition-colors"
              >
                <FaHome className="mr-2" />
                <span className="font-medium">Home</span>
              </button>

              {/* Search Bar */}
              <div className="max-w-2xl w-full mx-8">
                <form onSubmit={handleSubmit}>
                  <div ref={searchContainerRef} className="relative">
                    <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-300 px-4 py-2">
                      <FaSearch className="text-blue-400 mr-3" />
                      <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setShowDropdown(true)}
                        className="flex-grow bg-transparent outline-none text-gray-700"
                        placeholder="Enter a place you'd like to explore"
                      />
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={`mx-2 transition-colors ${
                          isListening 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={isListening ? 'Stop listening' : 'Start voice input'}
                        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                        type="button"
                      >
                        <FaMicrophone />
                      </button>
                    
                    </div>
                    <AddressDropdown
                      inputValue={inputValue}
                      onSelect={handleAddressSelect}
                      isVisible={showDropdown}
                      onClose={() => setShowDropdown(false)}
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */
        }
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-16">
          {isLoading && (
            <div className="fixed inset-0 top-16 flex flex-col justify-center items-center">
              <Loader />
              <div className="mt-8 text-gray-600 text-lg font-medium">
                {loadingTasks[currentTask]} ({Math.round(((currentTask + 1) / loadingTasks.length) * 100)}%)
              </div>
            </div>
          )}
          
          {/* Results Panel */
          }
          {!isLoading && searchResults && (
            <div>
              <Spacer size="md" />
              <SectionHeader title="Transport" />
              <Spacer size="md" />
              <div className="flex flex-col gap-4">
                <DataPanel
                  title="Nearby Stops"
                  subtitle={`Found ${searchResults.totalCount} stops within 1000m of ${searchResults.formattedAddress}`}
                  data={searchResults.stops}
                  totalCount={searchResults.totalCount}
                  maxDisplay={5}
                  className="w-full"
                  userLocation={searchResults.coordinates}
                  address={searchResults.formattedAddress}
                  score={calculateStopPercentile(searchResults.totalCount)}
                />
                {departuresResults && (
                  <DataPanel
                    title="Nearby Routes"
                    subtitle={`Found ${departuresResults.totalRoutes} unique routes with ${departuresResults.totalDepartures} daily departures within 1000m (daily average based on schedule data)`}
                    data={departuresResults.routes.map((route: any) => ({
                      route: route.route,
                      departures: route.departures
                    }))}
                    totalCount={departuresResults.totalRoutes}
                    maxDisplay={10}
                    className="w-full"
                    score={92}
                  />
                )}
              </div>

              <Spacer size="xl" />
              <SectionHeader title="Amenities" />
              <Spacer size="lg" />

              <Spacer size="xl" />
              <SectionHeader title="Safety" />
              <Spacer size="lg" />

              <Spacer size="xl" />
              <SectionHeader title="Education" />
              <Spacer size="lg" />

              <Spacer size="xl" />
              <SectionHeader title="Current Value and Future Value" />
              <Spacer size="lg" />

              <Spacer size="xl" />
              <SectionHeader title="Connectivity" />
              <Spacer size="lg" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Input view (original design)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="text-center mb-6">
        <div className="text-2xl text-gray-600">
          Show me <span className="text-blue-600 font-medium min-h-[2rem] inline-block">
            {displayedText}
            <span className="animate-pulse">|</span>
          </span>
        </div>
      </div>
      <div className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div ref={searchContainerRef} className="relative">
            <div className="flex items-center bg-white rounded-full shadow-md px-6 py-4">
              <FaPlus className="text-blue-400 mr-4" />
              <input
                type="text"
                placeholder="Tell me where you want to go"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowDropdown(true)}
                className="flex-grow bg-transparent outline-none text-lg text-gray-700"
              />
              <button
                onClick={isListening ? stopListening : startListening}
                className={`mx-4 transition-colors ${
                  isListening 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                type="button"
              >
                <FaMicrophone />
              </button>
            
            </div>
            <AddressDropdown
              inputValue={inputValue}
              onSelect={handleAddressSelect}
              isVisible={showDropdown}
              onClose={() => setShowDropdown(false)}
            />
          </div>
        </form>
      </div>
    </div>
  );
}