/**
 * Verständliche deutsche Farbnamen.
 *
 * 1. Liegt eine Farbe nahe an einem bekannten Modefarbnamen (Delta E 2000 < 7),
 *    wird dieser Name verwendet.
 * 2. Sonst wird eine beschreibende Bezeichnung erzeugt, z. B. „dunkles, gedecktes Grün“.
 *
 * Die Beschreibung wird immer zusätzlich angeboten, weil sie für Anfänger
 * verständlicher ist als ein Fantasiename.
 */
import type { HexColor } from '../types';
import { hexToOklch } from './convert';
import { deltaE2000 } from './distance';
import { chromaLevel, lightnessLevel, temperatureLevel, temperatureScore } from './analysis';

export interface NamedColor {
  name: string;
  hex: HexColor;
}

export const NAMED_COLORS: NamedColor[] = [
  // Weiß- und Cremetöne
  { name: 'Reinweiß', hex: '#FAFAFA' },
  { name: 'Schneeweiß', hex: '#F4F6F8' },
  { name: 'Cremeweiß', hex: '#F3EAD7' },
  { name: 'Ecru', hex: '#E5D8BF' },
  { name: 'Elfenbein', hex: '#EFE6CF' },
  { name: 'Hellbeige', hex: '#D7C6AA' },
  { name: 'Beige', hex: '#C7B596' },
  { name: 'Sandbeige', hex: '#CBB99C' },
  { name: 'Sand', hex: '#BFA98A' },
  { name: 'Haferflocke', hex: '#DDD0B8' },
  { name: 'Warmes Taupe', hex: '#A69986' },
  { name: 'Taupe', hex: '#8B7F74' },
  { name: 'Greige', hex: '#B5AFA4' },
  // Braun
  { name: 'Camel', hex: '#B18A5E' },
  { name: 'Cognac', hex: '#A36132' },
  { name: 'Karamell', hex: '#B47A45' },
  { name: 'Haselnuss', hex: '#9C7A57' },
  { name: 'Mittelbraun', hex: '#89674F' },
  { name: 'Braun', hex: '#72533E' },
  { name: 'Tabak', hex: '#7A5634' },
  { name: 'Dunkelbraun', hex: '#4F382E' },
  { name: 'Schokobraun', hex: '#503629' },
  { name: 'Espresso', hex: '#3D2920' },
  { name: 'Mokka', hex: '#6B4F43' },
  { name: 'Rostbraun', hex: '#8B4A2B' },
  { name: 'Terrakotta', hex: '#B5654A' },
  { name: 'Kupfer', hex: '#B87333' },
  // Grau & Schwarz
  { name: 'Schwarz', hex: '#1C1C1E' },
  { name: 'Tiefschwarz', hex: '#111111' },
  { name: 'Weiches Schwarz', hex: '#252526' },
  { name: 'Anthrazit', hex: '#414143' },
  { name: 'Dunkelanthrazit', hex: '#292A2C' },
  { name: 'Schiefergrau', hex: '#515154' },
  { name: 'Kühles Grau', hex: '#50545D' },
  { name: 'Warmes Grau', hex: '#77736B' },
  { name: 'Mittelgrau', hex: '#808080' },
  { name: 'Steingrau', hex: '#8E8A82' },
  { name: 'Hellgrau', hex: '#C4C4C4' },
  { name: 'Silbergrau', hex: '#B9BCC1' },
  { name: 'Graumeliert', hex: '#9A9A9A' },
  // Rot, Rosa
  { name: 'Weinrot', hex: '#703A40' },
  { name: 'Bordeaux', hex: '#6A1F2B' },
  { name: 'Burgund', hex: '#7B2D3A' },
  { name: 'Rostrot', hex: '#A65C3D' },
  { name: 'Ziegelrot', hex: '#A0472E' },
  { name: 'Verwaschenes Rot', hex: '#B76C60' },
  { name: 'Tomatenrot', hex: '#D1452F' },
  { name: 'Signalrot', hex: '#D32F2F' },
  { name: 'Kirschrot', hex: '#B3122E' },
  { name: 'Himbeere', hex: '#C2185B' },
  { name: 'Koralle', hex: '#F07B62' },
  { name: 'Lachs', hex: '#F0A38A' },
  { name: 'Altrosa', hex: '#C89A98' },
  { name: 'Puderrosa', hex: '#E8C4C4' },
  { name: 'Rosé', hex: '#E7B5B5' },
  { name: 'Pink', hex: '#E5559B' },
  { name: 'Fuchsia', hex: '#C1317A' },
  { name: 'Beere', hex: '#8E3B5C' },
  { name: 'Pflaume', hex: '#5E3A50' },
  { name: 'Aubergine', hex: '#4A2F43' },
  // Orange & Gelb
  { name: 'Orange', hex: '#E8792B' },
  { name: 'Kürbis', hex: '#C86A2A' },
  { name: 'Aprikose', hex: '#F2B486' },
  { name: 'Pfirsich', hex: '#F4C2A1' },
  { name: 'Senfgelb', hex: '#C49A2C' },
  { name: 'Ocker', hex: '#C08A3E' },
  { name: 'Goldgelb', hex: '#E0B04A' },
  { name: 'Zitronengelb', hex: '#F2DE4E' },
  { name: 'Butter', hex: '#F2E2A0' },
  { name: 'Vanille', hex: '#F3E5B5' },
  // Grün
  { name: 'Olivgrün', hex: '#656749' },
  { name: 'Oliv', hex: '#626744' },
  { name: 'Khaki', hex: '#8F8A62' },
  { name: 'Salbei', hex: '#9CAA8E' },
  { name: 'Moosgrün', hex: '#5E6B3A' },
  { name: 'Dunkelgrün', hex: '#35483C' },
  { name: 'Waldgrün', hex: '#35483A' },
  { name: 'Tannengrün', hex: '#263B35' },
  { name: 'Flaschengrün', hex: '#1F4B3A' },
  { name: 'Smaragd', hex: '#1F8A62' },
  { name: 'Grasgrün', hex: '#4CA64C' },
  { name: 'Mint', hex: '#A8DCC5' },
  { name: 'Pistazie', hex: '#B5C98E' },
  { name: 'Limette', hex: '#B6D33C' },
  { name: 'Jade', hex: '#3E9C80' },
  // Petrol & Türkis
  { name: 'Petrol', hex: '#3D777E' },
  { name: 'Dunkelpetrol', hex: '#22525A' },
  { name: 'Türkis', hex: '#2BB5B0' },
  { name: 'Aqua', hex: '#7FD1D3' },
  { name: 'Teal', hex: '#2E7D7A' },
  // Blau
  { name: 'Jeansblau', hex: '#465B73' },
  { name: 'Dunkelblau', hex: '#293E53' },
  { name: 'Marineblau', hex: '#263346' },
  { name: 'Nachtblau', hex: '#202432' },
  { name: 'Indigo', hex: '#2F3A66' },
  { name: 'Königsblau', hex: '#2C4FA3' },
  { name: 'Kobaltblau', hex: '#2B52C4' },
  { name: 'Himmelblau', hex: '#8EBBE3' },
  { name: 'Hellblau', hex: '#B5CDE3' },
  { name: 'Eisblau', hex: '#DCE9F2' },
  { name: 'Taubenblau', hex: '#7D8FA6' },
  { name: 'Graublau', hex: '#6B7A8C' },
  { name: 'Stahlblau', hex: '#4A6A8A' },
  { name: 'Rauchblau', hex: '#8A9DB0' },
  // Violett
  { name: 'Lavendel', hex: '#B9A8D6' },
  { name: 'Flieder', hex: '#C3A6CE' },
  { name: 'Violett', hex: '#6A4C9C' },
  { name: 'Lila', hex: '#8A63A8' },
  { name: 'Mauve', hex: '#9C7F92' },
  // Metalle
  { name: 'Gold', hex: '#C9A44C' },
  { name: 'Silber', hex: '#C0C3C7' },
];

type HueFamily =
  | 'Rot'
  | 'Rosa'
  | 'Orange'
  | 'Braun'
  | 'Beige'
  | 'Gelb'
  | 'Oliv'
  | 'Grün'
  | 'Petrol'
  | 'Blau'
  | 'Violett'
  | 'Beerenrot';

function hueFamily(L: number, C: number, h: number): HueFamily {
  if (h >= 345 || h < 15) return L > 0.75 ? 'Rosa' : 'Beerenrot';
  if (h < 45) return L > 0.78 ? 'Rosa' : 'Rot';
  if (h < 78) {
    if (C < 0.11) return L > 0.7 ? 'Beige' : 'Braun';
    return 'Orange';
  }
  if (h < 100) {
    if (C < 0.1) return L > 0.7 ? 'Beige' : 'Braun';
    return 'Gelb';
  }
  if (h < 128) return C < 0.1 && L < 0.75 ? 'Oliv' : 'Gelb';
  if (h < 170) return 'Grün';
  if (h < 215) return 'Petrol';
  if (h < 285) return 'Blau';
  if (h < 330) return 'Violett';
  return L > 0.75 ? 'Rosa' : 'Beerenrot';
}

const LIGHTNESS_ADJ = {
  'very-dark': 'sehr dunkles',
  dark: 'dunkles',
  medium: 'mittleres',
  light: 'helles',
  'very-light': 'sehr helles',
} as const;

const CHROMA_ADJ = {
  neutral: '',
  muted: 'gedecktes',
  medium: '',
  clear: 'klares',
  vivid: 'leuchtendes',
} as const;

function achromaticName(L: number, hex: HexColor): string {
  const temp = temperatureLevel(temperatureScore(hex));
  const prefix = temp === 'warm' || temp === 'slightly-warm' ? 'warmes ' : temp === 'cool' || temp === 'slightly-cool' ? 'kühles ' : '';
  if (L < 0.22) return 'Schwarz';
  if (L < 0.36) return `${prefix}Anthrazit`.trim();
  if (L < 0.52) return `${prefix}Dunkelgrau`.trim();
  if (L < 0.7) return `${prefix}Grau`.trim();
  if (L < 0.9) return `${prefix}Hellgrau`.trim();
  return prefix.startsWith('warm') ? 'Cremeweiß' : 'Weiß';
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Beschreibende Bezeichnung, z. B. „Dunkles, gedecktes Grün“. */
export function describeColor(hex: HexColor): string {
  const { L, C, h } = hexToOklch(hex);
  if (C < 0.025) return cap(achromaticName(L, hex));
  const family = hueFamily(L, C, h);
  const parts: string[] = [LIGHTNESS_ADJ[lightnessLevel(L)]];
  const chromaAdj = CHROMA_ADJ[chromaLevel(C)];
  // Braun/Beige/Oliv sind per Definition gedeckt – kein doppeltes „gedecktes“.
  if (chromaAdj && !(chromaAdj === 'gedecktes' && ['Braun', 'Beige', 'Oliv'].includes(family))) parts.push(chromaAdj);
  return cap(`${parts.join(', ')} ${family}`);
}

export interface ColorNameResult {
  /** Kurzer, verständlicher Name (bekannter Farbname oder Beschreibung). */
  name: string;
  /** Beschreibung aus Helligkeit, Sättigung und Farbton. */
  description: string;
  /** Name eines bekannten Farbtons, falls sehr nah. */
  matched?: NamedColor;
}

export function nameColor(hex: HexColor): ColorNameResult {
  const description = describeColor(hex);
  let best: NamedColor | undefined;
  let bestD = Infinity;
  for (const c of NAMED_COLORS) {
    const d = deltaE2000(hex, c.hex);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  if (best && bestD < 7) return { name: best.name, description, matched: best };
  return { name: description, description };
}
