'use client';

import { FaPlus, FaMicrophone, FaHome, FaSearch } from 'react-icons/fa';
import { } from 'react-icons/fi';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CountyDropdown, { ALL_COUNTIES } from '../components/CountyDropdown';
import QuestionsForm from '../components/QuestionsForm';
import ListingsResults from '../components/ListingsResults';
import PaginationControls from '../components/PaginationControls';
import { Filters, defaultFilters } from '../lib/schema';

export default function YourSpotPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const isResultsView = !!query;
  const phrases = useMemo(() => [
    'college flat',
    'dream cottage', 
    'home away from home',
    'new family home',
    'next adventure',
    'spot'
  ], []);

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [inputValue, setInputValue] = useState(query);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [showCountyDropdown, setShowCountyDropdown] = useState(false);
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({ ...defaultFilters });
  const [listings, setListings] = useState<any[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Keep input and selected counties in sync with URL (?q=...)
  useEffect(() => {
    setInputValue(query);

    // Parse counties from q (comma or space separated)
    const tokens = query
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const canonical = new Set(ALL_COUNTIES.map((c) => c.toLowerCase()));
    const picked = tokens
      .map((t) => t.toLowerCase())
      .filter((t) => canonical.has(t));
    const pickedUniqueLower = Array.from(new Set(picked));
    const pickedProper = pickedUniqueLower.map((t) =>
      ALL_COUNTIES.find((c) => c.toLowerCase() === t) as string
    );
    setSelectedCounties(pickedProper);

    // Update filters and trigger search when we have a query
    if (query && pickedProper.length > 0) {
      const nextFilters: Filters = { ...defaultFilters, counties: pickedProper, page: 1 };
      setFilters(nextFilters);
      (async () => {
        setIsLoading(true);
        try {
          const resp = await fetch('/api/listings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nextFilters),
          });
          const data = await resp.json();
          setListings(Array.isArray(data.listings) ? data.listings : []);
          setHasNextPage(!!data.hasNextPage);
        } catch (e) {
          setListings([]);
          setHasNextPage(false);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [query]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(`/your-spot?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const handleToggleCounty = (county: string) => {
    setSelectedCounties((prev) => {
      const exists = prev.includes(county);
      if (exists) return prev.filter((c) => c !== county);
      return [...prev, county];
    });
  };

  const handleApplyCounties = () => {
    const queryText = selectedCounties.join(', ');
    setInputValue(queryText);
    setShowCountyDropdown(false);
    if (queryText.trim()) {
      router.push(`/your-spot?q=${encodeURIComponent(queryText.trim())}`);
    }
  };

  const handleClearCounties = () => {
    setSelectedCounties([]);
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
                className="absolute left-0 flex items-center text-green-600 hover:text-green-700 transition-colors"
              >
                <FaHome className="mr-2" />
                <span className="font-medium">Home</span>
              </button>

              {/* Search Bar */}
              <div className="max-w-2xl w-full mx-8">
                <form onSubmit={handleSubmit}>
                  <div ref={searchContainerRef} className="relative">
                    <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-300 px-4 py-2">
                    <FaSearch className="text-green-400 mr-3" />
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => { setInputValue(e.target.value); setShowCountyDropdown(true); }}
                      onFocus={() => setShowCountyDropdown(true)}
                      onKeyPress={handleKeyPress}
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
                    <CountyDropdown
                      inputValue={inputValue}
                      isVisible={showCountyDropdown}
                      selected={selectedCounties}
                      onToggle={handleToggleCounty}
                      onApply={handleApplyCounties}
                      onClear={handleClearCounties}
                      onClose={() => setShowCountyDropdown(false)}
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <QuestionsForm
                initialFilters={filters}
                onSearch={async (f) => {
                  setFilters(f);
                  setIsLoading(true);
                  try {
                    const resp = await fetch('/api/listings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(f),
                    });
                    const data = await resp.json();
                    setListings(Array.isArray(data.listings) ? data.listings : []);
                    setHasNextPage(!!data.hasNextPage);
                  } catch (e) {
                    setListings([]);
                    setHasNextPage(false);
                  } finally {
                    setIsLoading(false);
                  }
                }}
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-700 font-medium">Results</div>
                <PaginationControls
                  page={filters.page}
                  hasPrev={filters.page > 1}
                  hasNext={hasNextPage}
                  onPrev={async () => {
                    if (filters.page <= 1) return;
                    const next = { ...filters, page: filters.page - 1 };
                    setFilters(next);
                    setIsLoading(true);
                    try {
                      const resp = await fetch('/api/listings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(next),
                      });
                      const data = await resp.json();
                      setListings(Array.isArray(data.listings) ? data.listings : []);
                      setHasNextPage(!!data.hasNextPage);
                    } catch (e) {
                      // ignore
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  onNext={async () => {
                    const next = { ...filters, page: filters.page + 1 };
                    setFilters(next);
                    setIsLoading(true);
                    try {
                      const resp = await fetch('/api/listings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(next),
                      });
                      const data = await resp.json();
                      setListings(Array.isArray(data.listings) ? data.listings : []);
                      setHasNextPage(!!data.hasNextPage);
                    } catch (e) {
                      // ignore
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                />
              </div>
              {isLoading ? (
                <div className="text-gray-500 text-sm">Loading…</div>
              ) : (
                <ListingsResults listings={listings} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Input view (original design)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="text-center mb-6">
        <div className="text-2xl text-gray-600">
          Find your <span className="text-green-600 font-medium min-h-[2rem] inline-block">
            {displayedText}
            <span className="animate-pulse">|</span>
          </span>
        </div>
      </div>
      <div className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div ref={searchContainerRef} className="relative">
            <div className="flex items-center bg-white rounded-full shadow-md px-6 py-4">
            <FaPlus className="text-green-400 mr-4" />
            <input
              type="text"
              placeholder="Enter a place you'd like to explore"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setShowCountyDropdown(true); }}
              onFocus={() => setShowCountyDropdown(true)}
              onKeyPress={handleKeyPress}
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
            <CountyDropdown
              inputValue={inputValue}
              isVisible={showCountyDropdown}
              selected={selectedCounties}
              onToggle={handleToggleCounty}
              onApply={handleApplyCounties}
              onClear={handleClearCounties}
              onClose={() => setShowCountyDropdown(false)}
            />
          </div>
        </form>
      </div>
    </div>
  );
}