// Single source of truth for inventory categories - previously the add/edit
// form only offered 3 coarse types (Part/Accessory/Gadget) while the
// browsing view expected a finer workshop taxonomy (Phone Parts, Chargers &
// Power, Displays...), so newly added items never matched how the shop
// actually organizes a stockroom. One list now, used everywhere.

export const WORKSHOP_CATEGORIES = [
  { value: "Phone Parts", hint: "Downboards, back glass, charging flex — by brand" },
  { value: "Laptop Parts", hint: "Keyboards, screens, batteries, chargers" },
  { value: "Chargers & Power", hint: "Wall chargers, car chargers, power banks" },
  { value: "Displays", hint: "Phone and laptop screens" },
  { value: "Batteries", hint: "Phone and laptop batteries" },
  { value: "Tools", hint: "Soldering, testing, repair tools" },
] as const;

export const RETAIL_CATEGORIES = [
  { value: "Devices", hint: "Phones, tablets, laptops for sale" },
  { value: "Accessories", hint: "Cases, screen guards, earphones, cables" },
] as const;

export const ALL_CATEGORIES = [...WORKSHOP_CATEGORIES, ...RETAIL_CATEGORIES];

const WORKSHOP_VALUES = new Set<string>(WORKSHOP_CATEGORIES.map((c) => c.value));

export function isWorkshopCategory(category: string | null | undefined) {
  return Boolean(category && WORKSHOP_VALUES.has(category));
}

export const FALLBACK_CATEGORY = "Accessories";
