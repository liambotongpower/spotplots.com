export interface Filters {
  counties: string[];
  search_type: string | null;
  property_type: string | null;
  min_beds: number | null;
  max_beds: number | null;
  min_baths: number | null;
  max_baths: number | null;
  min_price: number | null;
  max_price: number | null;
  facilities: string[];
  sort_type: string | null;
  page: number;
}

export const defaultFilters: Filters = {
  counties: [],
  search_type: null,
  property_type: null,
  min_beds: null,
  max_beds: null,
  min_baths: null,
  max_baths: null,
  min_price: null,
  max_price: null,
  facilities: [],
  sort_type: null,
  page: 1,
};
