import { Filters } from "./schema";

export function validateFilters(filters: Filters): string[] {
  const errors: string[] = [];
  const { min_beds, max_beds, min_baths, max_baths, min_price, max_price } = filters;

  if (min_beds != null && max_beds != null && min_beds > max_beds) {
    errors.push("Min bedrooms cannot exceed max bedrooms");
  }
  if (min_baths != null && max_baths != null && min_baths > max_baths) {
    errors.push("Min bathrooms cannot exceed max bathrooms");
  }
  if (min_price != null && max_price != null && min_price > max_price) {
    errors.push("Min price cannot exceed max price");
  }
  return errors;
}

