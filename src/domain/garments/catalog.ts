/**
 * Kleidungskatalog: Kategorien, Unterkategorien, Outfit-Slots und Silhouetten.
 *
 * Jede Unterkategorie verweist auf eine Silhouette (`illustrations/garments`)
 * und einen Slot im Outfit-Studio. Eigene Kategorien/Unterkategorien eines
 * Profils werden über `buildCatalog()` ergänzt.
 */
import type {
  CustomCategory,
  CustomSubcategory,
  GarmentAttributeDefinition,
  GarmentCategory,
  GarmentSubcategory,
  OutfitSlot,
  PatternType,
} from '../types';

const HOOD = (def: 'yes' | 'no'): GarmentAttributeDefinition => ({
  key: 'hood',
  label: 'Kapuze',
  defaultValue: def,
  options: [
    { value: 'yes', label: 'Mit Kapuze' },
    { value: 'no', label: 'Ohne Kapuze' },
  ],
});
const LENGTH = (def: 'short' | 'regular' | 'long'): GarmentAttributeDefinition => ({
  key: 'length',
  label: 'Länge',
  defaultValue: def,
  options: [
    { value: 'short', label: 'Kurz (Hüfte)' },
    { value: 'regular', label: 'Mittel (Oberschenkel)' },
    { value: 'long', label: 'Lang (Knie)' },
  ],
});
const CLOSURE = (def: 'zip' | 'buttons'): GarmentAttributeDefinition => ({
  key: 'closure',
  label: 'Verschluss',
  defaultValue: def,
  options: [
    { value: 'zip', label: 'Reißverschluss' },
    { value: 'buttons', label: 'Knöpfe / Druckknöpfe' },
  ],
});
const SLEEVE = (def: 'short' | 'long'): GarmentAttributeDefinition => ({
  key: 'sleeve',
  label: 'Ärmel',
  defaultValue: def,
  options: [
    { value: 'short', label: 'Kurzarm' },
    { value: 'long', label: 'Langarm' },
  ],
});

type SubDef = Omit<GarmentSubcategory, 'categoryId'>;
const sub = (id: string, label: string, slot: OutfitSlot, silhouette: string, extra: Partial<SubDef> = {}): SubDef => ({
  id,
  label,
  slot,
  silhouette,
  ...extra,
});

const RAW: { id: string; label: string; description: string; subs: SubDef[] }[] = [
  {
    id: 'tops',
    label: 'Oberteile',
    description: 'T-Shirts, Hemden, Polos und Blusen',
    subs: [
      sub('tshirt', 'T-Shirt', 'base', 'tee'),
      sub('oversized-tee', 'Oversized T-Shirt', 'base', 'tee-oversized'),
      sub('longsleeve', 'Longsleeve', 'base', 'longsleeve'),
      sub('polo', 'Poloshirt', 'base', 'polo'),
      sub('shirt', 'Hemd', 'shirt', 'shirt', { attributes: [SLEEVE('long')] }),
      sub('flannel', 'Flanellhemd', 'shirt', 'shirt-flannel', { defaultPattern: 'check' }),
      sub('overshirt', 'Overshirt', 'overshirt', 'overshirt'),
      sub('tanktop', 'Tanktop', 'base', 'tank'),
      sub('blouse', 'Bluse', 'shirt', 'blouse', { attributes: [SLEEVE('long')] }),
    ],
  },
  {
    id: 'knitwear',
    label: 'Strick & Sweat',
    description: 'Pullover, Hoodies, Cardigans',
    subs: [
      sub('pullover', 'Pullover', 'knit', 'sweater'),
      sub('turtleneck', 'Rollkragenpullover', 'knit', 'turtleneck'),
      sub('cardigan', 'Cardigan', 'knit', 'cardigan'),
      sub('sweatshirt', 'Sweatshirt', 'knit', 'sweatshirt'),
      sub('hoodie', 'Hoodie', 'knit', 'hoodie'),
      sub('zip-hoodie', 'Zip-Hoodie', 'knit', 'zip-hoodie'),
      sub('knit-jacket', 'Strickjacke', 'knit', 'knit-jacket', { attributes: [CLOSURE('zip')] }),
    ],
  },
  {
    id: 'outerwear',
    label: 'Jacken & Mäntel',
    description: 'Von Lederjacke bis Wollmantel',
    subs: [
      sub('leather-jacket', 'Lederjacke', 'outer', 'leather-jacket'),
      sub('bomber', 'Bomberjacke', 'outer', 'bomber'),
      sub('parka', 'Parka', 'outer', 'parka', { attributes: [HOOD('yes'), LENGTH('regular'), CLOSURE('zip')] }),
      sub('hooded-jacket', 'Kapuzenjacke', 'outer', 'hooded-jacket'),
      sub('denim-jacket', 'Jeansjacke', 'outer', 'denim-jacket'),
      sub('harrington', 'Harrington-Jacke', 'outer', 'harrington'),
      sub('quilted-jacket', 'Steppjacke', 'outer', 'quilted-jacket'),
      sub('down-jacket', 'Daunenjacke', 'outer', 'down-jacket', { attributes: [HOOD('no'), LENGTH('short')] }),
      sub('fleece-jacket', 'Fleecejacke', 'outer', 'fleece-jacket'),
      sub('softshell', 'Softshelljacke', 'outer', 'softshell', { attributes: [HOOD('no')] }),
      sub('rain-jacket', 'Regenjacke', 'outer', 'rain-jacket', { attributes: [HOOD('yes'), LENGTH('regular')] }),
      sub('windbreaker', 'Windbreaker', 'outer', 'windbreaker'),
      sub('trenchcoat', 'Trenchcoat', 'outer', 'trenchcoat', { attributes: [LENGTH('long')] }),
      sub('wool-coat', 'Wollmantel', 'outer', 'wool-coat', { attributes: [LENGTH('long')] }),
      sub('transition-jacket', 'Übergangsjacke', 'outer', 'transition-jacket', { attributes: [HOOD('no'), CLOSURE('zip')] }),
      sub('winter-coat', 'Wintermantel', 'outer', 'winter-coat', { attributes: [HOOD('no'), LENGTH('long')] }),
      sub('blazer', 'Blazer', 'outer', 'blazer'),
      sub('sport-coat', 'Sakko', 'outer', 'sport-coat'),
      sub('vest', 'Weste', 'outer', 'vest'),
    ],
  },
  {
    id: 'bottoms',
    label: 'Hosen & Röcke',
    description: 'Jeans, Chinos, Shorts und Röcke',
    subs: [
      sub('jeans', 'Jeans', 'bottom', 'jeans'),
      sub('chino', 'Chino', 'bottom', 'chino'),
      sub('trousers', 'Stoffhose', 'bottom', 'trousers'),
      sub('cargo', 'Cargohose', 'bottom', 'cargo'),
      sub('corduroy', 'Cordhose', 'bottom', 'corduroy'),
      sub('joggers', 'Jogginghose', 'bottom', 'joggers'),
      sub('shorts', 'Shorts', 'bottom', 'shorts'),
      sub('skirt', 'Rock', 'bottom', 'skirt'),
    ],
  },
  {
    id: 'onepiece',
    label: 'Kleider, Anzüge & Overalls',
    description: 'Einteilige oder zusammengehörige Outfits',
    subs: [
      sub('dress', 'Kleid', 'onepiece', 'dress'),
      sub('suit', 'Anzug', 'outer', 'suit'),
      sub('overall', 'Overall', 'onepiece', 'overall'),
    ],
  },
  {
    id: 'shoes',
    label: 'Schuhe',
    description: 'Sneaker, Boots, Lederschuhe …',
    subs: [
      sub('sneaker', 'Sneaker', 'shoes', 'sneaker'),
      sub('boots', 'Boots', 'shoes', 'boots'),
      sub('chelsea', 'Chelsea Boots', 'shoes', 'chelsea'),
      sub('leather-shoes', 'Lederschuhe', 'shoes', 'derby'),
      sub('loafer', 'Loafer', 'shoes', 'loafer'),
      sub('sandals', 'Sandalen', 'shoes', 'sandals'),
      sub('other-shoes', 'Weitere Schuhe', 'shoes', 'shoe-generic'),
    ],
  },
  {
    id: 'accessories',
    label: 'Accessoires',
    description: 'Schals, Mützen, Taschen, Schmuck',
    subs: [
      sub('scarf', 'Schal', 'scarf', 'scarf'),
      sub('neckerchief', 'Halstuch', 'scarf', 'neckerchief'),
      sub('beanie', 'Mütze', 'headwear', 'beanie'),
      sub('cap', 'Cap', 'headwear', 'cap'),
      sub('belt', 'Gürtel', 'accessory', 'belt'),
      sub('bag', 'Tasche', 'accessory', 'bag'),
      sub('jewelry', 'Schmuck', 'accessory', 'jewelry'),
      sub('watch', 'Uhr', 'accessory', 'watch'),
      sub('glasses', 'Brille', 'accessory', 'glasses'),
      sub('gloves', 'Handschuhe', 'accessory', 'gloves'),
    ],
  },
];

export const BASE_CATEGORIES: GarmentCategory[] = RAW.map((c) => ({
  id: c.id,
  label: c.label,
  description: c.description,
  subcategories: c.subs.map((s) => ({ ...s, categoryId: c.id })),
}));

/** Silhouette je Slot für eigene Kategorien ohne eigene Unterkategorien. */
export const DEFAULT_SILHOUETTE_FOR_SLOT: Record<OutfitSlot, string> = {
  base: 'tee',
  shirt: 'shirt',
  knit: 'sweater',
  overshirt: 'overshirt',
  outer: 'transition-jacket',
  onepiece: 'dress',
  bottom: 'trousers',
  shoes: 'shoe-generic',
  scarf: 'scarf',
  headwear: 'beanie',
  accessory: 'bag',
};

export interface Catalog {
  categories: GarmentCategory[];
  subcategories: Map<string, GarmentSubcategory>;
}

/** Baut den Katalog inkl. eigener Kategorien und Unterkategorien eines Profils. */
export function buildCatalog(customCategories: CustomCategory[] = [], customSubs: CustomSubcategory[] = []): Catalog {
  const categories: GarmentCategory[] = BASE_CATEGORIES.map((c) => ({ ...c, subcategories: [...c.subcategories] }));
  for (const cc of customCategories) {
    categories.push({
      id: cc.id,
      label: cc.label,
      description: 'Eigene Kategorie',
      subcategories: [
        {
          id: `${cc.id}:default`,
          label: cc.label,
          categoryId: cc.id,
          slot: cc.slot,
          silhouette: DEFAULT_SILHOUETTE_FOR_SLOT[cc.slot],
          custom: true,
        },
      ],
    });
  }
  const allSubs = new Map<string, GarmentSubcategory>();
  for (const c of categories) for (const s of c.subcategories) allSubs.set(s.id, s);
  for (const cs of customSubs) {
    const cat = categories.find((c) => c.id === cs.categoryId);
    const template = [...allSubs.values()].find((s) => s.silhouette === cs.silhouette);
    if (!cat) continue;
    const entry: GarmentSubcategory = {
      id: cs.id,
      label: cs.label,
      categoryId: cat.id,
      slot: template?.slot ?? cat.subcategories[0]?.slot ?? 'base',
      silhouette: cs.silhouette,
      attributes: template?.attributes,
      custom: true,
    };
    cat.subcategories.push(entry);
    allSubs.set(entry.id, entry);
  }
  return { categories, subcategories: allSubs };
}

export const DEFAULT_CATALOG = buildCatalog();

export function getSubcategory(id: string, catalog: Catalog = DEFAULT_CATALOG): GarmentSubcategory | undefined {
  return catalog.subcategories.get(id);
}

export function subcategoryLabel(id: string, catalog: Catalog = DEFAULT_CATALOG): string {
  return catalog.subcategories.get(id)?.label ?? id;
}

export function silhouetteOf(id: string, catalog: Catalog = DEFAULT_CATALOG): string {
  return catalog.subcategories.get(id)?.silhouette ?? 'tee';
}

export function slotOf(id: string, catalog: Catalog = DEFAULT_CATALOG): OutfitSlot {
  return catalog.subcategories.get(id)?.slot ?? 'base';
}

export function defaultAttributes(id: string, catalog: Catalog = DEFAULT_CATALOG): Record<string, string> {
  const s = catalog.subcategories.get(id);
  const out: Record<string, string> = {};
  for (const a of s?.attributes ?? []) out[a.key] = a.defaultValue;
  return out;
}

export function defaultPattern(id: string, catalog: Catalog = DEFAULT_CATALOG): PatternType {
  return catalog.subcategories.get(id)?.defaultPattern ?? 'solid';
}

/** Zeichenreihenfolge im Outfit-Studio (von hinten nach vorne). */
export const SLOT_ORDER: OutfitSlot[] = [
  'shoes',
  'bottom',
  'onepiece',
  'base',
  'shirt',
  'knit',
  'overshirt',
  'outer',
  'scarf',
  'headwear',
  'accessory',
];

/** Reihenfolge in der Bedienoberfläche (von oben nach unten am Körper). */
export const SLOT_UI_ORDER: OutfitSlot[] = [
  'headwear',
  'scarf',
  'outer',
  'overshirt',
  'knit',
  'shirt',
  'base',
  'onepiece',
  'bottom',
  'shoes',
  'accessory',
];

export const SLOT_LABEL: Record<OutfitSlot, string> = {
  base: 'T-Shirt / Basis',
  shirt: 'Hemd / Bluse',
  knit: 'Pullover / Strick',
  overshirt: 'Overshirt',
  outer: 'Jacke / Mantel',
  onepiece: 'Kleid / Overall',
  bottom: 'Hose / Unterteil',
  shoes: 'Schuhe',
  scarf: 'Schal / Tuch',
  headwear: 'Kopfbedeckung',
  accessory: 'Accessoire',
};

/** Gesichtsnahe Slots: Hier wirkt die Farbe direkt auf den Teint. */
export const FACE_NEAR_SLOTS: OutfitSlot[] = ['base', 'shirt', 'knit', 'overshirt', 'outer', 'onepiece', 'scarf', 'headwear'];

/** Typische Unterkategorie je Slot für freie Farbexperimente. */
export const DEFAULT_SUB_FOR_SLOT: Record<OutfitSlot, string> = {
  base: 'tshirt',
  shirt: 'shirt',
  knit: 'pullover',
  overshirt: 'overshirt',
  outer: 'transition-jacket',
  onepiece: 'dress',
  bottom: 'chino',
  shoes: 'sneaker',
  scarf: 'scarf',
  headwear: 'beanie',
  accessory: 'belt',
};

export function subcategoriesForSlot(slot: OutfitSlot, catalog: Catalog = DEFAULT_CATALOG): GarmentSubcategory[] {
  return [...catalog.subcategories.values()].filter((s) => s.slot === slot);
}
