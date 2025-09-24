'use client';

import { useState } from 'react';
import { FaMapMarkerAlt, FaSearch } from 'react-icons/fa';

interface FloatingToggleProps {
  onToggle: (activeTab: 'any-spot' | 'your-spot') => void;
  activeTab: 'any-spot' | 'your-spot';
}

export default function FloatingToggle({ onToggle, activeTab }: FloatingToggleProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-full shadow-lg border border-gray-200 p-1">
        <div className="flex">
          <button
            onClick={() => onToggle('any-spot')}
            className={`flex items-center px-4 py-2 rounded-full transition-all duration-200 ${
              activeTab === 'any-spot'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <FaSearch className="mr-2 text-sm" />
            <span className="text-sm font-medium">Any Spot</span>
          </button>
          <button
            onClick={() => onToggle('your-spot')}
            className={`flex items-center px-4 py-2 rounded-full transition-all duration-200 ${
              activeTab === 'your-spot'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <FaMapMarkerAlt className="mr-2 text-sm" />
            <span className="text-sm font-medium">Your Spot</span>
          </button>
        </div>
      </div>
    </div>
  );
}
