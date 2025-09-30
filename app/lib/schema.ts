export type Filters = {
  counties: string[];
  search_type?: string | null;
  property_type?: string | null;
  min_beds?: number | null;
  max_beds?: number | null;
  min_baths?: number | null;
  max_baths?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  facilities: string[];
  sort_type?: string | null;
  page: number;
};

export const defaultFilters: Filters = {
  counties: [],
  search_type: null,
  property_type: null,
  min_beds: null,
  max_beds: null,
  min_baths: null,
  max_baths: null,
  min_price: 1000,
  max_price: 10000000,
  facilities: [],
  sort_type: "MOST_RECENT",
  page: 1,
};

