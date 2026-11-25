/**
 * Eignung einer Farbe für einen Farbtyp.
 *
 * Transparentes Zwei-Stufen-Modell (siehe docs/COLOR_THEORY.md):
 * 1. Nähe zur kuratierten Palette (Delta E 2000).
 * 2. Abgleich der Farbeigenschaften (Temperatur, Helligkeit, Sättigung) mit der
 *    Charakteristik des Farbtyps.
 *
 * Ergebnis ist eine qualitative Stufe mit Begründung – kein Prozentwert.
 */
import type { ColorSeason, ColorSwatch, HexColor } from '../types';
import { colorProfile } from '../color/analysis';
import { nearest } from '../color/distance';
import { recommendedSwatches } from './index';

export type SeasonFitLevel = 'palette' | 'compatible' | 'possible' | 'outside';

export interface SeasonFit {
  level: SeasonFitLevel;
  nearestSwatch?: ColorSwatch;
  nearestDistance?: number;
  reasons: string[];
}

export const SEASON_FIT_LABEL: Record<SeasonFitLevel, string> = {
  palette: 'In der Palette',
  compatible: 'Passt zur Charakteristik',
  possible: 'Mit Bedacht',
  outside: 'Eher außerhalb',
};

export function seasonFit(hex: HexColor, season: ColorSeason): SeasonFit {
  const p = colorProfile(hex);
  const rec = nearest(hex, recommendedSwatches(season), (s) => s.hex);
  const avoid = nearest(hex, season.palette.avoid, (s) => s.hex);
  const reasons: string[] = [];

  if (rec && rec.distance < 6) {
    reasons.push(`Sehr nah an „${rec.item.name}“ aus der Palette ${season.nameDe}.`);
    return { level: 'palette', nearestSwatch: rec.item, nearestDistance: rec.distance, reasons };
  }

  const mismatches: string[] = [];
  const isNeutral = p.neutrality !== 'color';
  if (season.temperature > 0 && p.temperatureScore < -0.25) mismatches.push('Die Farbe ist kühl, der Farbtyp eher warm.');
  if (season.temperature < 0 && p.temperatureScore > 0.3) mismatches.push('Die Farbe ist warm, der Farbtyp eher kühl.');
  if (season.chroma <= -1 && p.C > 0.15) mismatches.push('Die Farbe ist sehr leuchtend, der Farbtyp eher gedeckt.');
  if (season.chroma >= 2 && p.C < 0.05 && !isNeutral) mismatches.push('Die Farbe ist stark gedämpft, der Farbtyp eher klar.');
  if (season.value >= 2 && p.L < 0.38) mismatches.push('Die Farbe ist sehr dunkel, der Farbtyp eher hell.');
  if (season.value <= -2 && p.L > 0.9 && p.C > 0.02) mismatches.push('Die Farbe ist sehr hell und zart, der Farbtyp eher tief.');

  if (avoid && avoid.distance < 6) {
    reasons.push(`Nah an „${avoid.item.name}“, das für ${season.nameDe} als weniger harmonisch gilt.`);
    return { level: 'outside', nearestSwatch: rec?.item, nearestDistance: rec?.distance, reasons: [...reasons, ...mismatches] };
  }

  if (mismatches.length === 0) {
    reasons.push(
      isNeutral
        ? 'Neutrale Farbe, die zur Charakteristik des Farbtyps passt.'
        : 'Temperatur, Helligkeit und Sättigung passen zur Charakteristik des Farbtyps.',
    );
    return { level: 'compatible', nearestSwatch: rec?.item, nearestDistance: rec?.distance, reasons };
  }
  return {
    level: mismatches.length === 1 ? 'possible' : 'outside',
    nearestSwatch: rec?.item,
    nearestDistance: rec?.distance,
    reasons: mismatches,
  };
}
