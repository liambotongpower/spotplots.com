'use client';

import { FaPlus, FaMicrophone, FaHome, FaSearch } from 'react-icons/fa';
import { } from 'react-icons/fi';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddressDropdown from '../components/AddressDropdown';

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
  
  const loadingTasks = useMemo(() => [
    'Analyzing location',
    'Searching listings',
    'Calculating distances',
    'Fetching property details',
    'Preparing results'
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

  // Loading state with 2-second delay
  useEffect(() => {
    if (query) {
      setIsLoading(true);
      setCurrentTask(0);
      
      // Cycle through tasks
      const taskInterval = setInterval(() => {
        setCurrentTask((prev) => {
          if (prev < loadingTasks.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 400); // 2000ms / 5 tasks = 400ms per task
      
      const timer = setTimeout(() => {
        setIsLoading(false);
        clearInterval(taskInterval);
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(taskInterval);
      };
    }
  }, [query, loadingTasks.length]);

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
          <div className="flex">
            {/* Left Margin */}
            <div className="w-80 flex-shrink-0 px-6">
              {/* Left margin content can be added here if needed */}
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 px-6">
              {isLoading && (
                <div className="fixed inset-0 top-16 flex flex-col justify-center items-center">
                  <Loader />
                  <div className="mt-8 text-gray-600 text-lg font-medium">
                    {loadingTasks[currentTask]} ({Math.round(((currentTask + 1) / loadingTasks.length) * 100)}%)
                  </div>
                </div>
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