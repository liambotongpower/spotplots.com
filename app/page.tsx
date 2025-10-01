'use client';

import { useState, useEffect } from 'react';
import FloatingToggle from './components/FloatingToggle';
import AnySpotPage from './any-spot/page';
import YourSpotPage from './your-spot/page';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'any-spot' | 'your-spot'>('any-spot');

  // Health check for Python backend
  useEffect(() => {
    const checkBackendHealth = async () => {
      const startTime = Date.now();
      console.log('🔍 Checking Python backend health...');
      
      try {
        const response = await fetch('http://127.0.0.1:8000/health', {
          method: 'GET',
        });
        const data = await response.json();
        const duration = Date.now() - startTime;
        
        if (response.ok) {
          console.log(`✅ Backend is ready! (${duration}ms)`, data);
        } else {
          console.warn('⚠️ Backend responded but with an error:', data);
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Backend not available (${duration}ms):`, error);
        console.log('💡 Make sure the Python service is running: uvicorn app.lib.daft.service:app --host 127.0.0.1 --port 8000');
      }
    };
    
    checkBackendHealth();
  }, []);

  const handleToggle = (tab: 'any-spot' | 'your-spot') => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-white relative">
      <FloatingToggle onToggle={handleToggle} activeTab={activeTab} />
      {activeTab === 'any-spot' ? <AnySpotPage /> : <YourSpotPage />}
    </div>
  );
}