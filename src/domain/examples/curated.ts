/**
 * Kuratierte Farbbeispiele für Outfit-Studio und Farbakademie.
 *
 * Diese Kombinationen sind Ausgangspunkte zum Ausprobieren und keine
 * universell gültigen ästhetischen Regeln.
 */
import type { ColorSwatch, OutfitSlot } from '../types';

export type HarmonyKind =
  | 'monochrome'
  | 'tone-in-tone'
  | 'analogous'
  | 'complementary'
  | 'split-complementary'
  | 'triadic'
  | 'tetradic'
  | 'neutral-accent'
  | 'lightness-contrast'
  | 'saturation-contrast'
  | 'warm-cool'
  | 'neutral';

export const HARMONY_LABEL: Record<HarmonyKind, string> = {
  monochrome: 'Monochromatisch',
  'tone-in-tone': 'Ton-in-Ton',
  analogous: 'Analoge Harmonie',
  complementary: 'Komplementärkontrast',
  'split-complementary': 'Split-Komplementär',
  triadic: 'Triadisch',
  tetradic: 'Tetradisch',
  'neutral-accent': 'Neutrale Basis mit Akzent',
  'lightness-contrast': 'Helligkeitskontrast',
  'saturation-contrast': 'Sättigungskontrast',
  'warm-cool': 'Warm-Kalt-Kontrast',
  neutral: 'Neutrale Kombination',
};

export interface CuratedExample {
  id: string;
  title: string;
  group: 'tee-pairing' | 'harmony' | 'grey-brown';
  description: string;
  colors: ColorSwatch[];
  harmony?: HarmonyKind;
  /** Vorschlag, wie die Farben im Outfit-Studio verteilt werden. Index → Farbe aus `colors`. */
  studio: Partial<Record<OutfitSlot, { colorIndex: number; subcategory: string }>>;
}

const s = (hex: string, name: string): ColorSwatch => ({ hex, name });

/** Passende Farben für die AIRism-T-Shirts aus dem Startprofil. */
export const TEE_PAIRINGS: { tee: ColorSwatch; pairs: ColorSwatch[]; note: string }[] = [
  {
    tee: s('#703A40', 'Weinrot'),
    pairs: [s('#293E53', 'Dunkelblau'), s('#C7B596', 'Beige'), s('#414143', 'Anthrazit'), s('#E5D8BF', 'Ecru')],
    note: 'Weinrot ist tief und gedeckt – es verbindet sich ruhig mit dunklen Blau- und Grautönen und wirkt mit hellen Beigetönen frischer.',
  },
  {
    tee: s('#B76C60', 'Verwaschenes Rot'),
    pairs: [s('#656749', 'Olivgrün'), s('#4F382E', 'Dunkelbraun'), s('#465B73', 'Jeansblau')],
    note: 'Das gedeckte Hellrot braucht ruhige, mittlere bis dunkle Partner. Oliv erzeugt einen weichen Komplementärkontrast, Jeansblau einen Warm-Kalt-Kontrast.',
  },
  {
    tee: s('#35483C', 'Dunkelgrün'),
    pairs: [s('#CBB99C', 'Sandbeige'), s('#72533E', 'Braun'), s('#EEE5D5', 'Cremeweiß'), s('#E5D8BF', 'Ecru')],
    note: 'Dunkelgrün funktioniert fast wie eine Neutralfarbe. Helle Beigetöne geben Helligkeitskontrast, Braun wirkt natürlich-herbstlich.',
  },
  {
    tee: s('#89674F', 'Mittleres Braun'),
    pairs: [s('#293E53', 'Dunkelblau'), s('#656749', 'Olivgrün'), s('#E5D8BF', 'Ecru'), s('#F3EAD7', 'Cremeweiß')],
    note: 'Mittelbraun liegt in der Helligkeit in der Mitte – dunkle Hosen (Dunkelblau, Oliv) oder sehr helle Töne sorgen für klaren Kontrast.',
  },
  {
    tee: s('#4F382E', 'Dunkelbraun'),
    pairs: [s('#B18A5E', 'Camel'), s('#D7C6AA', 'Hellbeige'), s('#465B73', 'Jeansblau'), s('#CBB99C', 'Sandbeige'), s('#F3EAD7', 'Cremeweiß')],
    note: 'Dunkelbraun ist eine warme Neutralfarbe. Mit hellen Beigetönen entsteht Ton-in-Ton mit Kontrast, mit Jeansblau ein entspannter Warm-Kalt-Kontrast.',
  },
];

export const CURATED_EXAMPLES: CuratedExample[] = [
  ...TEE_PAIRINGS.flatMap((p, pi) =>
    p.pairs.map<CuratedExample>((pair, i) => ({
      id: `tee-${pi}-${i}`,
      title: `${p.tee.name} + ${pair.name}`,
      group: 'tee-pairing',
      description: p.note,
      colors: [p.tee, pair],
      studio: {
        base: { colorIndex: 0, subcategory: 'oversized-tee' },
        bottom: { colorIndex: 1, subcategory: 'chino' },
      },
    })),
  ),
  {
    id: 'analog-earthy',
    title: 'Analoge, erdige Farbharmonie',
    group: 'harmony',
    harmony: 'analogous',
    description: 'Oliv, Braun und Camel liegen im Farbkreis nah beieinander (Gelb-Orange-Bereich). Das wirkt ruhig, natürlich und zusammenhängend.',
    colors: [s('#626744', 'Olivgrün'), s('#89674F', 'Braun'), s('#B18A5E', 'Camel')],
    studio: {
      bottom: { colorIndex: 0, subcategory: 'chino' },
      base: { colorIndex: 1, subcategory: 'oversized-tee' },
      outer: { colorIndex: 2, subcategory: 'wool-coat' },
    },
  },
  {
    id: 'near-complementary',
    title: 'Annähernd komplementärer Farbkontrast',
    group: 'harmony',
    harmony: 'complementary',
    description: 'Rostrot und Petrol liegen sich im Farbkreis fast gegenüber. Weil beide gedeckt sind, wirkt der Kontrast lebendig, aber nicht grell. Ecru beruhigt.',
    colors: [s('#A65C3D', 'Rostrot'), s('#3D777E', 'Petrol'), s('#E5D8BF', 'Ecru')],
    studio: {
      knit: { colorIndex: 0, subcategory: 'pullover' },
      bottom: { colorIndex: 2, subcategory: 'chino' },
      scarf: { colorIndex: 1, subcategory: 'scarf' },
    },
  },
  {
    id: 'tone-in-tone',
    title: 'Ton-in-Ton',
    group: 'harmony',
    harmony: 'tone-in-tone',
    description: 'Drei Abstufungen desselben Farbtons (Braun) in unterschiedlicher Helligkeit. Ein sehr eleganter, unkomplizierter Weg zu einem stimmigen Outfit.',
    colors: [s('#4F382E', 'Dunkelbraun'), s('#89674F', 'Braun'), s('#CBB99C', 'Sand')],
    studio: {
      outer: { colorIndex: 0, subcategory: 'leather-jacket' },
      base: { colorIndex: 1, subcategory: 'oversized-tee' },
      bottom: { colorIndex: 2, subcategory: 'chino' },
    },
  },
  {
    id: 'lightness-contrast',
    title: 'Helligkeitskontrast',
    group: 'harmony',
    harmony: 'lightness-contrast',
    description: 'Fast-Schwarz und Cremeweiß bilden einen starken Hell-Dunkel-Kontrast. Braun vermittelt in der Mitte.',
    colors: [s('#292A2C', 'Anthrazit'), s('#F3EAD7', 'Cremeweiß'), s('#89674F', 'Braun')],
    studio: {
      outer: { colorIndex: 0, subcategory: 'transition-jacket' },
      base: { colorIndex: 1, subcategory: 'oversized-tee' },
      bottom: { colorIndex: 2, subcategory: 'chino' },
    },
  },
  {
    id: 'neutral-accent',
    title: 'Neutrale Basis mit Akzentfarbe',
    group: 'harmony',
    harmony: 'neutral-accent',
    description: 'Dunkelblau und Ecru sind ruhige Neutrale. Weinrot setzt einen einzelnen, klaren Akzent – etwa als T-Shirt oder Schal.',
    colors: [s('#293E53', 'Dunkelblau'), s('#E5D8BF', 'Ecru'), s('#703A40', 'Weinrot')],
    studio: {
      bottom: { colorIndex: 0, subcategory: 'jeans' },
      outer: { colorIndex: 1, subcategory: 'harrington' },
      base: { colorIndex: 2, subcategory: 'oversized-tee' },
    },
  },
  {
    id: 'natural-autumn',
    title: 'Natürlich und herbstlich',
    group: 'harmony',
    harmony: 'neutral-accent',
    description: 'Dunkelgrün als ruhige Farbe, Sandbeige als helle Neutrale und Espresso-Braun als dunkler Rahmen.',
    colors: [s('#35483C', 'Dunkelgrün'), s('#CBB99C', 'Sandbeige'), s('#3D2920', 'Dunkelbraun')],
    studio: {
      base: { colorIndex: 0, subcategory: 'oversized-tee' },
      bottom: { colorIndex: 1, subcategory: 'chino' },
      outer: { colorIndex: 2, subcategory: 'leather-jacket' },
    },
  },
  {
    id: 'warm-character',
    title: 'Warm und charaktervoll',
    group: 'harmony',
    harmony: 'analogous',
    description: 'Verwaschenes Rot, Oliv und Dunkelbraun: drei warme, gedeckte Farben mit unterschiedlicher Helligkeit.',
    colors: [s('#B76C60', 'Verwaschenes Rot'), s('#656749', 'Olivgrün'), s('#4F382E', 'Dunkelbraun')],
    studio: {
      base: { colorIndex: 0, subcategory: 'oversized-tee' },
      bottom: { colorIndex: 1, subcategory: 'cargo' },
      outer: { colorIndex: 2, subcategory: 'bomber' },
    },
  },
  {
    id: 'modern-easy',
    title: 'Modern und unkompliziert',
    group: 'harmony',
    harmony: 'lightness-contrast',
    description: 'Anthrazit, Cremeweiß und Jeansblau – eine kühl-neutrale Kombination, die fast immer funktioniert.',
    colors: [s('#292A2C', 'Anthrazit'), s('#F3EAD7', 'Cremeweiß'), s('#465B73', 'Jeansblau')],
    studio: {
      outer: { colorIndex: 0, subcategory: 'transition-jacket' },
      base: { colorIndex: 1, subcategory: 'oversized-tee' },
      bottom: { colorIndex: 2, subcategory: 'jeans' },
    },
  },
  {
    id: 'earthy-elegant',
    title: 'Erdig und elegant',
    group: 'harmony',
    harmony: 'warm-cool',
    description: 'Warmes Braun trifft kühles Dunkelblau – ein klassischer Warm-Kalt-Kontrast. Sandbeige verbindet beide.',
    colors: [s('#89674F', 'Braun'), s('#293E53', 'Dunkelblau'), s('#B29A7D', 'Sandbeige')],
    studio: {
      knit: { colorIndex: 0, subcategory: 'pullover' },
      bottom: { colorIndex: 1, subcategory: 'trousers' },
      scarf: { colorIndex: 2, subcategory: 'scarf' },
    },
  },
];

export interface GreyBrownCase {
  id: string;
  title: string;
  grey: ColorSwatch;
  brown: ColorSwatch;
  explanation: string;
}

/** Spezieller Vergleich: Warum Grau und Braun manchmal nicht harmonieren. */
export const GREY_BROWN_CASES: GreyBrownCase[] = [
  {
    id: 'cool-grey-warm-brown',
    title: 'Kühles Grau + warmes Braun',
    grey: s('#50545D', 'Kühles Grau'),
    brown: s('#89613F', 'Warmes Braun'),
    explanation:
      'Beide Farben sind ähnlich hell und eher gedeckt – es gibt also kaum Helligkeitskontrast. Gleichzeitig zieht das Grau ins Bläuliche, das Braun ins Orange. Dieser Temperaturkonflikt ohne klare Trennung wirkt schnell „schmutzig“ oder unentschieden.',
  },
  {
    id: 'warm-grey-warm-brown',
    title: 'Warmes Grau + warmes Braun',
    grey: s('#77736B', 'Warmes Grau'),
    brown: s('#89613F', 'Warmes Braun'),
    explanation:
      'Das Grau hat einen leichten Gelb-/Beigeanteil und teilt damit die Temperatur des Brauns. Die Farben wirken verwandt (fast Ton-in-Ton). Das ist ruhiger und harmonischer als mit kühlem Grau.',
  },
  {
    id: 'anthracite-dark-brown',
    title: 'Anthrazit + Dunkelbraun',
    grey: s('#292A2C', 'Anthrazit'),
    brown: s('#4F382E', 'Dunkelbraun'),
    explanation:
      'Beide Farben sind sehr dunkel. Der Helligkeitsunterschied ist gering, daher verschwimmen sie aus der Entfernung. Das kann edel und tief wirken, aber auch schwer. Ein heller Akzent (z. B. Cremeweiß) bringt Struktur.',
  },
  {
    id: 'anthracite-camel',
    title: 'Anthrazit + Camel',
    grey: s('#292A2C', 'Anthrazit'),
    brown: s('#B18A5E', 'Camel'),
    explanation:
      'Hier ist der Helligkeitskontrast groß. Das fast neutrale Anthrazit wirkt wie ein dunkler Rahmen, Camel leuchtet warm davor. Der Temperaturunterschied fällt kaum ins Gewicht – die Kombination wirkt klar und modern.',
  },
];
