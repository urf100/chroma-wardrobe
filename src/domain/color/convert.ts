/**
 * Farbraum-Konvertierungen.
 *
 * - HEX/RGB: Anzeige und Eingabe
 * - HSL: verständliche Farbsteuerung (Regler)
 * - OKLab/OKLCH: wahrnehmungsorientierte Analyse (Björn Ottosson, 2020)
 * - CIELAB (D65): klassische Farbabstände (Delta E 2000)
 *
 * Alle Funktionen sind rein (ohne Seiteneffekte) und vollständig getestet.
 */
import type { HexColor } from '../types';

export interface RGB {
  r: number; // 0..255
  g: number;
  b: number;
}
export interface HSL {
  h: number; // 0..360
  s: number; // 0..1
  l: number; // 0..1
}
export interface OKLab {
  L: number; // 0..1
  a: number;
  b: number;
}
export interface OKLCH {
  L: number; // 0..1
  C: number; // 0..~0.37
  h: number; // 0..360
}
export interface Lab {
  L: number; // 0..100
  a: number;
  b: number;
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isValidHex(value: string): boolean {
  return HEX_RE.test(value.trim());
}

/** Normalisiert `abc`, `#abc`, `#aabbcc` → `#AABBCC`. Wirft bei ungültiger Eingabe. */
export function normalizeHex(value: string): HexColor {
  const m = HEX_RE.exec(value.trim());
  if (!m) throw new Error(`Ungültiger HEX-Farbcode: "${value}"`);
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return `#${h.toUpperCase()}`;
}

/** Wie `normalizeHex`, liefert aber `null` statt eines Fehlers. */
export function tryNormalizeHex(value: string): HexColor | null {
  return isValidHex(value) ? normalizeHex(value) : null;
}

export function hexToRgb(hex: HexColor): RGB {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function rgbToHex({ r, g, b }: RGB): HexColor {
  const to = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
}

export const hexToHsl = (hex: HexColor) => rgbToHsl(hexToRgb(hex));
export const hslToHex = (hsl: HSL) => rgbToHex(hslToRgb(hsl));

/* ---------- sRGB <-> linear ---------- */

export function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return c * 255;
}

/* ---------- OKLab / OKLCH ---------- */

export function rgbToOklab({ r, g, b }: RGB): OKLab {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

/** Liefert lineare RGB-Werte (können außerhalb von 0..1 liegen = außerhalb des sRGB-Gamuts). */
export function oklabToLinearRgb({ L, a, b }: OKLab): [number, number, number] {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function oklabToRgb(lab: OKLab): RGB {
  const [r, g, b] = oklabToLinearRgb(lab);
  return { r: linearToSrgb(clamp(r, 0, 1)), g: linearToSrgb(clamp(g, 0, 1)), b: linearToSrgb(clamp(b, 0, 1)) };
}

export function oklabToOklch({ L, a, b }: OKLab): OKLCH {
  const C = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

export function oklchToOklab({ L, C, h }: OKLCH): OKLab {
  const rad = (h * Math.PI) / 180;
  return { L, a: C * Math.cos(rad), b: C * Math.sin(rad) };
}

export const hexToOklab = (hex: HexColor) => rgbToOklab(hexToRgb(hex));
export const hexToOklch = (hex: HexColor) => oklabToOklch(hexToOklab(hex));

function inGamut(lab: OKLab): boolean {
  const eps = 0.0001;
  return oklabToLinearRgb(lab).every((v) => v >= -eps && v <= 1 + eps);
}

/**
 * OKLCH → HEX mit Gamut-Mapping: Liegt die Farbe außerhalb von sRGB, wird die
 * Buntheit (Chroma) schrittweise reduziert, bis sie darstellbar ist. So bleiben
 * Farbton und Helligkeit erhalten – wichtig für die Regler der Farbakademie.
 */
export function oklchToHex(lch: OKLCH): HexColor {
  const L = clamp(lch.L, 0, 1);
  let lo = 0;
  let hi = Math.max(0, lch.C);
  if (inGamut(oklchToOklab({ L, C: hi, h: lch.h }))) return rgbToHex(oklabToRgb(oklchToOklab({ L, C: hi, h: lch.h })));
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToOklab({ L, C: mid, h: lch.h }))) lo = mid;
    else hi = mid;
  }
  return rgbToHex(oklabToRgb(oklchToOklab({ L, C: lo, h: lch.h })));
}

/* ---------- CIELAB (D65) ---------- */

export function rgbToLab({ r, g, b }: RGB): Lab {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  // sRGB → XYZ (D65)
  const x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / 0.95047;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
  const z = (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export const hexToLab = (hex: HexColor) => rgbToLab(hexToRgb(hex));

/* ---------- Luminanz & Kontrast (WCAG) ---------- */

export function relativeLuminance(hex: HexColor): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(a: HexColor, b: HexColor): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Wählt eine gut lesbare Textfarbe für ein Farbfeld. */
export function readableTextColor(bg: HexColor): HexColor {
  return contrastRatio(bg, '#FFFFFF') >= contrastRatio(bg, '#1A1A1A') ? '#FFFFFF' : '#1A1A1A';
}

/* ---------- Mischen & Abwandeln ---------- */

/** Mischt zwei Farben in OKLab (wahrnehmungsgleichmäßig). t=0 → a, t=1 → b. */
export function mixOklab(a: HexColor, b: HexColor, t: number): HexColor {
  const A = hexToOklab(a);
  const B = hexToOklab(b);
  return rgbToHex(oklabToRgb({ L: A.L + (B.L - A.L) * t, a: A.a + (B.a - A.a) * t, b: A.b + (B.b - A.b) * t }));
}

/** Verändert die OKLCH-Helligkeit um `delta` (z. B. -0.1 = dunkler). */
export function adjustLightness(hex: HexColor, delta: number): HexColor {
  const c = hexToOklch(hex);
  return oklchToHex({ ...c, L: clamp(c.L + delta, 0, 1) });
}

/** Farbe für Nähte/Konturen: dunkler bei hellen Farben, heller bei sehr dunklen. */
export function detailColor(hex: HexColor, strength = 0.12): HexColor {
  const c = hexToOklch(hex);
  return c.L < 0.32 ? oklchToHex({ ...c, L: c.L + strength * 0.9 }) : oklchToHex({ ...c, L: c.L - strength });
}
