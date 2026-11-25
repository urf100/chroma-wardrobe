import type { Garment, GarmentColor, Outfit, UserProfile } from '../types';
import { createId, nowIso } from '../id';
import { defaultAttributes, defaultPattern, DEFAULT_CATALOG, getSubcategory } from '../garments/catalog';
import { nameColor } from '../color/naming';
import { normalizeHex } from '../color/convert';

export function createProfile(name: string, partial: Partial<UserProfile> = {}): UserProfile {
  const now = nowIso();
  return {
    id: createId('prof'),
    name: name.trim() || 'Neues Profil',
    appearance: { skinUndertone: 'unknown', hasBeard: false, contrast: 'unknown' },
    colorType: { systemId: 'seasonal-12', seasonId: null, alternativeSeasonIds: [], source: 'unset' },
    preferences: { favoriteColors: [], dislikedColors: [], styles: [] },
    customSwatches: [],
    customCategories: [],
    customSubcategories: [],
    analysisResults: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function duplicateProfile(p: UserProfile, newName?: string): UserProfile {
  const now = nowIso();
  return {
    ...structuredClone(p),
    id: createId('prof'),
    name: newName ?? `${p.name} (Kopie)`,
    sample: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function garmentColor(hex: string, share = 1, role: GarmentColor['role'] = 'main', name?: string): GarmentColor {
  return { hex: normalizeHex(hex), share, role, ...(name ? { name } : {}) };
}

/** Normalisiert Farbanteile, sodass sie zusammen 1 ergeben. */
export function normalizeShares(colors: GarmentColor[]): GarmentColor[] {
  const total = colors.reduce((s, c) => s + (c.share > 0 ? c.share : 0), 0);
  if (total <= 0) return colors.map((c) => ({ ...c, share: 1 / colors.length }));
  return colors.map((c, i) => ({ ...c, share: Math.max(0, c.share) / total, role: i === 0 ? 'main' : c.role === 'main' ? 'secondary' : c.role }));
}

export function createGarment(profileId: string, subcategory: string, colors: GarmentColor[], partial: Partial<Garment> = {}): Garment {
  const now = nowIso();
  const sub = getSubcategory(subcategory) ?? DEFAULT_CATALOG.subcategories.get('tshirt')!;
  const mainName = colors[0]?.name ?? (colors[0] ? nameColor(colors[0].hex).name : '');
  return {
    id: createId('gar'),
    profileId,
    name: partial.name ?? `${sub.label} ${mainName}`.trim(),
    category: sub.categoryId,
    subcategory,
    colors: normalizeShares(colors),
    pattern: { type: defaultPattern(subcategory) },
    seasons: [],
    styles: [],
    attributes: defaultAttributes(subcategory),
    favorite: false,
    ownership: 'owned',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function duplicateGarment(g: Garment): Garment {
  const now = nowIso();
  return { ...structuredClone(g), id: createId('gar'), name: `${g.name} (Kopie)`, sample: undefined, createdAt: now, updatedAt: now };
}

export function createOutfit(profileId: string, partial: Partial<Outfit> = {}): Outfit {
  const now = nowIso();
  return {
    id: createId('out'),
    profileId,
    name: 'Neues Outfit',
    kind: 'experiment',
    favorite: false,
    slots: {},
    options: { jacketOpen: true, showSkin: true, showHair: true, showBeard: true },
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

/** Ein Outfit gilt als „Kleiderschrank-Outfit“, wenn jedes sichtbare Teil aus dem Bestand stammt. */
export function deriveOutfitKind(outfit: Pick<Outfit, 'slots'>): Outfit['kind'] {
  const vals = Object.values(outfit.slots).filter((v) => v && !v.hidden);
  return vals.length > 0 && vals.every((v) => v!.garmentId) ? 'wardrobe' : 'experiment';
}
