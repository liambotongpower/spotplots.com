'use client';

import { useState } from 'react';
import FloatingToggle from './components/FloatingToggle';
import AnySpotPage from './any-spot/page';
import YourSpotPage from './your-spot/page';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'any-spot' | 'your-spot'>('any-spot');

  const handleToggle = (tab: 'any-spot' | 'your-spot') => {
    // Switch content locally without navigation
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-white relative">
      <FloatingToggle onToggle={handleToggle} activeTab={activeTab} />
      {activeTab === 'any-spot' ? <AnySpotPage /> : <YourSpotPage />}
    </div>
  );
}