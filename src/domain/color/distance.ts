/**
 * Farbabstände.
 *
 * - `deltaEOK`: euklidischer Abstand in OKLab (schnell, wahrnehmungsnah, ~0.02 ≈ gerade sichtbar)
 * - `deltaE2000`: CIEDE2000 auf CIELAB (Industriestandard, ~1 ≈ gerade sichtbar, >10 deutlich anders)
 *
 * Wichtig: Ein kleiner Abstand bedeutet „ähnliche Farbe“, nicht „harmonische
 * Kombination“. Harmonie wird in `domain/recommendation` separat bewertet.
 */
import type { HexColor } from '../types';
import { hexToLab, hexToOklab } from './convert';

export function deltaEOK(a: HexColor, b: HexColor): number {
  const A = hexToOklab(a);
  const B = hexToOklab(b);
  return Math.hypot(A.L - B.L, A.a - B.a, A.b - B.b);
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** CIEDE2000 nach Sharma, Wu & Dalal (2005). */
export function deltaE2000(hexA: HexColor, hexB: HexColor): number {
  const { L: L1, a: a1, b: b1 } = hexToLab(hexA);
  const { L: L2, a: a2, b: b2 } = hexToLab(hexB);
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = C1p === 0 ? 0 : (deg(Math.atan2(b1, a1p)) + 360) % 360;
  const h2p = C2p === 0 ? 0 : (deg(Math.atan2(b2, a2p)) + 360) % 360;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2));

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;
  let hbarp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2;
    else if (h1p + h2p < 360) hbarp = (h1p + h2p + 360) / 2;
    else hbarp = (h1p + h2p - 360) / 2;
  }
  const T =
    1 -
    0.17 * Math.cos(rad(hbarp - 30)) +
    0.24 * Math.cos(rad(2 * hbarp)) +
    0.32 * Math.cos(rad(3 * hbarp + 6)) -
    0.2 * Math.cos(rad(4 * hbarp - 63));
  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const Rc = 2 * Math.sqrt(Math.pow(Cbarp, 7) / (Math.pow(Cbarp, 7) + Math.pow(25, 7)));
  const Sl = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
  const Sc = 1 + 0.045 * Cbarp;
  const Sh = 1 + 0.015 * Cbarp * T;
  const Rt = -Math.sin(rad(2 * dTheta)) * Rc;
  return Math.sqrt(
    Math.pow(dLp / Sl, 2) + Math.pow(dCp / Sc, 2) + Math.pow(dHp / Sh, 2) + Rt * (dCp / Sc) * (dHp / Sh),
  );
}

/** Verbale Einordnung eines Delta-E-2000-Werts. */
export function describeDeltaE(de: number): string {
  if (de < 2) return 'kaum unterscheidbar';
  if (de < 5) return 'sehr ähnlich';
  if (de < 10) return 'ähnlich';
  if (de < 20) return 'deutlich verschieden';
  return 'sehr verschieden';
}

export function nearest<T>(hex: HexColor, items: T[], getHex: (t: T) => HexColor): { item: T; distance: number } | null {
  let best: { item: T; distance: number } | null = null;
  for (const item of items) {
    const d = deltaE2000(hex, getHex(item));
    if (!best || d < best.distance) best = { item, distance: d };
  }
  return best;
}
