/**
 * Registry der Farbtyp-Systeme.
 *
 * Neue Systeme (z. B. ein 16-Typen-System) werden als weiteres
 * `ColorTypeSystem` registriert – UI und Logik arbeiten nur mit dieser Registry.
 */
import type { ColorSeason, ColorSwatch, ColorTypeSystem, SeasonFamily, SeasonId, SeasonPalette } from '../types';
import { lightSpring, warmSpring, brightSpring } from './spring';
import { lightSummer, coolSummer, softSummer } from './summer';
import { softAutumn, warmAutumn, deepAutumn } from './autumn';
import { deepWinter, coolWinter, brightWinter } from './winter';

export const SEASONAL_12: ColorTypeSystem = {
  id: 'seasonal-12',
  name: '12 Farbtypen (saisonal)',
  description:
    'Das verbreitete saisonale System mit vier Jahreszeiten und je drei Untertypen. Es ist ein ästhetisches Orientierungssystem, keine wissenschaftlich eindeutige Diagnose.',
  seasons: [
    lightSpring,
    warmSpring,
    brightSpring,
    lightSummer,
    coolSummer,
    softSummer,
    softAutumn,
    warmAutumn,
    deepAutumn,
    deepWinter,
    coolWinter,
    brightWinter,
  ],
};

export const COLOR_SYSTEMS: ColorTypeSystem[] = [SEASONAL_12];

const BY_ID = new Map<SeasonId, ColorSeason>(SEASONAL_12.seasons.map((s) => [s.id, s]));

export function getSeason(id: SeasonId | null | undefined): ColorSeason | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export const SEASON_IDS = SEASONAL_12.seasons.map((s) => s.id) as SeasonId[];

export function isSeasonId(v: unknown): v is SeasonId {
  return typeof v === 'string' && BY_ID.has(v as SeasonId);
}

export const FAMILY_LABEL: Record<SeasonFamily, string> = {
  spring: 'Frühling',
  summer: 'Sommer',
  autumn: 'Herbst',
  winter: 'Winter',
};

export const FAMILY_ORDER: SeasonFamily[] = ['spring', 'summer', 'autumn', 'winter'];

export const PALETTE_GROUPS: { key: keyof SeasonPalette; label: string; hint: string }[] = [
  { key: 'base', label: 'Grundfarben', hint: 'Für große Flächen wie Hosen, Jacken und Mäntel.' },
  { key: 'accent', label: 'Akzentfarben', hint: 'Für Oberteile, Schals und Details.' },
  { key: 'neutrals', label: 'Neutrale Farben', hint: 'Ruhige Begleiter, die fast alles verbinden.' },
  { key: 'whites', label: 'Weißtöne', hint: 'Das passende Weiß für Shirts und Hemden.' },
  { key: 'browns', label: 'Brauntöne', hint: 'Für Schuhe, Gürtel, Leder und Strick.' },
  { key: 'blues', label: 'Blautöne', hint: 'Von Jeans bis Marine.' },
  { key: 'greens', label: 'Grüntöne', hint: '' },
  { key: 'reds', label: 'Rottöne', hint: '' },
  { key: 'metals', label: 'Metalle', hint: 'Für Schmuck, Uhren, Knöpfe und Schnallen.' },
  { key: 'avoid', label: 'Weniger harmonisch', hint: 'Keine Verbote – eher mit Abstand zum Gesicht tragen.' },
];

/** Alle empfohlenen Farben (ohne „weniger harmonisch“), dedupliziert nach HEX. */
export function recommendedSwatches(season: ColorSeason): ColorSwatch[] {
  const seen = new Set<string>();
  const out: ColorSwatch[] = [];
  for (const g of PALETTE_GROUPS) {
    if (g.key === 'avoid' || g.key === 'metals') continue;
    for (const s of season.palette[g.key]) {
      if (!seen.has(s.hex)) {
        seen.add(s.hex);
        out.push(s);
      }
    }
  }
  return out;
}

export const SCALE_LABELS = {
  temperature: ['sehr kühl', 'kühl', 'neutral', 'warm', 'sehr warm'],
  value: ['sehr dunkel', 'dunkel', 'mittel', 'hell', 'sehr hell'],
  chroma: ['sehr gedeckt', 'gedeckt', 'mittel', 'klar', 'sehr klar'],
  contrast: ['sehr gering', 'gering', 'mittel', 'hoch', 'sehr hoch'],
} as const;

export const DIMENSION_LABEL = {
  light: 'hell',
  warm: 'warm',
  bright: 'klar',
  cool: 'kühl',
  soft: 'gedeckt',
  deep: 'dunkel',
} as const;
