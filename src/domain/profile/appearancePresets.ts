/**
 * Visuelle Auswahlhilfen für Haut-, Haar-, Augen- und Bartfarben.
 * Die Spannweite deckt bewusst sehr helle bis sehr tiefe Hauttöne und
 * natürliche wie gefärbte Haarfarben ab. Alle Werte sind Annäherungen.
 */
import type { ColorSwatch } from '../types';

export const SKIN_TONES: ColorSwatch[] = [
  { hex: '#F6E3D4', name: 'Sehr hell, rosig' },
  { hex: '#F3D9BF', name: 'Sehr hell, pfirsich' },
  { hex: '#EBCBB0', name: 'Hell, neutral' },
  { hex: '#E8C4A3', name: 'Hell, warm' },
  { hex: '#DDB596', name: 'Hell-mittel, golden' },
  { hex: '#D2A68A', name: 'Hell-mittel, rosig' },
  { hex: '#C49470', name: 'Mittel, oliv-golden' },
  { hex: '#B58463', name: 'Mittel, warm' },
  { hex: '#9E6E4E', name: 'Mittel-tief, golden' },
  { hex: '#8A5C40', name: 'Tief, warm' },
  { hex: '#734A35', name: 'Tief, neutral' },
  { hex: '#5C3A2A', name: 'Sehr tief, warm' },
  { hex: '#4A2F24', name: 'Sehr tief, kühl' },
];

export const HAIR_COLORS: ColorSwatch[] = [
  { hex: '#1C1715', name: 'Schwarz' },
  { hex: '#2E221C', name: 'Schwarzbraun' },
  { hex: '#4A3426', name: 'Dunkelbraun' },
  { hex: '#6B4E37', name: 'Mittelbraun' },
  { hex: '#8A6A4F', name: 'Hellbraun' },
  { hex: '#9A7556', name: 'Hellbraun, warm' },
  { hex: '#7E6B5A', name: 'Aschbraun' },
  { hex: '#A88E6E', name: 'Dunkelblond' },
  { hex: '#C8A97E', name: 'Goldblond' },
  { hex: '#BFB09A', name: 'Aschblond' },
  { hex: '#E3CFA6', name: 'Hellblond' },
  { hex: '#A4532E', name: 'Kupfer / Rot' },
  { hex: '#7A3A28', name: 'Kastanie / Auburn' },
  { hex: '#C07A4A', name: 'Rotblond' },
  { hex: '#9A9A9A', name: 'Grau' },
  { hex: '#D9D6D0', name: 'Silber / Weiß' },
];

export const EYE_COLORS: ColorSwatch[] = [
  { hex: '#3B2A20', name: 'Dunkelbraun' },
  { hex: '#6B4A2E', name: 'Braun' },
  { hex: '#8A6A3A', name: 'Haselnuss' },
  { hex: '#6E7A45', name: 'Olivgrün' },
  { hex: '#5E8A5A', name: 'Grün' },
  { hex: '#7A8C80', name: 'Graugrün' },
  { hex: '#3E9A9A', name: 'Türkis' },
  { hex: '#5A82B5', name: 'Blau' },
  { hex: '#8FA8C8', name: 'Hellblau' },
  { hex: '#7D8A99', name: 'Graublau' },
  { hex: '#8E9296', name: 'Grau' },
];

export const BEARD_COLORS: ColorSwatch[] = [
  { hex: '#1C1715', name: 'Schwarz' },
  { hex: '#3E2C22', name: 'Dunkelbraun' },
  { hex: '#6B4E37', name: 'Mittelbraun' },
  { hex: '#9A7556', name: 'Hellbraun' },
  { hex: '#B0623A', name: 'Rot / Kupfer' },
  { hex: '#C08A5A', name: 'Rotblond' },
  { hex: '#A88E6E', name: 'Blond' },
  { hex: '#8E8E8E', name: 'Grau meliert' },
  { hex: '#D0CCC4', name: 'Weiß / Silber' },
];
