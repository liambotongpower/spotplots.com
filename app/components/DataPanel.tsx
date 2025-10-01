'use client';

interface DataPanelProps {
  title: string;
  subtitle?: string;
  data: any[];
  totalCount?: number;
  maxDisplay?: number;
  className?: string;
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

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-4 ${className}`}>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {title}
        </h2>
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
              <div className="text-lg font-bold text-blue-600">
                {Math.round(item.distance)}m
              </div>
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
