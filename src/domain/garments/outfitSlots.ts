import type { Garment, OutfitSlotValue } from '../types';

/** Momentaufnahme eines Kleidungsstücks als Outfit-Slot. */
export const slotFromGarment = (g: Garment): OutfitSlotValue => ({
  garmentId: g.id,
  subcategory: g.subcategory,
  colors: g.colors,
  pattern: g.pattern,
  attributes: g.attributes,
});
