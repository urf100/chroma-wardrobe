/**
 * Zentrale Datenmodelle von ChromaWardrobe.
 *
 * Diese Typen sind unabhängig von der Speicherschicht (IndexedDB heute,
 * optional Supabase/PostgreSQL später). Änderungen an persistierten Typen
 * erfordern eine Migration in `src/data/db.ts` und eine Anpassung des
 * Backup-Schemas in `src/data/backup/schema.ts`.
 */

/** Farbwert als normalisierter HEX-String im Format `#RRGGBB` (Großbuchstaben). */
export type HexColor = string;
export type ID = string;
/** ISO-8601-Zeitstempel. */
export type ISODate = string;

/* ------------------------------------------------------------------ */
/* Farben & Paletten                                                   */
/* ------------------------------------------------------------------ */

export type SwatchRole =
  | 'base'
  | 'accent'
  | 'neutral'
  | 'white'
  | 'brown'
  | 'blue'
  | 'green'
  | 'red'
  | 'metal'
  | 'avoid';

export interface ColorSwatch {
  hex: HexColor;
  name: string;
  note?: string;
}

export interface ColorPalette {
  id: ID;
  name: string;
  swatches: ColorSwatch[];
}

/**
 * Herkunft individuell gespeicherter Farbtöne. Inspirationsfarben und
 * Kaufideen sind bewusst kein Kleidungsstück, damit vorhandene Kleidung,
 * geplante Anschaffungen und reine Inspiration im Datenmodell getrennt sind.
 */
export type CustomSwatchKind =
  | 'personal' // eigene Lieblings-/Palettenfarbe
  | 'neutral-suggestion' // vorgeschlagene neutrale Ergänzung
  | 'inspiration' // reine Inspirationsfarbe
  | 'trial-bottom'; // Hosenfarbe zum Experimentieren, kein Kleidungsstück

export interface CustomSwatch extends ColorSwatch {
  id: ID;
  kind: CustomSwatchKind;
  createdAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Farbtypen                                                           */
/* ------------------------------------------------------------------ */

export type SeasonFamily = 'spring' | 'summer' | 'autumn' | 'winter';

export type SeasonId =
  | 'light-spring'
  | 'warm-spring'
  | 'bright-spring'
  | 'light-summer'
  | 'cool-summer'
  | 'soft-summer'
  | 'soft-autumn'
  | 'warm-autumn'
  | 'deep-autumn'
  | 'deep-winter'
  | 'cool-winter'
  | 'bright-winter';

export type SeasonDimension = 'light' | 'warm' | 'bright' | 'cool' | 'soft' | 'deep';

/** Skala von -2 (sehr kühl / dunkel / gedeckt / niedrig) bis +2 (sehr warm / hell / klar / hoch). */
export type Scale = -2 | -1 | 0 | 1 | 2;

export interface SeasonPalette {
  base: ColorSwatch[];
  accent: ColorSwatch[];
  neutrals: ColorSwatch[];
  whites: ColorSwatch[];
  browns: ColorSwatch[];
  blues: ColorSwatch[];
  greens: ColorSwatch[];
  reds: ColorSwatch[];
  metals: ColorSwatch[];
  avoid: ColorSwatch[];
}

export interface SeasonOutfitExample {
  title: string;
  description: string;
  colors: ColorSwatch[];
}

export interface SeasonNeighbor {
  seasonId: SeasonId;
  difference: string;
}

export interface ColorSeason {
  id: SeasonId;
  systemId: string;
  family: SeasonFamily;
  nameDe: string;
  nameEn: string;
  aliases: string[];
  primary: SeasonDimension;
  secondary: SeasonDimension;
  summary: string;
  characteristics: string;
  temperature: Scale;
  value: Scale; // Helligkeit
  chroma: Scale; // Sättigung/Klarheit
  contrast: Scale;
  typicalFeatures: string[];
  palette: SeasonPalette;
  metalsText: string;
  avoidText: string;
  exampleOutfits: SeasonOutfitExample[];
  neighbors: SeasonNeighbor[];
}

/** Ein Farbtyp-System (heute: 12 Typen). Weitere Systeme (z. B. 16 Typen) können ergänzt werden. */
export interface ColorTypeSystem {
  id: string;
  name: string;
  description: string;
  seasons: ColorSeason[];
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export type Undertone = 'warm' | 'cool' | 'neutral' | 'olive' | 'unknown';
export type ContrastLevel = 'low' | 'medium' | 'high' | 'unknown';
export type StyleTag =
  | 'natural'
  | 'timeless'
  | 'modern'
  | 'casual'
  | 'minimal'
  | 'classic'
  | 'elegant'
  | 'sporty'
  | 'business-casual'
  | 'creative'
  | 'outdoor'
  | 'streetwear';
export type StyleDirection = 'masculine' | 'feminine' | 'neutral' | 'mixed';

export interface AppearanceTrait {
  hex?: HexColor;
  label?: string;
}

export interface Appearance {
  skinTone?: AppearanceTrait;
  skinUndertone: Undertone;
  hairColor?: AppearanceTrait;
  naturalHairColor?: AppearanceTrait;
  hairIsDyed?: boolean;
  eyeColor?: AppearanceTrait;
  hasBeard: boolean;
  beardColor?: AppearanceTrait;
  contrast: ContrastLevel;
}

export type ColorTypeSource = 'unset' | 'manual' | 'questionnaire';

export interface ProfileColorType {
  systemId: string;
  seasonId: SeasonId | null;
  subtype?: string;
  alternativeSeasonIds: SeasonId[];
  source: ColorTypeSource;
  decidedAt?: ISODate;
}

export interface ProfilePreferences {
  favoriteColors: ColorSwatch[];
  dislikedColors: ColorSwatch[];
  styles: StyleTag[];
  styleDirection?: StyleDirection;
  styleNote?: string;
  goals?: string;
}

export interface CustomCategory {
  id: ID;
  label: string;
  slot: OutfitSlot;
}

export interface CustomSubcategory {
  id: ID;
  categoryId: string;
  label: string;
  /** Silhouette, mit der die eigene Unterkategorie dargestellt wird. */
  silhouette: string;
}

export interface UserProfile {
  id: ID;
  name: string;
  avatarImageId?: ID;
  /** Beispiel- oder Demodaten werden in der UI gekennzeichnet. */
  sample?: 'starter' | 'demo';
  appearance: Appearance;
  colorType: ProfileColorType;
  preferences: ProfilePreferences;
  customSwatches: CustomSwatch[];
  customCategories: CustomCategory[];
  customSubcategories: CustomSubcategory[];
  analysisResults: ColorAnalysisResult[];
  notes?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Kleidung                                                            */
/* ------------------------------------------------------------------ */

export type GarmentCategoryId =
  | 'tops'
  | 'knitwear'
  | 'outerwear'
  | 'bottoms'
  | 'onepiece'
  | 'shoes'
  | 'accessories'
  | string; // benutzerdefinierte Kategorien

export interface GarmentCategory {
  id: GarmentCategoryId;
  label: string;
  description: string;
  subcategories: GarmentSubcategory[];
}

export interface GarmentAttributeOption {
  value: string;
  label: string;
}

export interface GarmentAttributeDefinition {
  key: string;
  label: string;
  options: GarmentAttributeOption[];
  defaultValue: string;
}

export interface GarmentSubcategory {
  id: string;
  label: string;
  categoryId: GarmentCategoryId;
  slot: OutfitSlot;
  silhouette: string;
  attributes?: GarmentAttributeDefinition[];
  defaultPattern?: PatternType;
  custom?: boolean;
}

export type PatternType =
  | 'solid'
  | 'check'
  | 'stripes'
  | 'melange'
  | 'houndstooth'
  | 'herringbone'
  | 'camouflage'
  | 'colorblock'
  | 'print'
  | 'custom';

export interface GarmentPattern {
  type: PatternType;
  description?: string;
}

export type GarmentColorRole = 'main' | 'secondary' | 'accent';

export interface GarmentColor {
  hex: HexColor;
  /** Benutzerdefinierter Farbname (optional). */
  name?: string;
  role: GarmentColorRole;
  /** Geschätzter Flächenanteil 0..1. */
  share: number;
}

export type OwnershipStatus = 'owned' | 'planned' | 'wishlist' | 'archived' | 'sold';
export type PurchaseStatus = 'not-purchased' | 'ordered' | 'purchased' | 'returned';
export type WearSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type GarmentFit = 'slim' | 'regular' | 'relaxed' | 'oversized';

export interface WishlistDetails {
  priority?: 1 | 2 | 3;
  priceNote?: string;
  reason?: string;
}

export interface Garment {
  id: ID;
  profileId: ID;
  name: string;
  category: GarmentCategoryId;
  subcategory: string;
  brand?: string;
  model?: string;
  /** colors[0] ist die Hauptfarbe; weitere Einträge sind Sekundär- und Akzentfarben. */
  colors: GarmentColor[];
  pattern: GarmentPattern;
  material?: string;
  texture?: string;
  fit?: GarmentFit;
  seasons: WearSeason[];
  styles: StyleTag[];
  attributes: Record<string, string>;
  photoImageId?: ID;
  productUrl?: string;
  notes?: string;
  favorite: boolean;
  ownership: OwnershipStatus;
  purchaseStatus?: PurchaseStatus;
  wishlist?: WishlistDetails;
  /** Farbwert ist eine visuelle Annäherung (kein verifizierter Produktwert). */
  colorIsApproximation?: boolean;
  sample?: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** Wunschlisten-Einträge sind Kleidungsstücke mit Status „Wunschliste“ oder „Geplant“. */
export type WishlistItem = Garment & { ownership: 'wishlist' | 'planned' };

/* ------------------------------------------------------------------ */
/* Outfits                                                             */
/* ------------------------------------------------------------------ */

export type OutfitSlot =
  | 'base'
  | 'shirt'
  | 'knit'
  | 'overshirt'
  | 'outer'
  | 'onepiece'
  | 'bottom'
  | 'shoes'
  | 'scarf'
  | 'headwear'
  | 'accessory';

export interface OutfitSlotValue {
  /** Verweis auf ein Kleidungsstück. Fehlt er, ist es ein freies Farbexperiment. */
  garmentId?: ID;
  subcategory: string;
  colors: GarmentColor[];
  pattern: GarmentPattern;
  attributes?: Record<string, string>;
  hidden?: boolean;
}

export interface OutfitDisplayOptions {
  jacketOpen: boolean;
  showSkin: boolean;
  showHair: boolean;
  showBeard: boolean;
}

export type OutfitKind = 'wardrobe' | 'experiment';
export type OccasionTag =
  | 'everyday'
  | 'elegant'
  | 'sporty'
  | 'business-casual'
  | 'minimal'
  | 'classic'
  | 'seasonal'
  | 'creative'
  | 'easy';

export interface Outfit {
  id: ID;
  profileId: ID;
  name: string;
  kind: OutfitKind;
  favorite: boolean;
  slots: Partial<Record<OutfitSlot, OutfitSlotValue>>;
  options: OutfitDisplayOptions;
  occasion?: OccasionTag;
  notes?: string;
  sourceExampleId?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Empfehlungen, Analyse, Scanner                                      */
/* ------------------------------------------------------------------ */

export type QualitativeLevel = 'strong' | 'good' | 'possible' | 'careful';

export interface RecommendationReason {
  kind:
    | 'neutral'
    | 'lightness'
    | 'temperature'
    | 'saturation'
    | 'hue'
    | 'curated'
    | 'season'
    | 'preference'
    | 'feedback';
  effect: 'positive' | 'neutral' | 'negative';
  text: string;
}

export interface OutfitRecommendation {
  id: string;
  slots: Partial<Record<OutfitSlot, ID>>;
  level: QualitativeLevel;
  /** Interner Ranking-Wert – wird nicht als „Schönheitsnote“ angezeigt. */
  rank: number;
  reasons: RecommendationReason[];
  palette: HexColor[];
  containsPlanned: boolean;
}

export type FeedbackVerdict = 'helpful' | 'unfitting';

export interface RecommendationFeedback {
  id: ID;
  profileId: ID;
  /** Schlüssel der bewerteten Kombination, z. B. sortierte Garment-IDs oder Farbcodes. */
  targetKey: string;
  verdict: FeedbackVerdict;
  createdAt: ISODate;
}

export interface QuestionnaireAnswer {
  questionId: string;
  /** `null` bedeutet „Ich bin mir nicht sicher“ bzw. übersprungen. */
  optionId: string | null;
  answeredAt: ISODate;
}

export interface SeasonCandidate {
  seasonId: SeasonId;
  /** Relativer Rang innerhalb der Auswertung, keine Wahrscheinlichkeit. */
  rank: number;
  reasons: string[];
}

export interface ColorAnalysisResult {
  id: ID;
  createdAt: ISODate;
  method: 'questionnaire' | 'manual';
  answers: QuestionnaireAnswer[];
  candidates: SeasonCandidate[];
  uncertainty: 'low' | 'medium' | 'high';
  summary: string;
}

export interface ScanResult {
  id: ID;
  hex: HexColor;
  name: string;
  source: 'camera' | 'photo';
  /** Anzahl ausgewerteter Pixel im Messbereich. */
  sampleSize: number;
  calibrated: boolean;
  createdAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Bilder & Einstellungen                                              */
/* ------------------------------------------------------------------ */

export interface StoredImage {
  id: ID;
  profileId: ID;
  kind: 'avatar' | 'garment' | 'scan';
  mimeType: string;
  blob: Blob;
  createdAt: ISODate;
}

export interface SettingEntry {
  key: string;
  value: unknown;
}
