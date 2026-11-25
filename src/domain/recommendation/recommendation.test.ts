import { describe, expect, it } from 'vitest';
import { pairColors, pairKey } from './pairing';
import { matchGarments, suggestOutfits } from './garmentMatching';
import { analyzeOutfit, detectHarmony, visibleShares } from './outfitAnalysis';
import { createGarment, garmentColor } from '../profile/factory';
import { getSeason } from '../seasons';
import { seasonFit } from '../seasons/fit';
import { SEASONAL_12, recommendedSwatches } from '../seasons';
import { isValidHex } from '../color';
import { CURATED_EXAMPLES, GREY_BROWN_CASES } from '../examples/curated';

const autumn = getSeason('warm-autumn')!;

describe('Farbtyp-Daten', () => {
  it('enthält zwölf vollständige Farbtypen mit gültigen Farben', () => {
    expect(SEASONAL_12.seasons).toHaveLength(12);
    for (const s of SEASONAL_12.seasons) {
      expect(recommendedSwatches(s).length).toBeGreaterThanOrEqual(20);
      for (const group of Object.values(s.palette)) for (const sw of group) expect(isValidHex(sw.hex)).toBe(true);
      expect(s.neighbors.length).toBeGreaterThan(0);
      expect(s.exampleOutfits.length).toBeGreaterThan(0);
      for (const n of s.neighbors) expect(getSeason(n.seasonId)).toBeDefined();
    }
  });
  it('bewertet Farben passend zum Farbtyp', () => {
    expect(seasonFit('#A65C3D', autumn).level).toBe('palette'); // Rostrot
    expect(['outside', 'possible']).toContain(seasonFit('#E5559B', autumn).level); // Pink
    expect(seasonFit('#E5559B', getSeason('cool-winter')!).level).not.toBe('outside');
  });
});

describe('Paar-Bewertung', () => {
  it('erklärt den Grau-Braun-Konflikt', () => {
    const coolGrey = pairColors('#50545D', '#89613F');
    const warmGrey = pairColors('#77736B', '#89613F');
    const anthraciteCamel = pairColors('#292A2C', '#B18A5E');
    expect(coolGrey.level).toBe('careful');
    expect(coolGrey.reasons.some((r) => r.kind === 'temperature' && r.effect === 'negative')).toBe(true);
    expect(warmGrey.points).toBeGreaterThan(coolGrey.points);
    expect(anthraciteCamel.points).toBeGreaterThan(coolGrey.points);
    expect(anthraciteCamel.reasons.some((r) => r.kind === 'lightness' && r.effect === 'positive')).toBe(true);
  });
  it('erkennt kuratierte Kombinationen', () => {
    const r = pairColors('#35483C', '#CBB99C');
    expect(r.reasons.some((x) => x.kind === 'curated')).toBe(true);
    expect(['strong', 'good']).toContain(r.level);
  });
  it('gibt persönlichen Vorlieben Vorrang', () => {
    const base = pairColors('#35483C', '#CBB99C');
    const disliked = pairColors('#35483C', '#CBB99C', { dislikedColors: ['#CBB99C'] });
    expect(disliked.points).toBeLessThan(base.points);
  });
  it('liefert Begründungen in natürlicher Sprache', () => {
    for (const r of pairColors('#703A40', '#293E53').reasons) expect(r.text.length).toBeGreaterThan(10);
  });
});

describe('Kleidungsvorschläge', () => {
  const pid = 'p';
  const brownTee = createGarment(pid, 'tshirt', [garmentColor('#4F382E')]);
  const wardrobe = [
    brownTee,
    createGarment(pid, 'chino', [garmentColor('#CBB99C')], { name: 'Sand-Chino' }),
    createGarment(pid, 'jeans', [garmentColor('#465B73')], { name: 'Jeans' }),
    createGarment(pid, 'trousers', [garmentColor('#50545D')], { name: 'Kühlgraue Hose' }),
    createGarment(pid, 'leather-jacket', [garmentColor('#3D2920')], { name: 'Lederjacke' }),
    createGarment(pid, 'harrington', [garmentColor('#E5D8BF')], { name: 'Ecru-Jacke' }),
    createGarment(pid, 'sneaker', [garmentColor('#F3EAD7')], { name: 'Sneaker' }),
    createGarment(pid, 'scarf', [garmentColor('#B29A7D')], { name: 'Schal', ownership: 'wishlist' }),
  ];

  it('findet passende Teile je Rolle und sortiert sie', () => {
    const m = matchGarments(brownTee, wardrobe, { season: autumn });
    expect(m.bottom.map((x) => x.garment.name)).toContain('Sand-Chino');
    expect(m.bottom[m.bottom.length - 1].garment.name).toBe('Kühlgraue Hose');
    expect(m.outer.length).toBe(2);
  });

  it('schlägt vollständige Outfits vor und kennzeichnet geplante Teile', () => {
    const owned = suggestOutfits(brownTee, wardrobe, { season: autumn });
    expect(owned.length).toBeGreaterThan(0);
    expect(owned.every((o) => !o.containsPlanned)).toBe(true);
    expect(owned[0].slots.base).toBe(brownTee.id);
    expect(owned[0].slots.bottom).toBeDefined();
    const withPlanned = suggestOutfits(brownTee, wardrobe, { includePlanned: true, limit: 20 });
    expect(withPlanned.some((o) => o.containsPlanned)).toBe(true);
  });

  it('berücksichtigt Feedback', () => {
    const chino = wardrobe[1];
    const fb = new Map([[pairKey(brownTee.id, chino.id), 'unfitting' as const]]);
    const m = matchGarments(brownTee, wardrobe, { feedback: fb });
    expect(m.bottom[0].garment.id).not.toBe(chino.id);
  });
});

describe('Outfit-Analyse', () => {
  const slot = (hex: string, sub: string) => ({ subcategory: sub, colors: [garmentColor(hex)], pattern: { type: 'solid' as const } });

  it('erkennt Ton-in-Ton', () => {
    const a = analyzeOutfit(
      { outer: slot('#4F382E', 'leather-jacket'), base: slot('#89674F', 'tshirt'), bottom: slot('#CBB99C', 'chino') },
      { jacketOpen: true },
    );
    expect(a.harmony).toBe('tone-in-tone');
    expect(a.dimensions.map((d) => d.id)).toEqual(['harmony', 'lightness', 'temperature', 'saturation', 'proportion']);
  });
  it('erkennt neutrale Basis mit Akzent', () => {
    const a = analyzeOutfit(
      { bottom: slot('#293E53', 'jeans'), outer: slot('#E5D8BF', 'harrington'), base: slot('#B76C60', 'tshirt') },
      { jacketOpen: true },
    );
    expect(a.harmony).toBe('neutral-accent');
  });
  it('berücksichtigt den Farbtyp und gibt keine Gesamtnote', () => {
    const a = analyzeOutfit({ base: slot('#E5559B', 'tshirt'), bottom: slot('#293E53', 'jeans') }, { jacketOpen: true }, { season: autumn });
    const season = a.dimensions.find((d) => d.id === 'season');
    expect(season?.tone).toBe('attention');
    expect(JSON.stringify(a)).not.toMatch(/score|%\s*schön/i);
  });
  it('verdeckt Unterschichten bei geschlossener Jacke stärker', () => {
    const slots = { outer: slot('#3D2920', 'leather-jacket'), base: slot('#FAFAFA', 'tshirt') };
    const open = visibleShares(slots, { jacketOpen: true }).find((s) => s.slot === 'base')!.share;
    const closed = visibleShares(slots, { jacketOpen: false }).find((s) => s.slot === 'base')!.share;
    expect(closed).toBeLessThan(open);
  });
  it('erkennt Komplementärkontrast', () => {
    expect(detectHarmony([
      { hex: '#A65C3D', name: '', share: 0.4, slots: [] },
      { hex: '#3D777E', name: '', share: 0.3, slots: [] },
      { hex: '#E5D8BF', name: '', share: 0.3, slots: [] },
    ])).toBe('complementary');
  });
});

describe('Kuratierte Beispiele', () => {
  it('sind vollständig und gültig', () => {
    expect(CURATED_EXAMPLES.length).toBeGreaterThan(20);
    for (const e of CURATED_EXAMPLES) for (const st of Object.values(e.studio)) expect(e.colors[st!.colorIndex]).toBeDefined();
    expect(GREY_BROWN_CASES).toHaveLength(4);
  });
});
