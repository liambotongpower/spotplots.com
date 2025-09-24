'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaHome, FaSearch, FaMicrophone } from 'react-icons/fa';
import { FiActivity } from 'react-icons/fi';

export default function YourSpotResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [inputValue, setInputValue] = useState(query);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

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
      router.push(`/your-spot/results?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const goHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Home Button */}
            <button
              onClick={goHome}
              className="flex items-center text-green-600 hover:text-green-700 transition-colors"
            >
              <FaHome className="mr-2" />
              <span className="font-medium">Home</span>
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSubmit}>
                <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-300 px-4 py-2">
                  <FaSearch className="text-green-400 mr-3" />
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-grow bg-transparent outline-none text-gray-700"
                    placeholder="Search for places..."
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
                  <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full">
                    <FiActivity className="text-green-400 text-sm" />
                  </div>
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
          <p className="text-gray-500">Query: "{query}"</p>
        </div>
      </div>
    </div>
  );
}
