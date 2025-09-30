import { Filters } from "./schema";

const KEY = "your-spot-filters";

export function loadFilters(): Partial<Filters> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveFilters(filters: Filters): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(filters));
  } catch {}
}

