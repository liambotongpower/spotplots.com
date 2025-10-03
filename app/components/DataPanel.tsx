'use client';

interface DataPanelProps {
  title: string;
  subtitle?: string;
  data: any[];
  totalCount?: number;
  maxDisplay?: number;
  className?: string;
  userLocation?: { lat: number; lng: number };
  address?: string;
  score?: number;
}

// Utility function to convert data to CSV format
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from the first item
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csvHeaders = headers.join(',');
  
  // Create CSV data rows
  const csvRows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      // Escape commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

// Utility function to download CSV file
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Utility function to download image file
function downloadImage(imageUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function DataPanel({ 
  title, 
  subtitle, 
  data, 
  totalCount, 
  maxDisplay = 5,
  className = "",
  userLocation,
  address,
  score
}: DataPanelProps) {
  const displayData = data.slice(0, maxDisplay);
  const remainingCount = totalCount ? totalCount - maxDisplay : 0;

  // Function to get score color based on percentage
  const getScoreColor = (score: number) => {
    if (score >= 0 && score <= 16) {
      return 'text-red-800'; // Dark Red
    } else if (score > 16 && score <= 50) {
      return 'text-orange-600'; // Orange
    } else if (score > 50 && score <= 84) {
      return 'text-yellow-600'; // Yellowy Green
    } else if (score > 84 && score <= 100) {
      return 'text-green-500'; // Bright Green
    }
    return 'text-gray-900'; // Default fallback
  };

  // Check if this is a stop times panel
  const isStopTimesPanel = title === "Nearby Stop Times";
  
  // Determine the file extension for the download button
  const fileExtension = isStopTimesPanel ? "TXT" : "CSV";

  const handleDownloadData = () => {
    // Special handling for stop times - create txt file with departure times
    if (isStopTimesPanel) {
      // Format each stop's departure times as requested
      const lines = data.map((stop, index) => {
        // Extract just the time part from each departure_time (remove seconds if present)
        const formattedTimes = (stop.departure_times || [])
          .map((time: string) => {
            // If time format is HH:MM:SS, convert to HH:MM
            const match = time.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
            return match ? `${match[1]}:${match[2]}` : time;
          })
          .sort() // Sort times chronologically
          .slice(0, 100); // Limit to first 100 times for readability
        
        return `${index + 1}: '${stop.stop_id}', ${formattedTimes.join(', ')}`;
      });

      const txtContent = lines.join('\n');
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.txt`;
      
      // Use the same download mechanism, but with text/plain content type
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Regular CSV download for other data panels
      const csvContent = convertToCSV(data);
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.csv`;
      downloadCSV(csvContent, filename);
    }
  };

  const handleDownloadMap = async () => {
    if (!userLocation || !data || data.length === 0) {
      console.error('Missing user location or stops data for map generation');
      return;
    }

    try {
      const response = await fetch('/api/generate_map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stops: data,
          userLocation,
          address
        }),
      });

      if (!response.ok) {
        throw new Error(`Map generation failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.imageUrl) {
        const timestamp = new Date().toISOString().split('T')[0];
        
        if (result.provider === 'openstreetmap-leaflet-screenshot') {
          // For OpenStreetMap screenshot, download as PNG
          const filename = `nearby-stops-map-${timestamp}.png`;
          downloadImage(result.imageUrl, filename);
          console.log('📸 OpenStreetMap screenshot downloaded');
          console.log(`📊 Showing ${result.displayedStops} of ${result.stopsCount} stops on map`);
        } else if (result.provider === 'openstreetmap-leaflet') {
          // For OpenStreetMap HTML, download as HTML file
          const filename = `nearby-stops-map-${timestamp}.html`;
          downloadImage(result.imageUrl, filename);
          console.log('🗺️ OpenStreetMap HTML map downloaded');
          console.log(`📊 Showing ${result.displayedStops} of ${result.stopsCount} stops on map`);
        } else {
          // For other providers, download as PNG
          const filename = `nearby-stops-map-${timestamp}.png`;
          downloadImage(result.imageUrl, filename);
        }
      } else {
        console.error('Map generation failed:', result.error);
      }
    } catch (error) {
      console.error('Error generating map:', error);
    }
  };

  const handleDownloadChart = async () => {
    if (!data || data.length === 0) {
      console.error('No routes data available for chart generation');
      return;
    }

    try {
      const response = await fetch('/api/chart_generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routes: data
        }),
      });

      if (!response.ok) {
        throw new Error(`Chart generation failed: ${response.status}`);
      }

      // Get the image blob from the response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const totalCharts = Math.ceil(data.length / 20);
      const filename = totalCharts > 1 
        ? `transport-routes-charts-${totalCharts}-charts-${timestamp}.svg`
        : `transport-routes-chart-${timestamp}.svg`;
      
      downloadImage(url, filename);
      console.log(`📊 Transport routes chart${totalCharts > 1 ? 's' : ''} downloaded (${totalCharts} chart${totalCharts > 1 ? 's' : ''})`);
    } catch (error) {
      console.error('Error generating chart:', error);
    }
  };

  const handleDownloadInsights = () => {
    alert('No insights available');
  };

  const handleOpenSettings = () => {
    alert('No settings available');
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 py-4 px-6 my-6 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            {score !== undefined && (
              <span className="text-2xl font-bold text-gray-900">
                {score}
              </span>
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {title}
            </h2>
          </div>
          {data && data.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Download Insights Button */}
              <button
                onClick={handleDownloadInsights}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                title="Download insights"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>

              {/* View Map/Chart Button */}
              <button
                onClick={title === 'Nearby Stops' ? handleDownloadMap : handleDownloadChart}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                title={title === 'Nearby Stops' ? 'Download Map' : 'Download Chart'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {title === 'Nearby Stops' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  )}
                </svg>
              </button>
              
              {/* Download Button */}
              <button
                onClick={handleDownloadData}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title={`Download data as ${fileExtension}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              
              {/* Settings Button */}
              <button
                onClick={handleOpenSettings}
                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                title="Settings"
                aria-label="Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5.25a.75.75 0 110-1.5.75.75 0 010 1.5zm0 7.5a.75.75 0 110-1.5.75.75 0 010 1.5zm0 7.5a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
              </button>
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-base text-gray-600 mt-2 h-10 leading-5 overflow-hidden">
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="space-y-2 hidden">
        {displayData.map((item: any, index: number) => (
          <div key={item.stop_id || item.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100 hover:bg-gray-100 transition-colors">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold text-xs">{index + 1}</span>
              </div>
              <h3 className="text-base font-medium text-gray-900">{item.stop_name || item.name}</h3>
            </div>
            <div className="text-right">
              {/* Show formattedDepartures if available, otherwise show distance */}
              {item.formattedDepartures ? (
                item.formattedDepartures
              ) : (
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(item.distance)}m
                </div>
              )}
            </div>
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-600">
              ... and <span className="font-semibold text-blue-600">{remainingCount}</span> more stops
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
