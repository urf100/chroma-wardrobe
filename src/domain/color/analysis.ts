/**
 * Wahrnehmungsorientierte Farbeigenschaften auf Basis von OKLCH.
 *
 * Die Schwellenwerte sind bewusst einfache, dokumentierte Heuristiken
 * (siehe docs/COLOR_THEORY.md) und keine farbmetrischen Normen.
 */
import type { HexColor } from '../types';
import { hexToOklab, hexToOklch } from './convert';

export type LightnessLevel = 'very-dark' | 'dark' | 'medium' | 'light' | 'very-light';
export type ChromaLevel = 'neutral' | 'muted' | 'medium' | 'clear' | 'vivid';
export type TemperatureLevel = 'warm' | 'slightly-warm' | 'neutral' | 'slightly-cool' | 'cool';
export type Neutrality = 'achromatic' | 'warm-neutral' | 'cool-neutral' | 'color';

export interface ColorProfile {
  hex: HexColor;
  L: number;
  C: number;
  h: number;
  lightness: LightnessLevel;
  chroma: ChromaLevel;
  /** -1 (kühl) … +1 (warm) */
  temperatureScore: number;
  temperature: TemperatureLevel;
  neutrality: Neutrality;
}

export function lightnessLevel(L: number): LightnessLevel {
  if (L < 0.33) return 'very-dark';
  if (L < 0.48) return 'dark';
  if (L < 0.68) return 'medium';
  if (L < 0.86) return 'light';
  return 'very-light';
}

export function chromaLevel(C: number): ChromaLevel {
  if (C < 0.025) return 'neutral';
  if (C < 0.07) return 'muted';
  if (C < 0.12) return 'medium';
  if (C < 0.18) return 'clear';
  return 'vivid';
}

/**
 * Temperatur-Wert: Projektion des Farbtons auf eine Warm-Kalt-Achse.
 * Warm ≈ Orange-Gelb (OKLCH-Farbton ~65°), kühl ≈ Blau-Cyan (~245°).
 * Gewichtet mit der Buntheit, damit fast neutrale Farben nahe 0 liegen –
 * aber ein gelbliches Grau trotzdem leicht warm und ein bläuliches Grau leicht kühl ist.
 */
export function temperatureScore(hex: HexColor): number {
  const { a, b } = hexToOklab(hex);
  const warmAxis = (65 * Math.PI) / 180;
  const proj = a * Math.cos(warmAxis) + b * Math.sin(warmAxis);
  // ~0.08 Projektion entspricht einer deutlich warmen/kühlen Farbe
  return Math.max(-1, Math.min(1, proj / 0.08));
}

export function temperatureLevel(score: number): TemperatureLevel {
  if (score > 0.45) return 'warm';
  if (score > 0.12) return 'slightly-warm';
  if (score >= -0.12) return 'neutral';
  if (score >= -0.45) return 'slightly-cool';
  return 'cool';
}

/**
 * Mode-Neutralität: In der Kleidung gelten nicht nur Grau/Schwarz/Weiß als
 * neutral, sondern auch Beige, Camel, Braun (warme Neutrale) sowie Marine und
 * Anthrazit-Blau (kühle Neutrale).
 */
export function neutrality(hex: HexColor): Neutrality {
  const { L, C, h } = hexToOklch(hex);
  if (C < 0.03) return 'achromatic';
  // Braun/Rotbraun (30–60°) nur bei geringer Buntheit, Beige/Camel (60–105°) etwas großzügiger
  if (h >= 30 && h < 60 && C < 0.075 && L < 0.95) return 'warm-neutral';
  if (h >= 60 && h <= 105 && C < 0.11 && L < 0.95) return 'warm-neutral';
  const isBlueHue = h >= 220 && h <= 280;
  if (isBlueHue && L < 0.42 && C < 0.1) return 'cool-neutral';
  return 'color';
}

export function isFashionNeutral(hex: HexColor): boolean {
  return neutrality(hex) !== 'color';
}

export function colorProfile(hex: HexColor): ColorProfile {
  const { L, C, h } = hexToOklch(hex);
  const t = temperatureScore(hex);
  return {
    hex,
    L,
    C,
    h,
    lightness: lightnessLevel(L),
    chroma: chromaLevel(C),
    temperatureScore: t,
    temperature: temperatureLevel(t),
    neutrality: neutrality(hex),
  };
}

/** Kleinster Winkelabstand zweier Farbtöne in Grad (0..180). */
export function hueDistance(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2) % 360;
  return d > 180 ? 360 - d : d;
}

export const LIGHTNESS_LABEL: Record<LightnessLevel, string> = {
  'very-dark': 'sehr dunkel',
  dark: 'dunkel',
  medium: 'mittelhell',
  light: 'hell',
  'very-light': 'sehr hell',
};

export const CHROMA_LABEL: Record<ChromaLevel, string> = {
  neutral: 'unbunt',
  muted: 'gedeckt',
  medium: 'mittel gesättigt',
  clear: 'klar',
  vivid: 'leuchtend',
};

export const TEMPERATURE_LABEL: Record<TemperatureLevel, string> = {
  warm: 'warm',
  'slightly-warm': 'leicht warm',
  neutral: 'neutral',
  'slightly-cool': 'leicht kühl',
  cool: 'kühl',
};

export const NEUTRALITY_LABEL: Record<Neutrality, string> = {
  achromatic: 'unbunte Neutralfarbe',
  'warm-neutral': 'warme Neutralfarbe',
  'cool-neutral': 'kühle Neutralfarbe',
  color: 'Farbe',
};
