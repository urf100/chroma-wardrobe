/**
 * Kombinationsvorschläge auf Ebene von Kleidungsstücken.
 *
 * - `matchGarments`: Welche meiner Teile passen zu diesem Teil?
 * - `suggestOutfits`: Vollständige Outfit-Vorschläge rund um ein Ankerteil.
 */
import type {
  FeedbackVerdict,
  Garment,
  HexColor,
  OutfitRecommendation,
  OutfitSlot,
  RecommendationReason,
} from '../types';
import { FACE_NEAR_SLOTS, slotOf, type Catalog, DEFAULT_CATALOG } from '../garments/catalog';
import { levelFromPoints, pairColors, pairKey, type PairContext, type PairEvaluation } from './pairing';

export type GarmentRole = 'top' | 'outer' | 'bottom' | 'shoes' | 'scarf' | 'other';

export function roleOfSlot(slot: OutfitSlot): GarmentRole {
  switch (slot) {
    case 'base':
    case 'shirt':
    case 'knit':
    case 'overshirt':
    case 'onepiece':
      return 'top';
    case 'outer':
      return 'outer';
    case 'bottom':
      return 'bottom';
    case 'shoes':
      return 'shoes';
    case 'scarf':
      return 'scarf';
    default:
      return 'other';
  }
}

export const ROLE_LABEL: Record<GarmentRole, string> = {
  top: 'Oberteile',
  outer: 'Jacken & Mäntel',
  bottom: 'Hosen & Röcke',
  shoes: 'Schuhe',
  scarf: 'Schals & Tücher',
  other: 'Accessoires',
};

const mainHex = (g: Garment): HexColor => g.colors[0]?.hex ?? '#808080';

export interface GarmentMatchContext extends Omit<PairContext, 'feedback' | 'checkSeasonFor'> {
  feedback?: Map<string, FeedbackVerdict>;
  catalog?: Catalog;
}

/** Bewertet zwei Kleidungsstücke inkl. Sekundärfarben, Saisoneignung und Feedback. */
export function evaluateGarmentPair(a: Garment, b: Garment, ctx: GarmentMatchContext = {}): PairEvaluation {
  const catalog = ctx.catalog ?? DEFAULT_CATALOG;
  const checkSeasonFor: ('a' | 'b')[] = [];
  if (FACE_NEAR_SLOTS.includes(slotOf(a.subcategory, catalog))) checkSeasonFor.push('a');
  if (FACE_NEAR_SLOTS.includes(slotOf(b.subcategory, catalog))) checkSeasonFor.push('b');
  const base = pairColors(mainHex(a), mainHex(b), { ...ctx, checkSeasonFor });
  let points = base.points;
  const reasons = [...base.reasons];

  // Sekundärfarben mit geringerem Gewicht berücksichtigen
  const secA = a.colors.slice(1).filter((c) => c.share >= 0.2);
  const secB = b.colors.slice(1).filter((c) => c.share >= 0.2);
  for (const ca of [a.colors[0], ...secA]) {
    for (const cb of [b.colors[0], ...secB]) {
      if (ca === a.colors[0] && cb === b.colors[0]) continue;
      if (!ca || !cb) continue;
      points += pairColors(ca.hex, cb.hex).points * 0.25 * Math.min(ca.share, cb.share) * 2;
    }
  }

  const verdict = ctx.feedback?.get(pairKey(a.id, b.id));
  if (verdict === 'helpful') {
    points += 2;
    reasons.push({ kind: 'feedback', effect: 'positive', text: 'Du hast diese Kombination als hilfreich markiert.' });
  } else if (verdict === 'unfitting') {
    points -= 4;
    reasons.push({ kind: 'feedback', effect: 'negative', text: 'Du hast diese Kombination als unpassend markiert.' });
  }
  return { points, level: levelFromPoints(points), reasons };
}

export interface GarmentMatch {
  garment: Garment;
  evaluation: PairEvaluation;
}

/** Teile, die zu `anchor` passen – gruppiert nach Rolle, beste zuerst. */
export function matchGarments(
  anchor: Garment,
  candidates: Garment[],
  ctx: GarmentMatchContext = {},
): Record<GarmentRole, GarmentMatch[]> {
  const catalog = ctx.catalog ?? DEFAULT_CATALOG;
  const anchorSlot = slotOf(anchor.subcategory, catalog);
  const anchorRole = roleOfSlot(anchorSlot);
  const out: Record<GarmentRole, GarmentMatch[]> = { top: [], outer: [], bottom: [], shoes: [], scarf: [], other: [] };
  for (const g of candidates) {
    if (g.id === anchor.id) continue;
    if (g.ownership === 'archived' || g.ownership === 'sold') continue;
    const slot = slotOf(g.subcategory, catalog);
    const role = roleOfSlot(slot);
    // Gleicher Slot ist nie gleichzeitig tragbar (zwei T-Shirts). Gleiche Rolle nur
    // bei Oberteilen verschiedener Schichten (z. B. T-Shirt unter Overshirt).
    if (slot === anchorSlot) continue;
    if (role === anchorRole && role !== 'top') continue;
    if (role === 'top' && (slot === 'onepiece' || anchorSlot === 'onepiece')) continue;
    out[role].push({ garment: g, evaluation: evaluateGarmentPair(anchor, g, ctx) });
  }
  for (const k of Object.keys(out) as GarmentRole[]) out[k].sort((x, y) => y.evaluation.points - x.evaluation.points);
  return out;
}

export interface SuggestOptions extends GarmentMatchContext {
  includePlanned?: boolean;
  limit?: number;
  perRole?: number;
}

/**
 * Erzeugt vollständige Outfit-Vorschläge (Oberteil + Unterteil, optional Jacke,
 * Schuhe, Schal) aus dem vorhandenen Bestand. Bewertet wird jedes Paar im Outfit.
 */
export function suggestOutfits(anchor: Garment, wardrobe: Garment[], opts: SuggestOptions = {}): OutfitRecommendation[] {
  const catalog = opts.catalog ?? DEFAULT_CATALOG;
  const limit = opts.limit ?? 5;
  const perRole = opts.perRole ?? 4;
  const usable = wardrobe.filter(
    (g) => g.id !== anchor.id && (g.ownership === 'owned' || (opts.includePlanned && (g.ownership === 'planned' || g.ownership === 'wishlist'))),
  );
  const anchorSlot = slotOf(anchor.subcategory, catalog);
  const anchorRole = roleOfSlot(anchorSlot);
  const matches = matchGarments(anchor, usable, opts);

  const pick = (role: GarmentRole) => matches[role].slice(0, perRole).map((m) => m.garment);
  const options: Record<'top' | 'bottom' | 'outer' | 'shoes' | 'scarf', (Garment | null)[]> = {
    top: anchorRole === 'top' ? [anchor] : pick('top'),
    bottom: anchorRole === 'bottom' ? [anchor] : pick('bottom'),
    outer: anchorRole === 'outer' ? [anchor] : [null, ...pick('outer')],
    shoes: anchorRole === 'shoes' ? [anchor] : [null, ...pick('shoes').slice(0, 2)],
    scarf: anchorRole === 'scarf' ? [anchor] : [null, ...pick('scarf').slice(0, 2)],
  };
  if (anchorSlot === 'onepiece') options.bottom = [null];
  if (options.top.length === 0) options.top = [null];
  if (options.bottom.length === 0) options.bottom = [null];

  const results: OutfitRecommendation[] = [];
  const pairCache = new Map<string, PairEvaluation>();
  const evalPair = (x: Garment, y: Garment) => {
    const k = pairKey(x.id, y.id);
    let v = pairCache.get(k);
    if (!v) {
      v = evaluateGarmentPair(x, y, opts);
      pairCache.set(k, v);
    }
    return v;
  };

  for (const top of options.top)
    for (const bottom of options.bottom)
      for (const outer of options.outer)
        for (const shoes of options.shoes)
          for (const scarf of options.scarf) {
            const items = [top, bottom, outer, shoes, scarf].filter((g): g is Garment => !!g);
            if (!items.includes(anchor)) continue;
            if (items.length < 2) continue;
            let points = 0;
            const reasons: RecommendationReason[] = [];
            let negative = false;
            for (let i = 0; i < items.length; i++)
              for (let j = i + 1; j < items.length; j++) {
                const e = evalPair(items[i], items[j]);
                // Schuhe und Schal sind kleiner und zählen weniger
                const small = [shoes, scarf].includes(items[i]) || [shoes, scarf].includes(items[j]);
                points += e.points * (small ? 0.5 : 1);
                if (e.level === 'careful') negative = true;
                for (const r of e.reasons) if (!reasons.some((x) => x.text === r.text)) reasons.push(r);
              }
            const pairs = (items.length * (items.length - 1)) / 2;
            const avg = points / pairs;
            // Vollständigkeit leicht belohnen, damit nicht nur Zweierkombinationen erscheinen
            const rank = avg + items.length * 0.15 - (negative ? 1 : 0);
            const slots: Partial<Record<OutfitSlot, string>> = {};
            for (const g of items) slots[slotOf(g.subcategory, catalog)] = g.id;
            results.push({
              id: items.map((g) => g.id).sort().join('+'),
              slots,
              level: levelFromPoints(avg + 0.5),
              rank,
              reasons: [
                ...reasons.filter((r) => r.effect === 'negative'),
                ...reasons.filter((r) => r.effect === 'positive').slice(0, 4),
              ],
              palette: items.map((g) => g.colors[0]?.hex ?? '#808080'),
              containsPlanned: items.some((g) => g.ownership !== 'owned'),
            });
          }

  results.sort((x, y) => y.rank - x.rank);
  // Vielfalt: dasselbe Unterteil nicht mehr als zweimal
  const out: OutfitRecommendation[] = [];
  const usedCount = new Map<string, number>();
  for (const r of results) {
    const keyItem = r.slots.bottom ?? r.slots.base ?? '';
    const n = usedCount.get(keyItem) ?? 0;
    if (n >= 2) continue;
    usedCount.set(keyItem, n + 1);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}
