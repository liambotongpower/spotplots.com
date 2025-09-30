'use client';

import { FaPlus, FaMicrophone, FaHome, FaSearch } from 'react-icons/fa';
import { } from 'react-icons/fi';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddressDropdown from '../components/AddressDropdown';

export default function AnySpotPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const isResultsView = !!query;
  
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

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <h1 className="text-2xl font-medium mb-4">Search results will appear here...</h1>
            <p className="text-gray-500">Query: &quot;{query}&quot;</p>
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