/**
 * Vorausgefülltes, bearbeitbares Startprofil (Warmer Herbst).
 *
 * Bewusst ohne Klarnamen: Das Profil dient als erster Testdatensatz und
 * praktischer Anwendungsfall. Alle HEX-Codes sind vorläufige visuelle
 * Annäherungen und keine offiziell verifizierten Produktfarben.
 *
 * Datenmodell-Trennung:
 * - Vorhandene Kleidung → Garment.ownership = 'owned'
 * - Geplante Anschaffungen → 'planned', Kaufoptionen → 'wishlist'
 * - Reine Inspirations-/Experimentierfarben → profile.customSwatches (kein Kleidungsstück)
 */
import type { CustomSwatch, CustomSwatchKind, Garment, UserProfile } from '@/domain/types';
import { createGarment, createProfile, garmentColor } from '@/domain/profile/factory';
import { createId, nowIso } from '@/domain/id';

const sw = (hex: string, name: string, kind: CustomSwatchKind, note?: string): CustomSwatch => ({
  id: createId('sw'),
  hex,
  name,
  kind,
  createdAt: nowIso(),
  ...(note ? { note } : {}),
});

export function buildStarterProfile(): { profile: UserProfile; garments: Garment[] } {
  const profile = createProfile('Startprofil · Warmer Herbst', {
    sample: 'starter',
    appearance: {
      skinTone: { hex: '#E8C4A3', label: 'Hell, warm' },
      skinUndertone: 'warm',
      hairColor: { hex: '#9A7556', label: 'Hellbraun' },
      naturalHairColor: { hex: '#9A7556', label: 'Hellbraun' },
      hasBeard: true,
      beardColor: { hex: '#B0623A', label: 'Rot / Kupfer' },
      contrast: 'medium',
    },
    colorType: {
      systemId: 'seasonal-12',
      seasonId: 'warm-autumn',
      alternativeSeasonIds: [],
      source: 'manual',
      decidedAt: nowIso(),
    },
    preferences: {
      favoriteColors: [
        { hex: '#35483C', name: 'Dunkelgrün' },
        { hex: '#89674F', name: 'Mittelbraun' },
        { hex: '#656749', name: 'Olivgrün' },
        { hex: '#B18A5E', name: 'Camel' },
        { hex: '#E5D8BF', name: 'Ecru' },
      ],
      dislikedColors: [],
      styles: ['natural', 'timeless', 'modern', 'casual'],
      styleDirection: 'masculine',
      styleNote: 'Natürliche, zeitlose, moderne und unkomplizierte Outfits. Vorliebe für erdige und gedeckte Farben.',
      goals:
        'Ich trage besonders häufig weiße T-Shirts, weil sie sich einfach kombinieren lassen. Ich möchte lernen, farbige T-Shirts unkompliziert mit meinen vorhandenen Jacken und Hosen zu kombinieren. Grau und Braun gefallen mir zusammen häufig nicht – ich möchte verstehen, warum.',
    },
    customSwatches: [
      // Vorgeschlagene neutrale Ergänzungen
      sw('#F3EAD7', 'Cremeweiß', 'neutral-suggestion'),
      sw('#E5D8BF', 'Ecru', 'neutral-suggestion'),
      sw('#CBB99C', 'Sandbeige', 'neutral-suggestion'),
      sw('#A69986', 'Warmes Taupe', 'neutral-suggestion'),
      sw('#B18A5E', 'Camel', 'neutral-suggestion'),
      // Vorläufige Hosenfarben – noch kein bestätigter Teil des Kleiderschranks
      sw('#465B73', 'Jeansblau', 'trial-bottom'),
      sw('#293E53', 'Dunkelblau', 'trial-bottom'),
      sw('#252526', 'Schwarz', 'trial-bottom'),
      sw('#515154', 'Anthrazit', 'trial-bottom'),
      sw('#C7B596', 'Beige', 'trial-bottom'),
      sw('#656749', 'Olivgrün', 'trial-bottom'),
      sw('#72533E', 'Braun', 'trial-bottom'),
      sw('#EEE5D5', 'Cremeweiß', 'trial-bottom'),
      // Weitere inspirierende Herbstfarben
      sw('#A65C3D', 'Rostrot', 'inspiration'),
      sw('#A36132', 'Cognac', 'inspiration'),
      sw('#503629', 'Schokobraun', 'inspiration'),
      sw('#35483A', 'Waldgrün', 'inspiration'),
      sw('#626744', 'Olivgrün', 'inspiration'),
      sw('#3D777E', 'Petrol', 'inspiration'),
      sw('#263346', 'Marineblau', 'inspiration'),
      sw('#77736B', 'Warmes Grau', 'inspiration'),
      sw('#D7C6AA', 'Hellbeige', 'inspiration'),
    ],
    notes: 'Weitere vorhandene Oberteile in herbstlichen Grüntönen – genaue Kleidungsarten und Farbcodes noch zu erfassen.',
  });

  const pid = profile.id;
  const airism = { brand: 'Uniqlo', model: 'AIRism Oversized', material: 'AIRism (Baumwolle/Polyester)', fit: 'oversized' as const, sample: true, colorIsApproximation: true };
  const tee = (hex: string, name: string, ownership: Garment['ownership'], extra: Partial<Garment> = {}) =>
    createGarment(pid, 'oversized-tee', [garmentColor(hex, 1, 'main', name)], {
      name: `AIRism Oversized T-Shirt ${name}`,
      ...airism,
      seasons: ['spring', 'summer', 'autumn'],
      styles: ['casual', 'modern'],
      ownership,
      ...extra,
    });

  const garments: Garment[] = [
    tee('#FAFAFA', 'Reinweiß', 'owned', { notes: 'Wird sehr häufig getragen, weil Weiß einfach kombinierbar ist.' }),
    tee('#703A40', 'Weinrot', 'owned'),
    tee('#B76C60', 'Verwaschenes Rot', 'owned', { name: 'AIRism Oversized T-Shirt verwaschenes Hellrot' }),
    tee('#35483C', 'Dunkelgrün', 'owned'),
    tee('#35483C', 'Dunkelgrün', 'owned', { name: 'AIRism Oversized T-Shirt Dunkelgrün (2)' }),
    tee('#89674F', 'Mittleres Braun', 'planned', { purchaseStatus: 'not-purchased', wishlist: { priority: 1, reason: 'Ergänzt die Herbstpalette' } }),
    tee('#4F382E', 'Dunkelbraun', 'planned', { purchaseStatus: 'not-purchased', wishlist: { priority: 2 } }),

    createGarment(pid, 'leather-jacket', [garmentColor('#3D2920', 1, 'main', 'Dunkelbraun')], {
      name: 'Dunkelbraune Lederjacke',
      material: 'Leder',
      seasons: ['spring', 'autumn'],
      styles: ['timeless', 'modern'],
      sample: true,
      colorIsApproximation: true,
    }),
    createGarment(pid, 'transition-jacket', [garmentColor('#292A2C', 1, 'main', 'Fast Schwarz')], {
      name: 'North Face Jacke, sehr dunkelgrau',
      brand: 'The North Face',
      seasons: ['autumn', 'winter'],
      styles: ['outdoor', 'modern'],
      notes: 'Jackentyp noch prüfen (z. B. Softshell oder Übergangsjacke).',
      sample: true,
      colorIsApproximation: true,
    }),
    createGarment(
      pid,
      'transition-jacket',
      [garmentColor('#777975', 0.6, 'main', 'Grau'), garmentColor('#35483A', 0.4, 'secondary', 'Dunkelgrün')],
      {
        name: 'Grau-dunkelgrüne Jacke',
        pattern: { type: 'colorblock' },
        seasons: ['spring', 'autumn'],
        styles: ['outdoor', 'casual'],
        notes: 'Jackentyp und Farbanteile noch prüfen.',
        sample: true,
        colorIsApproximation: true,
      },
    ),
    createGarment(
      pid,
      'transition-jacket',
      [garmentColor('#896345', 0.6, 'main', 'Braun'), garmentColor('#493426', 0.4, 'secondary', 'Dunkelbraun')],
      {
        name: 'Braun-dunkelbraune Jacke',
        pattern: { type: 'colorblock' },
        seasons: ['spring', 'autumn'],
        styles: ['natural', 'casual'],
        notes: 'Jackentyp und Farbanteile noch prüfen.',
        sample: true,
        colorIsApproximation: true,
      },
    ),

    createGarment(
      pid,
      'scarf',
      [garmentColor('#B29A7D', 0.6, 'main', 'Sandbeige'), garmentColor('#E8DAC3', 0.4, 'secondary', 'Creme')],
      {
        name: 'Karierter Schal Sandbeige/Creme',
        pattern: { type: 'check' },
        ownership: 'wishlist',
        purchaseStatus: 'not-purchased',
        wishlist: { priority: 1, reason: 'Bisher bevorzugt – passt zum Farbtyp und hellt die dunklen Jacken auf.' },
        seasons: ['autumn', 'winter'],
        sample: true,
        colorIsApproximation: true,
      },
    ),
    createGarment(
      pid,
      'scarf',
      [garmentColor('#202432', 0.55, 'main', 'Dunkelblau'), garmentColor('#263B35', 0.45, 'secondary', 'Tannengrün')],
      {
        name: 'Karierter Schal Dunkelblau/Tannengrün',
        pattern: { type: 'check' },
        ownership: 'wishlist',
        purchaseStatus: 'not-purchased',
        wishlist: { priority: 2, reason: 'Alternative Kaufoption – dunkler, weniger Kontrast zu dunklen Jacken.' },
        seasons: ['autumn', 'winter'],
        sample: true,
        colorIsApproximation: true,
      },
    ),
  ];

  return { profile, garments };
}

/** Anonymisiertes Demo-Profil für öffentliche Vorführungen (kühler Typ, andere Garderobe). */
export function buildDemoProfile(): { profile: UserProfile; garments: Garment[] } {
  const profile = createProfile('Demo · Kühler Sommer', {
    sample: 'demo',
    appearance: {
      skinTone: { hex: '#F6E3D4', label: 'Sehr hell, rosig' },
      skinUndertone: 'cool',
      hairColor: { hex: '#BFB09A', label: 'Aschblond' },
      naturalHairColor: { hex: '#BFB09A', label: 'Aschblond' },
      eyeColor: { hex: '#7D8A99', label: 'Graublau' },
      hasBeard: false,
      contrast: 'medium',
    },
    colorType: { systemId: 'seasonal-12', seasonId: 'cool-summer', alternativeSeasonIds: ['soft-summer'], source: 'manual' },
    preferences: { favoriteColors: [], dislikedColors: [], styles: ['classic', 'elegant'], styleDirection: 'feminine' },
  });
  const pid = profile.id;
  const g = (sub: string, hex: string, name: string, extra: Partial<Garment> = {}) =>
    createGarment(pid, sub, [garmentColor(hex, 1, 'main', name)], { sample: true, ...extra });
  return {
    profile,
    garments: [
      g('blouse', '#F4F4F2', 'Weichweiß', { name: 'Bluse Weichweiß' }),
      g('pullover', '#5F7189', 'Graublau', { name: 'Pullover Graublau' }),
      g('cardigan', '#E0A3B5', 'Rosé', { name: 'Cardigan Rosé' }),
      g('trousers', '#2F3E5C', 'Kühles Marine', { name: 'Stoffhose Marine' }),
      g('skirt', '#6B707A', 'Schiefergrau', { name: 'Rock Schiefergrau' }),
      g('trenchcoat', '#9A9CA3', 'Taubengrau', { name: 'Trenchcoat Taubengrau' }),
      g('loafer', '#2B2B30', 'Dunkelgrau', { name: 'Loafer Dunkelgrau' }),
    ],
  };
}
