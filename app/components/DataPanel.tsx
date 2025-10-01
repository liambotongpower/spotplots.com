'use client';

interface DataPanelProps {
  title: string;
  subtitle?: string;
  data: any[];
  totalCount?: number;
  maxDisplay?: number;
  className?: string;
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

export default function DataPanel({ 
  title, 
  subtitle, 
  data, 
  totalCount, 
  maxDisplay = 5,
  className = ""
}: DataPanelProps) {
  const displayData = data.slice(0, maxDisplay);
  const remainingCount = totalCount ? totalCount - maxDisplay : 0;

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
          .map(time => {
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

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 py-10 px-12 my-6 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-gray-900">
            {title}
          </h2>
          {data && data.length > 0 && (
            <button
              onClick={handleDownloadData}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title={`Download data as ${fileExtension}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download {fileExtension}
            </button>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-600">
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
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
