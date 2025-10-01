'use client';

type Props = {
  page: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export default function PaginationControls({ page, hasPrev, hasNext, onPrev, onNext }: Props) {
  // For debugging
  console.log('Pagination state:', { page, hasPrev, hasNext });
  
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={!hasPrev}
        onClick={onPrev}
        className={`px-4 py-2 rounded-md border text-sm font-medium ${
          hasPrev 
            ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300' 
            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
      >
        Prev
      </button>
      <div className="text-sm font-medium text-gray-700">Page {page}</div>
      <button
        type="button"
        disabled={!hasNext}
        onClick={onNext}
        className={`px-5 py-2 rounded-md border text-sm font-medium ${
          hasNext 
            ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-300 shadow-sm' 
            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
      >
        Next
      </button>
    </div>
  );
}


