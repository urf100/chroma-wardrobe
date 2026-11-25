/**
 * Mehrdimensionale, erklärende Outfit-Analyse für das Outfit-Studio.
 *
 * Bewusst KEINE Gesamtnote: Jede Dimension wird einzeln beschrieben.
 */
import type { ColorSeason, ContrastLevel, HexColor, OutfitDisplayOptions, OutfitSlot, OutfitSlotValue } from '../types';
import { colorProfile, hueDistance, type ColorProfile } from '../color/analysis';
import { deltaE2000 } from '../color/distance';
import { nameColor } from '../color/naming';
import { FACE_NEAR_SLOTS, SLOT_LABEL } from '../garments/catalog';
import { HARMONY_LABEL, type HarmonyKind } from '../examples/curated';
import { SEASON_FIT_LABEL, seasonFit } from '../seasons/fit';

export interface OutfitColorShare {
  hex: HexColor;
  name: string;
  share: number;
  slots: OutfitSlot[];
}

export interface AnalysisDimension {
  id: 'harmony' | 'lightness' | 'temperature' | 'saturation' | 'season' | 'proportion';
  label: string;
  value: string;
  text: string;
  tone: 'positive' | 'neutral' | 'attention';
}

export interface OutfitAnalysis {
  palette: OutfitColorShare[];
  harmony: HarmonyKind | 'free';
  dimensions: AnalysisDimension[];
}

/** Ungefähre sichtbare Fläche je Slot in einem typischen Outfit. */
const SLOT_AREA: Record<OutfitSlot, number> = {
  outer: 0.34,
  knit: 0.28,
  overshirt: 0.28,
  shirt: 0.26,
  base: 0.26,
  onepiece: 0.55,
  bottom: 0.3,
  shoes: 0.05,
  scarf: 0.06,
  headwear: 0.03,
  accessory: 0.02,
};

const TOP_LAYERS: OutfitSlot[] = ['base', 'shirt', 'knit', 'overshirt', 'outer'];

/** Berechnet sichtbare Flächenanteile je Farbe unter Berücksichtigung der Schichten. */
export function visibleShares(
  slots: Partial<Record<OutfitSlot, OutfitSlotValue>>,
  options: Pick<OutfitDisplayOptions, 'jacketOpen'>,
): { slot: OutfitSlot; hex: HexColor; share: number }[] {
  const active = (Object.entries(slots) as [OutfitSlot, OutfitSlotValue][]).filter(([, v]) => v && !v.hidden && v.colors.length);
  const activeSlots = new Set(active.map(([s]) => s));
  const raw: { slot: OutfitSlot; hex: HexColor; area: number }[] = [];
  // oberste Schicht des Oberkörpers ermitteln
  const topOrder = [...TOP_LAYERS].reverse().filter((s) => activeSlots.has(s));
  for (const [slot, v] of active) {
    let area = SLOT_AREA[slot];
    if (TOP_LAYERS.includes(slot)) {
      const idx = topOrder.indexOf(slot);
      if (idx === 1) area *= options.jacketOpen || topOrder[0] !== 'outer' ? 0.4 : 0.12;
      else if (idx >= 2) area *= 0.08;
    }
    if (slot === 'bottom' && activeSlots.has('onepiece')) area = 0;
    if (activeSlots.has('outer') && slot === 'bottom' && slots.outer?.attributes?.length === 'long') area *= 0.6;
    for (const c of v.colors) raw.push({ slot, hex: c.hex, area: area * (c.share || 0) });
  }
  const total = raw.reduce((s, r) => s + r.area, 0) || 1;
  return raw.filter((r) => r.area > 0).map((r) => ({ slot: r.slot, hex: r.hex, share: r.area / total }));
}

function mergePalette(entries: { slot: OutfitSlot; hex: HexColor; share: number }[]): OutfitColorShare[] {
  const out: OutfitColorShare[] = [];
  for (const e of entries) {
    const existing = out.find((o) => deltaE2000(o.hex, e.hex) < 4);
    if (existing) {
      existing.share += e.share;
      if (!existing.slots.includes(e.slot)) existing.slots.push(e.slot);
    } else out.push({ hex: e.hex, name: nameColor(e.hex).name, share: e.share, slots: [e.slot] });
  }
  return out.sort((a, b) => b.share - a.share);
}

export function detectHarmony(palette: OutfitColorShare[]): HarmonyKind | 'free' {
  const profiles = palette.map((p) => ({ ...colorProfile(p.hex), share: p.share }));
  const chromatic = profiles.filter((p) => p.neutrality === 'color' && p.share >= 0.04);
  const Ls = profiles.map((p) => p.L);
  const lSpread = Math.max(...Ls) - Math.min(...Ls);
  if (profiles.length === 0) return 'free';
  if (chromatic.length === 0) {
    const warmNeutrals = profiles.filter((p) => p.neutrality === 'warm-neutral');
    if (warmNeutrals.length >= 2 && warmNeutrals.length === profiles.length && lSpread > 0.15) return 'tone-in-tone';
    return lSpread > 0.4 ? 'lightness-contrast' : 'neutral';
  }
  if (chromatic.length === 1) {
    const c = chromatic[0];
    const sameHueNeutrals = profiles.filter((p) => p !== c && p.C > 0.02 && hueDistance(p.h, c.h) < 25);
    if (sameHueNeutrals.length === profiles.length - 1 && profiles.length > 1) return lSpread > 0.15 ? 'tone-in-tone' : 'monochrome';
    return profiles.length > 1 ? 'neutral-accent' : 'monochrome';
  }
  const hues = chromatic.map((c) => c.h);
  const maxDist = Math.max(...hues.flatMap((h1) => hues.map((h2) => hueDistance(h1, h2))));
  if (maxDist < 25) return lSpread > 0.15 ? 'tone-in-tone' : 'monochrome';
  if (maxDist < 75) return 'analogous';
  if (chromatic.length === 2) {
    if (maxDist >= 150) return 'complementary';
    const [a, b] = chromatic;
    if (Math.abs(a.C - b.C) > 0.08) return 'saturation-contrast';
    if (Math.sign(a.temperatureScore) !== Math.sign(b.temperatureScore)) return 'warm-cool';
    return 'free';
  }
  if (chromatic.length === 3) {
    const [a, b, c] = hues;
    const ds = [hueDistance(a, b), hueDistance(b, c), hueDistance(a, c)].sort((x, y) => x - y);
    if (ds.every((d) => d > 90 && d < 150)) return 'triadic';
    if (ds[0] < 60 && ds[1] > 140) return 'split-complementary';
  }
  if (chromatic.length >= 4) return 'tetradic';
  return 'free';
}

const HARMONY_TEXT: Record<HarmonyKind | 'free', string> = {
  monochrome: 'Alle Farben gehören zu einer Farbfamilie – ruhig und geschlossen.',
  'tone-in-tone': 'Ein Farbton in mehreren Helligkeitsstufen. Wirkt durchdacht und unkompliziert.',
  analogous: 'Die Farben liegen im Farbkreis nebeneinander und wirken verwandt.',
  complementary: 'Zwei Farben aus gegenüberliegenden Bereichen des Farbkreises erzeugen Spannung.',
  'split-complementary': 'Eine Farbe plus zwei Nachbarn ihrer Gegenfarbe – lebendig, aber ausgewogener als reiner Komplementärkontrast.',
  triadic: 'Drei gleichmäßig verteilte Farbtöne. Sehr lebendig – Proportionen sind hier wichtig.',
  tetradic: 'Vier oder mehr verschiedene Farbtöne. Wirkt bunt; eine dominierende Farbe hilft.',
  'neutral-accent': 'Eine ruhige neutrale Basis mit einer einzelnen Akzentfarbe. Ein sehr verlässliches Prinzip.',
  'lightness-contrast': 'Die Wirkung entsteht vor allem durch den Hell-Dunkel-Kontrast.',
  'saturation-contrast': 'Eine kräftigere und eine gedämpfte Farbe – die kräftige wird zum Blickfang.',
  'warm-cool': 'Eine warme und eine kühle Farbe ergänzen sich.',
  neutral: 'Eine rein neutrale Kombination – zurückhaltend und vielseitig.',
  free: 'Keine klassische Harmonieregel erkennbar. Das ist kein Fehler – persönlicher Geschmack zählt.',
};

export interface AnalyzeContext {
  season?: ColorSeason;
  personalContrast?: ContrastLevel;
}

export function analyzeOutfit(
  slots: Partial<Record<OutfitSlot, OutfitSlotValue>>,
  options: Pick<OutfitDisplayOptions, 'jacketOpen'>,
  ctx: AnalyzeContext = {},
): OutfitAnalysis {
  const shares = visibleShares(slots, options);
  const palette = mergePalette(shares);
  const dims: AnalysisDimension[] = [];
  if (palette.length === 0) return { palette, harmony: 'free', dimensions: dims };

  const profiles: (ColorProfile & { share: number })[] = palette.map((p) => ({ ...colorProfile(p.hex), share: p.share }));
  const harmony = detectHarmony(palette);
  dims.push({
    id: 'harmony',
    label: 'Farbharmonie',
    value: harmony === 'free' ? 'Freie Kombination' : HARMONY_LABEL[harmony],
    text: HARMONY_TEXT[harmony],
    tone: harmony === 'free' || harmony === 'tetradic' ? 'neutral' : 'positive',
  });

  // Helligkeitskontrast
  const Ls = profiles.filter((p) => p.share > 0.05).map((p) => p.L);
  const spread = Ls.length ? Math.max(...Ls) - Math.min(...Ls) : 0;
  const contrastLevel = spread > 0.42 ? 'high' : spread > 0.2 ? 'medium' : 'low';
  const contrastWord = { high: 'Hoch', medium: 'Mittel', low: 'Gering' }[contrastLevel];
  let contrastText =
    contrastLevel === 'high'
      ? 'Helle und dunkle Teile setzen sich deutlich voneinander ab – klar und markant.'
      : contrastLevel === 'medium'
        ? 'Ein ausgewogener Hell-Dunkel-Unterschied – die Teile sind gut unterscheidbar.'
        : 'Alle Teile liegen in einer ähnlichen Helligkeit – weich und ruhig, kann aber verschwimmen.';
  let contrastTone: AnalysisDimension['tone'] = 'neutral';
  if (ctx.personalContrast && ctx.personalContrast !== 'unknown') {
    if (ctx.personalContrast === contrastLevel) {
      contrastText += ' Das entspricht deinem persönlichen Kontrastniveau.';
      contrastTone = 'positive';
    } else {
      contrastText += ` Dein persönlicher Kontrast ist eher ${{ low: 'gering', medium: 'mittel', high: 'hoch' }[ctx.personalContrast]} – ein Outfit mit ähnlichem Kontrast wirkt meist besonders stimmig.`;
      contrastTone = 'attention';
    }
  }
  dims.push({ id: 'lightness', label: 'Helligkeitskontrast', value: contrastWord, text: contrastText, tone: contrastTone });

  // Temperatur
  const relevant = profiles.filter((p) => p.share > 0.04);
  const warm = relevant.filter((p) => p.temperatureScore > 0.15);
  const cool = relevant.filter((p) => p.temperatureScore < -0.12);
  let tempValue = 'Ausgewogen';
  let tempText = 'Die Farben sind überwiegend neutral in ihrer Temperatur.';
  let tempTone: AnalysisDimension['tone'] = 'neutral';
  if (warm.length && !cool.length) {
    tempValue = 'Warm';
    tempText = 'Alle Farben haben eine warme Tendenz – das wirkt einheitlich und zusammenhängend.';
    tempTone = 'positive';
  } else if (cool.length && !warm.length) {
    tempValue = 'Kühl';
    tempText = 'Alle Farben haben eine kühle Tendenz – das wirkt einheitlich und klar.';
    tempTone = 'positive';
  } else if (warm.length && cool.length) {
    tempValue = 'Warm-Kalt-Mischung';
    const conflict = warm.some((w) => cool.some((c) => Math.abs(w.L - c.L) < 0.12 && w.C < 0.12 && c.C < 0.06));
    tempText = conflict
      ? 'Warme und kühle Farben mit ähnlicher Helligkeit treffen aufeinander (z. B. kühles Grau und warmes Braun). Mehr Helligkeitskontrast oder ein verbindender Ton macht es ruhiger.'
      : 'Warme und kühle Farben ergänzen sich – durch die unterschiedliche Helligkeit bleibt es klar.';
    tempTone = conflict ? 'attention' : 'neutral';
  }
  dims.push({ id: 'temperature', label: 'Farbtemperatur', value: tempValue, text: tempText, tone: tempTone });

  // Sättigung
  const vivid = relevant.filter((p) => p.C > 0.15);
  const muted = relevant.filter((p) => p.C <= 0.08);
  let satValue = 'Gemischt';
  let satText = 'Kräftige und ruhige Farben sind gemischt.';
  if (vivid.length === 0) {
    satValue = 'Gedeckt';
    satText = 'Alle Farben sind gedeckt bis mittel gesättigt – ruhig, natürlich und erwachsen.';
  } else if (vivid.length >= 2) {
    satValue = 'Kräftig';
    satText = 'Mehrere leuchtende Farben – auffällig. Eine davon als Hauptfarbe wählen hilft.';
  } else if (muted.length) {
    satValue = 'Ein kräftiger Akzent';
    satText = 'Eine kräftige Farbe vor ruhigem Hintergrund – sie wird zum Blickfang.';
  }
  dims.push({ id: 'saturation', label: 'Sättigung', value: satValue, text: satText, tone: vivid.length >= 2 ? 'attention' : 'neutral' });

  // Farbtyp
  if (ctx.season) {
    const faceNear = shares.filter((s) => FACE_NEAR_SLOTS.includes(s.slot));
    const topFace = faceNear.sort((a, b) => b.share - a.share).slice(0, 3);
    const outside = topFace.filter((s) => seasonFit(s.hex, ctx.season!).level === 'outside');
    const notes = topFace.map((s) => `${SLOT_LABEL[s.slot]}: ${SEASON_FIT_LABEL[seasonFit(s.hex, ctx.season!).level]}`);
    dims.push({
      id: 'season',
      label: `Eignung für ${ctx.season.nameDe}`,
      value: outside.length === 0 ? 'Stimmig' : `${outside.length} gesichtsnahe${outside.length === 1 ? 's Teil' : ' Teile'} eher außerhalb`,
      text:
        (outside.length === 0
          ? 'Die gesichtsnahen Farben passen zur Charakteristik deines Farbtyps.'
          : 'Farben außerhalb der Palette wirken mit Abstand zum Gesicht (Hose, Schuhe) meist unproblematisch.') +
        (notes.length ? ` (${notes.join(' · ')})` : ''),
      tone: outside.length === 0 ? 'positive' : 'attention',
    });
  }

  // Proportionen (60-30-10 als optionale Orientierung)
  const top3 = palette.slice(0, 3).map((p) => Math.round(p.share * 100));
  const near603010 = palette.length >= 3 && top3[0] >= 45 && top3[0] <= 75 && top3[1] >= 15 && top3[2] <= 20;
  dims.push({
    id: 'proportion',
    label: 'Farbproportionen',
    value: top3.join(' / ') + ' %',
    text: near603010
      ? 'Die Verteilung ähnelt der 60-30-10-Regel: eine Hauptfarbe, eine Nebenfarbe, ein Akzent.'
      : palette.length < 3
        ? 'Wenige Farben – eine klare, reduzierte Verteilung.'
        : 'Die 60-30-10-Regel ist nur eine Orientierung; ausgewogene Flächen funktionieren ebenso.',
    tone: 'neutral',
  });

  return { palette, harmony, dimensions: dims };
}
