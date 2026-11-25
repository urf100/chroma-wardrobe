/**
 * SVG-Muster für Kleidungsstücke. Farben: [Hauptfarbe, Sekundärfarbe, Akzent].
 * Fehlende Farben werden aus der Hauptfarbe abgeleitet.
 */
import type { GarmentColor, PatternType } from '@/domain/types';
import { adjustLightness, detailColor, mixOklab } from '@/domain/color/convert';

export interface PatternColors {
  main: string;
  secondary: string;
  accent: string;
  shares: number[];
}

export function patternColors(colors: GarmentColor[]): PatternColors {
  const main = colors[0]?.hex ?? '#9A9A9A';
  const secondary = colors[1]?.hex ?? detailColor(main, 0.14);
  const accent = colors[2]?.hex ?? mixOklab(main, secondary, 0.5);
  return { main, secondary, accent, shares: colors.map((c) => c.share) };
}

/** Pseudozufall mit festem Startwert (stabile Muster ohne Flackern). */
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function PatternDef({ id, type, pc }: { id: string; type: PatternType; pc: PatternColors }) {
  const { main, secondary, accent, shares } = pc;
  switch (type) {
    case 'stripes': {
      const share2 = Math.min(0.6, Math.max(0.2, shares[1] ?? 0.35));
      const h = 10;
      return (
        <pattern id={id} width={h} height={h} patternUnits="userSpaceOnUse">
          <rect width={h} height={h} fill={main} />
          <rect width={h} height={h * share2} fill={secondary} />
        </pattern>
      );
    }
    case 'check':
      return (
        <pattern id={id} width={26} height={26} patternUnits="userSpaceOnUse">
          <rect width={26} height={26} fill={main} />
          <rect x={0} y={0} width={9} height={26} fill={secondary} opacity={0.75} />
          <rect x={0} y={0} width={26} height={9} fill={secondary} opacity={0.75} />
          <rect x={17} y={0} width={1.6} height={26} fill={accent} opacity={0.9} />
          <rect x={0} y={17} width={26} height={1.6} fill={accent} opacity={0.9} />
        </pattern>
      );
    case 'melange': {
      const r = rand(7);
      const light = adjustLightness(main, 0.07);
      const dark = adjustLightness(main, -0.07);
      return (
        <pattern id={id} width={14} height={14} patternUnits="userSpaceOnUse">
          <rect width={14} height={14} fill={main} />
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={i} x={r() * 14} y={r() * 14} width={1.4} height={0.9} fill={i % 2 ? light : dark} opacity={0.85} />
          ))}
        </pattern>
      );
    }
    case 'houndstooth':
      return (
        <pattern id={id} width={12} height={12} patternUnits="userSpaceOnUse">
          <rect width={12} height={12} fill={main} />
          <path d="M0 0h6v6H0z M6 6l6 6H6z M0 6l6 6V6z M6 0l6 6V0z" fill={secondary} />
        </pattern>
      );
    case 'herringbone': {
      const line = detailColor(main, 0.16);
      return (
        <pattern id={id} width={12} height={8} patternUnits="userSpaceOnUse">
          <rect width={12} height={8} fill={main} />
          <path d="M0 8 L6 0 M-3 4 L0 0 M3 8 L6 4" stroke={line} strokeWidth={1.1} />
          <path d="M6 0 L12 8 M9 0 L12 4 M6 4 L9 8" stroke={line} strokeWidth={1.1} />
        </pattern>
      );
    }
    case 'camouflage':
      return (
        <pattern id={id} width={60} height={60} patternUnits="userSpaceOnUse">
          <rect width={60} height={60} fill={main} />
          <path d="M5 8 q10 -8 18 2 q6 10 -6 14 q-14 2 -12 -16z" fill={secondary} />
          <path d="M34 30 q14 -6 20 6 q2 12 -12 10 q-12 -2 -8 -16z" fill={accent} />
          <path d="M8 40 q10 -4 14 6 q-2 10 -12 8 q-8 -4 -2 -14z" fill={adjustLightness(main, -0.1)} />
          <path d="M36 4 q10 0 12 8 q-6 6 -14 2 q-4 -6 2 -10z" fill={adjustLightness(main, -0.1)} />
        </pattern>
      );
    case 'colorblock': {
      const top = Math.round(Math.min(0.7, Math.max(0.25, shares[1] ?? 0.4)) * 100);
      return (
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={secondary} />
          <stop offset={`${top}%`} stopColor={secondary} />
          <stop offset={`${top}%`} stopColor={main} />
          <stop offset="100%" stopColor={main} />
        </linearGradient>
      );
    }
    case 'print': {
      const r = rand(13);
      return (
        <pattern id={id} width={24} height={24} patternUnits="userSpaceOnUse">
          <rect width={24} height={24} fill={main} />
          {Array.from({ length: 5 }, (_, i) => (
            <circle key={i} cx={r() * 24} cy={r() * 24} r={1.2 + r() * 1.8} fill={i % 2 ? secondary : accent} />
          ))}
        </pattern>
      );
    }
    case 'custom':
      return (
        <pattern id={id} width={10} height={10} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width={10} height={10} fill={main} />
          <rect width={3} height={10} fill={secondary} />
        </pattern>
      );
    default:
      return null;
  }
}
