// Inventory category vocabulary used by the shop. Keep this aligned with the real stockroom: phone parts and retail accessories, not a generic gadget catalogue.

export const WORKSHOP_CATEGORIES = [
  { value: "Phone Parts", hint: "Downboards, back glass, charging flex — by brand" },
] as const;

export const RETAIL_CATEGORIES = [
  { value: "Accessories", hint: "Chargers, cables, earphones, screen guards, cases and other phone accessories" },
] as const;

export const ACCESSORY_GROUPS = [
  { name: "Chargers", description: "Wall, fast and car chargers", matches: ["Chargers", "Charger"] },
  { name: "Cables", description: "USB, Type-C, Lightning and other charging cables", matches: ["Cables", "Cable"] },
  { name: "Earphones & Headsets", description: "Earphones, earbuds and headsets", matches: ["Earphones", "Headsets", "Earphones & Headsets"] },
  { name: "Speakers", description: "Portable speakers and small audio accessories", matches: ["Speakers", "Speaker"] },
  { name: "Power Banks", description: "Portable power banks", matches: ["Power Banks", "Power Bank"] },
  { name: "Screen Guards", description: "Screen protectors and guards", matches: ["Screen Guards", "Screen Protectors", "Screen Guard"] },
  { name: "Cases & Covers", description: "Phone cases, covers and pouches", matches: ["Cases", "Covers", "Cases & Covers", "Phone Cases"] },
  { name: "Adapters & OTG", description: "Adapters, OTG and small connectors", matches: ["Adapters", "OTG", "Adapters & OTG"] },
  { name: "Other Accessories", description: "Other phone accessories sold at the counter", matches: ["Other Accessories", "Other"] },
] as const;

export const ALL_CATEGORIES = [...WORKSHOP_CATEGORIES, ...RETAIL_CATEGORIES];

const WORKSHOP_VALUES = new Set<string>(WORKSHOP_CATEGORIES.map((c) => c.value));

export function isWorkshopCategory(category: string | null | undefined) {
  return Boolean(category && WORKSHOP_VALUES.has(category));
}

export const FALLBACK_CATEGORY = "Accessories";