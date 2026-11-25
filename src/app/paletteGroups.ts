import type { ColorSeason, UserProfile } from '@/domain/types';
import type { PaletteGroup } from '@/components/color/ColorPicker';
import { PALETTE_GROUPS } from '@/domain/seasons';
import { t } from '@/i18n';

/** Neutrale Grundfarben, die unabhängig vom Farbtyp angeboten werden. */
export const UNIVERSAL_NEUTRALS = [
  { hex: '#FAFAFA', name: 'Reinweiß' },
  { hex: '#F3EAD7', name: 'Cremeweiß' },
  { hex: '#E5D8BF', name: 'Ecru' },
  { hex: '#C7B596', name: 'Beige' },
  { hex: '#B18A5E', name: 'Camel' },
  { hex: '#72533E', name: 'Braun' },
  { hex: '#4F382E', name: 'Dunkelbraun' },
  { hex: '#C4C4C4', name: 'Hellgrau' },
  { hex: '#808080', name: 'Mittelgrau' },
  { hex: '#414143', name: 'Anthrazit' },
  { hex: '#1C1C1E', name: 'Schwarz' },
  { hex: '#465B73', name: 'Jeansblau' },
  { hex: '#293E53', name: 'Dunkelblau' },
  { hex: '#263346', name: 'Marineblau' },
  { hex: '#656749', name: 'Olivgrün' },
  { hex: '#8F8A62', name: 'Khaki' },
];

export function buildPaletteGroups(profile: UserProfile | null, season?: ColorSeason): PaletteGroup[] {
  const groups: PaletteGroup[] = [];
  if (profile?.customSwatches.length) {
    const kinds = ['personal', 'neutral-suggestion', 'trial-bottom', 'inspiration'] as const;
    for (const k of kinds) {
      const sw = profile.customSwatches.filter((s) => s.kind === k);
      if (sw.length) groups.push({ label: t.swatchKind[k], swatches: sw });
    }
  }
  if (profile?.preferences.favoriteColors.length) groups.push({ label: 'Lieblingsfarben', swatches: profile.preferences.favoriteColors });
  if (season) {
    for (const g of PALETTE_GROUPS) {
      if (g.key === 'avoid' || g.key === 'metals') continue;
      groups.push({ label: `${season.nameDe} · ${g.label}`, swatches: season.palette[g.key] });
    }
  }
  groups.push({ label: 'Neutrale Grundfarben', swatches: UNIVERSAL_NEUTRALS });
  return groups;
}
