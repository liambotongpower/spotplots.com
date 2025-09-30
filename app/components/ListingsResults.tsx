'use client';

type Listing = {
  title?: string | null;
  price?: string | number | null;
  daft_link?: string | null;
};

type Props = {
  listings: Listing[];
};

export default function ListingsResults({ listings }: Props) {
  if (!listings || listings.length === 0) {
    return <div className="text-gray-500 text-sm">No results yet.</div>;
  }
  return (
    <div className="space-y-3 text-black">
      {listings.map((l, idx) => (
        <div key={idx} className="border rounded-md p-3">
          <div className="font-medium text-black">{l.title || 'Untitled'}</div>
          <div className="text-sm text-black">{l.price ?? ''}</div>
          {l.daft_link && (
            <a href={l.daft_link} target="_blank" rel="noreferrer" className="text-green-600 text-sm underline">
              View listing
            </a>
          )}
        </div>
      ))}
    </div>
  );
}


