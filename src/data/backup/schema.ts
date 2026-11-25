/**
 * Validierungsschema für Backups (JSON-Import).
 *
 * Sicherheitsprinzipien:
 * - Unbekannte Felder werden verworfen (zod `strip`).
 * - Längen- und Mengenbegrenzungen verhindern übergroße oder manipulierte Dateien.
 * - Bilder nur als `data:image/(png|jpeg|webp|gif);base64,…`.
 * - Keine Ausführung von Inhalten; Texte werden in React stets escaped dargestellt.
 */
import { z } from 'zod';
import { SEASON_IDS } from '@/domain/seasons';

export const BACKUP_FORMAT = 'chromawardrobe-backup';

const str = (max = 500) => z.string().max(max);
const optStr = (max = 500) => z.string().max(max).optional();
const id = z.string().min(1).max(120);
const iso = z.string().max(40);
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ungültiger HEX-Farbcode').transform((v) => v.toUpperCase());
const seasonId = z.enum(SEASON_IDS as [string, ...string[]]);

const swatch = z.object({ hex, name: str(120), note: optStr(500) });
const trait = z.object({ hex: hex.optional(), label: optStr(120) });

const slotEnum = z.enum(['base', 'shirt', 'knit', 'overshirt', 'outer', 'onepiece', 'bottom', 'shoes', 'scarf', 'headwear', 'accessory']);
const patternType = z.enum(['solid', 'check', 'stripes', 'melange', 'houndstooth', 'herringbone', 'camouflage', 'colorblock', 'print', 'custom']);
const styleTag = z.enum(['natural', 'timeless', 'modern', 'casual', 'minimal', 'classic', 'elegant', 'sporty', 'business-casual', 'creative', 'outdoor', 'streetwear']);

const garmentColor = z.object({
  hex,
  name: optStr(120),
  role: z.enum(['main', 'secondary', 'accent']),
  share: z.number().min(0).max(1),
});
const pattern = z.object({ type: patternType, description: optStr(300) });
const attrs = z.record(z.string().max(40), z.string().max(60)).refine((r) => Object.keys(r).length <= 20, 'Zu viele Attribute');

export const profileSchema = z.object({
  id,
  name: str(120).min(1),
  avatarImageId: id.optional(),
  sample: z.enum(['starter', 'demo']).optional(),
  appearance: z.object({
    skinTone: trait.optional(),
    skinUndertone: z.enum(['warm', 'cool', 'neutral', 'olive', 'unknown']),
    hairColor: trait.optional(),
    naturalHairColor: trait.optional(),
    hairIsDyed: z.boolean().optional(),
    eyeColor: trait.optional(),
    hasBeard: z.boolean(),
    beardColor: trait.optional(),
    contrast: z.enum(['low', 'medium', 'high', 'unknown']),
  }),
  colorType: z.object({
    systemId: str(60),
    seasonId: seasonId.nullable(),
    subtype: optStr(120),
    alternativeSeasonIds: z.array(seasonId).max(12),
    source: z.enum(['unset', 'manual', 'questionnaire']),
    decidedAt: iso.optional(),
  }),
  preferences: z.object({
    favoriteColors: z.array(swatch).max(200),
    dislikedColors: z.array(swatch).max(200),
    styles: z.array(styleTag).max(20),
    styleDirection: z.enum(['masculine', 'feminine', 'neutral', 'mixed']).optional(),
    styleNote: optStr(2000),
    goals: optStr(4000),
  }),
  customSwatches: z
    .array(swatch.extend({ id, kind: z.enum(['personal', 'neutral-suggestion', 'inspiration', 'trial-bottom']), createdAt: iso }))
    .max(1000),
  customCategories: z.array(z.object({ id, label: str(80), slot: slotEnum })).max(100),
  customSubcategories: z.array(z.object({ id, categoryId: str(120), label: str(80), silhouette: str(60) })).max(300),
  analysisResults: z
    .array(
      z.object({
        id,
        createdAt: iso,
        method: z.enum(['questionnaire', 'manual']),
        answers: z.array(z.object({ questionId: str(80), optionId: z.string().max(80).nullable(), answeredAt: iso })).max(200),
        candidates: z.array(z.object({ seasonId, rank: z.number(), reasons: z.array(str(500)).max(30) })).max(12),
        uncertainty: z.enum(['low', 'medium', 'high']),
        summary: str(4000),
      }),
    )
    .max(100),
  notes: optStr(4000),
  createdAt: iso,
  updatedAt: iso,
});

export const garmentSchema = z.object({
  id,
  profileId: id,
  name: str(200).min(1),
  category: str(120),
  subcategory: str(120),
  brand: optStr(120),
  model: optStr(120),
  colors: z.array(garmentColor).min(1).max(8),
  pattern,
  material: optStr(200),
  texture: optStr(200),
  fit: z.enum(['slim', 'regular', 'relaxed', 'oversized']).optional(),
  seasons: z.array(z.enum(['spring', 'summer', 'autumn', 'winter'])).max(4),
  styles: z.array(styleTag).max(20),
  attributes: attrs,
  photoImageId: id.optional(),
  productUrl: z
    .string()
    .max(2000)
    .refine((u) => /^https?:\/\//i.test(u), 'Nur http(s)-Links sind erlaubt')
    .optional(),
  notes: optStr(4000),
  favorite: z.boolean(),
  ownership: z.enum(['owned', 'planned', 'wishlist', 'archived', 'sold']),
  purchaseStatus: z.enum(['not-purchased', 'ordered', 'purchased', 'returned']).optional(),
  wishlist: z
    .object({ priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(), priceNote: optStr(120), reason: optStr(1000) })
    .optional(),
  colorIsApproximation: z.boolean().optional(),
  sample: z.boolean().optional(),
  createdAt: iso,
  updatedAt: iso,
});

const slotValue = z.object({
  garmentId: id.optional(),
  subcategory: str(120),
  colors: z.array(garmentColor).min(1).max(8),
  pattern,
  attributes: attrs.optional(),
  hidden: z.boolean().optional(),
});

export const outfitSchema = z.object({
  id,
  profileId: id,
  name: str(200),
  kind: z.enum(['wardrobe', 'experiment']),
  favorite: z.boolean(),
  slots: z.partialRecord(slotEnum, slotValue),
  options: z.object({ jacketOpen: z.boolean(), showSkin: z.boolean(), showHair: z.boolean(), showBeard: z.boolean() }),
  occasion: z.enum(['everyday', 'elegant', 'sporty', 'business-casual', 'minimal', 'classic', 'seasonal', 'creative', 'easy']).optional(),
  notes: optStr(4000),
  sourceExampleId: optStr(120),
  createdAt: iso,
  updatedAt: iso,
});

export const feedbackSchema = z.object({
  id,
  profileId: id,
  targetKey: str(1000),
  verdict: z.enum(['helpful', 'unfitting']),
  createdAt: iso,
});

export const MAX_IMAGE_DATAURL_LENGTH = 12_000_000; // ~9 MB Binärdaten

export const imageSchema = z.object({
  id,
  profileId: id,
  kind: z.enum(['avatar', 'garment', 'scan']),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  dataUrl: z
    .string()
    .max(MAX_IMAGE_DATAURL_LENGTH)
    .regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/, 'Ungültiges Bildformat'),
  createdAt: iso,
});

export const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.number().int().min(1),
  exportedAt: iso,
  scope: z.enum(['full', 'profile']),
  app: z.object({ name: str(60), version: str(30) }),
  profiles: z.array(profileSchema).max(100),
  garments: z.array(garmentSchema).max(20000),
  outfits: z.array(outfitSchema).max(20000),
  feedback: z.array(feedbackSchema).max(50000),
  images: z.array(imageSchema).max(5000),
});

export type BackupFile = z.infer<typeof backupSchema>;
export type BackupImage = z.infer<typeof imageSchema>;
