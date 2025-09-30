'use client';

type Props = {
  page: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export default function PaginationControls({ page, hasPrev, hasNext, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={!hasPrev}
        onClick={onPrev}
        className={`px-3 py-1 rounded-md border text-sm ${hasPrev ? 'bg-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
      >
        Prev
      </button>
      <div className="text-sm text-gray-600">Page {page}</div>
      <button
        type="button"
        disabled={!hasNext}
        onClick={onNext}
        className={`px-3 py-1 rounded-md border text-sm ${hasNext ? 'bg-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
      >
        Next
      </button>
    </div>
  );
}


