/**
 * Robuste Farbermittlung aus Bilddaten (Kamera/Foto).
 *
 * - Kein Einzelpixel: Es wird ein kreisförmiger Bereich ausgewertet.
 * - Glanzlichter (Spiegelungen) und tiefe Schatten werden per getrimmtem
 *   Mittelwert verworfen.
 * - Gemittelt wird in linearem RGB (physikalisch korrekte Lichtmischung).
 * - Optionaler Weißabgleich über eine neutrale Grau-/Weißkarte.
 * - Dominante Farben per k-Means in OKLab.
 *
 * Ergebnis ist immer eine Schätzung der wahrgenommenen Farbe – keine
 * farbmetrische Messung.
 */
import type { HexColor } from '../types';
import { hexToRgb, linearToSrgb, oklabToRgb, rgbToHex, rgbToOklab, srgbToLinear, type OKLab } from '../color/convert';

export interface PixelSource {
  data: Uint8ClampedArray | number[];
  width: number;
  height: number;
}

export interface SampleResult {
  hex: HexColor;
  sampleSize: number;
  warnings: string[];
}

export function sampleRegion(img: PixelSource, cx: number, cy: number, radius: number, trimHigh = 0.15, trimLow = 0.1): SampleResult | null {
  const px: { r: number; g: number; b: number; y: number }[] = [];
  let clippedHigh = 0;
  let clippedLow = 0;
  const r2 = radius * radius;
  for (let y = Math.max(0, Math.floor(cy - radius)); y <= Math.min(img.height - 1, Math.ceil(cy + radius)); y++) {
    for (let x = Math.max(0, Math.floor(cx - radius)); x <= Math.min(img.width - 1, Math.ceil(cx + radius)); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > r2) continue;
      const i = (y * img.width + x) * 4;
      const r = img.data[i];
      const g = img.data[i + 1];
      const b = img.data[i + 2];
      if (Math.max(r, g, b) >= 250) clippedHigh++;
      if (Math.max(r, g, b) <= 8) clippedLow++;
      const lr = srgbToLinear(r);
      const lg = srgbToLinear(g);
      const lb = srgbToLinear(b);
      px.push({ r: lr, g: lg, b: lb, y: 0.2126 * lr + 0.7152 * lg + 0.0722 * lb });
    }
  }
  if (px.length === 0) return null;
  px.sort((a, b) => a.y - b.y);
  const lo = Math.floor(px.length * trimLow);
  const hi = Math.max(lo + 1, Math.ceil(px.length * (1 - trimHigh)));
  const kept = px.slice(lo, hi);
  const avg = kept.reduce((s, p) => ({ r: s.r + p.r, g: s.g + p.g, b: s.b + p.b }), { r: 0, g: 0, b: 0 });
  const n = kept.length;
  const hex = rgbToHex({ r: linearToSrgb(avg.r / n), g: linearToSrgb(avg.g / n), b: linearToSrgb(avg.b / n) });
  const warnings: string[] = [];
  if (clippedHigh / px.length > 0.25) warnings.push('Der Bereich ist teilweise überbelichtet. Weniger direktes Licht oder einen anderen Bildausschnitt wählen.');
  if (clippedLow / px.length > 0.25) warnings.push('Der Bereich ist sehr dunkel (unterbelichtet). Mehr gleichmäßiges Licht verwenden.');
  const spread = px[px.length - 1].y - px[0].y;
  if (spread > 0.5) warnings.push('Im Messbereich gibt es starke Helligkeitsunterschiede (Schatten, Falten oder Muster). Einen gleichmäßigeren Bereich wählen.');
  return { hex, sampleSize: px.length, warnings };
}

/**
 * Weißabgleich: Die Referenz (neutrale Grau-/Weißkarte) wird rechnerisch
 * neutral gemacht; derselbe Faktor wird auf die Messfarbe angewendet.
 */
export function applyWhiteBalance(sample: HexColor, reference: HexColor): HexColor {
  const s = hexToRgb(sample);
  const r = hexToRgb(reference);
  const lr = [srgbToLinear(r.r), srgbToLinear(r.g), srgbToLinear(r.b)];
  const yRef = 0.2126 * lr[0] + 0.7152 * lr[1] + 0.0722 * lr[2];
  const gains = lr.map((c) => (c > 0.001 ? yRef / c : 1));
  const ls = [srgbToLinear(s.r), srgbToLinear(s.g), srgbToLinear(s.b)];
  const out = ls.map((c, i) => Math.min(1, c * gains[i]));
  return rgbToHex({ r: linearToSrgb(out[0]), g: linearToSrgb(out[1]), b: linearToSrgb(out[2]) });
}

export interface DominantColor {
  hex: HexColor;
  share: number;
}

/** Dominante Farben per k-Means in OKLab (deterministische Initialisierung). */
export function dominantColors(img: PixelSource, k = 5, maxSamples = 4000): DominantColor[] {
  const total = img.width * img.height;
  const step = Math.max(1, Math.floor(total / maxSamples));
  const pts: OKLab[] = [];
  for (let p = 0; p < total; p += step) {
    const i = p * 4;
    if (img.data[i + 3] !== undefined && img.data[i + 3] < 128) continue;
    pts.push(rgbToOklab({ r: img.data[i], g: img.data[i + 1], b: img.data[i + 2] }));
  }
  if (pts.length === 0) return [];
  k = Math.min(k, pts.length);
  // k-means++-ähnliche, deterministische Startwerte: jeweils der am weitesten entfernte Punkt
  const centers: OKLab[] = [pts[Math.floor(pts.length / 2)]];
  const d = (a: OKLab, b: OKLab) => (a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2;
  while (centers.length < k) {
    let best = pts[0];
    let bestD = -1;
    for (const p of pts) {
      const md = Math.min(...centers.map((c) => d(p, c)));
      if (md > bestD) {
        bestD = md;
        best = p;
      }
    }
    centers.push(best);
  }
  const assign = new Array(pts.length).fill(0);
  for (let iter = 0; iter < 12; iter++) {
    for (let i = 0; i < pts.length; i++) {
      let bi = 0;
      let bd = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const dd = d(pts[i], centers[c]);
        if (dd < bd) {
          bd = dd;
          bi = c;
        }
      }
      assign[i] = bi;
    }
    for (let c = 0; c < centers.length; c++) {
      let n = 0;
      const sum = { L: 0, a: 0, b: 0 };
      for (let i = 0; i < pts.length; i++)
        if (assign[i] === c) {
          n++;
          sum.L += pts[i].L;
          sum.a += pts[i].a;
          sum.b += pts[i].b;
        }
      if (n) centers[c] = { L: sum.L / n, a: sum.a / n, b: sum.b / n };
    }
  }
  const counts = centers.map((_, c) => assign.filter((a) => a === c).length);
  return centers
    .map((c, i) => ({ hex: rgbToHex(oklabToRgb(c)), share: counts[i] / pts.length }))
    .filter((c) => c.share > 0.02)
    .sort((a, b) => b.share - a.share);
}
