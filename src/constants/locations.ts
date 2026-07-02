/**
 * The 16 Immutable Ghanaian Regions — sorted alphabetically.
 * These are structural constants: never fetched from the database.
 */
export const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
] as const;

export type GhanaRegion = (typeof GHANA_REGIONS)[number];
