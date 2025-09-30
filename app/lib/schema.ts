export type Filters = {
  counties: string[];
  search_type: string[];
  property_type: string[];
  min_beds?: number | null;
  max_beds?: number | null;
  min_baths?: number | null;
  max_baths?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  facilities: string[];
  sort_type: string[];
  page: number;
};

export const defaultFilters: Filters = {
  counties: [],
  search_type: [],
  property_type: [],
  min_beds: 1,
  max_beds: null,
  min_baths: 1,
  max_baths: null,
  min_price: 1000,
  max_price: 10000000,
  facilities: [],
  sort_type: [],
  page: 1,
};

