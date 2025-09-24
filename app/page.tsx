'use client';

import { useState } from 'react';
import FloatingToggle from './components/FloatingToggle';
import AnySpotPage from './any-spot/page';
import YourSpotPage from './your-spot/page';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'any-spot' | 'your-spot'>('any-spot');

  const handleToggle = (tab: 'any-spot' | 'your-spot') => {
    // Navigate to the clean URL
    if (tab === 'any-spot') {
      window.location.href = '/any-spot';
    } else {
      window.location.href = '/your-spot';
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      <FloatingToggle onToggle={handleToggle} activeTab={activeTab} />
      {activeTab === 'any-spot' ? <AnySpotPage /> : <YourSpotPage />}
    </div>
  );
}