/**
 * Kombinierbarkeit zweier Farben – regelbasiert und erklärbar.
 *
 * Jede Regel liefert Punkte UND einen verständlichen Satz. Die Punkte dienen
 * nur zur Sortierung; angezeigt werden qualitative Stufen und Begründungen.
 * Persönliches Feedback und Vorlieben haben bewusst das stärkste Gewicht.
 */
import type {
  ColorSeason,
  FeedbackVerdict,
  HexColor,
  QualitativeLevel,
  RecommendationReason,
} from '../types';
import { colorProfile, hueDistance } from '../color/analysis';
import { deltaE2000 } from '../color/distance';
import { nameColor } from '../color/naming';
import { CURATED_EXAMPLES } from '../examples/curated';
import { seasonFit } from '../seasons/fit';

export interface PairContext {
  season?: ColorSeason;
  favoriteColors?: HexColor[];
  dislikedColors?: HexColor[];
  /** Feedback je Paar-Schlüssel (siehe `pairKey`). */
  feedback?: Map<string, FeedbackVerdict>;
  /** Saisonale Eignung nur für gesichtsnahe Teile berücksichtigen. */
  checkSeasonFor?: ('a' | 'b')[];
}

export interface PairEvaluation {
  points: number;
  level: QualitativeLevel;
  reasons: RecommendationReason[];
}

export const LEVEL_LABEL: Record<QualitativeLevel, string> = {
  strong: 'Sehr gut kombinierbar',
  good: 'Gut kombinierbar',
  possible: 'Möglich',
  careful: 'Mit Bedacht',
};

export function levelFromPoints(points: number): QualitativeLevel {
  if (points >= 3) return 'strong';
  if (points >= 1.5) return 'good';
  if (points >= 0) return 'possible';
  return 'careful';
}

export const pairKey = (...ids: string[]) => [...ids].sort().join('|');

function curatedMatch(a: HexColor, b: HexColor): string | null {
  for (const ex of CURATED_EXAMPLES) {
    const hasA = ex.colors.some((c) => deltaE2000(c.hex, a) < 5);
    const hasB = ex.colors.some((c) => deltaE2000(c.hex, b) < 5);
    if (hasA && hasB && deltaE2000(a, b) > 5) return ex.title;
  }
  return null;
}

export function pairColors(a: HexColor, b: HexColor, ctx: PairContext = {}): PairEvaluation {
  const A = colorProfile(a);
  const B = colorProfile(b);
  const reasons: RecommendationReason[] = [];
  let points = 0;
  const add = (p: number, r: RecommendationReason) => {
    points += p;
    reasons.push(r);
  };
  const nameA = nameColor(a).name;
  const nameB = nameColor(b).name;
  const dL = Math.abs(A.L - B.L);
  const neutralA = A.neutrality !== 'color';
  const neutralB = B.neutrality !== 'color';
  const de = deltaE2000(a, b);

  // 1) Neutralfarben
  if (neutralA && neutralB) {
    const warmBrown = (p: typeof A) => p.neutrality === 'warm-neutral' && p.C > 0.035 && p.temperatureScore > 0.3;
    const coolGrey = (p: typeof A) => p.neutrality === 'achromatic' && p.temperatureScore < -0.05;
    const greyBrown = (warmBrown(A) && coolGrey(B)) || (warmBrown(B) && coolGrey(A));
    if (greyBrown && dL < 0.18) {
      add(-2, {
        kind: 'temperature',
        effect: 'negative',
        text: `Kühles Grau und warmes Braun mit ähnlicher Helligkeit: Die Temperaturen widersprechen sich, ohne dass ein Helligkeitskontrast sie trennt. Das wirkt oft unentschieden.`,
      });
    } else if (greyBrown) {
      add(0.5, {
        kind: 'lightness',
        effect: 'positive',
        text: `Grau und Braun haben unterschiedliche Temperaturen, aber der deutliche Helligkeitsunterschied trennt sie klar.`,
      });
    } else {
      add(1, { kind: 'neutral', effect: 'positive', text: `${nameA} und ${nameB} sind beide Neutralfarben und daher leicht kombinierbar.` });
    }
  } else if (neutralA || neutralB) {
    const [n, col] = neutralA ? [nameA, nameB] : [nameB, nameA];
    add(1.5, { kind: 'neutral', effect: 'positive', text: `${n} ist eine ruhige Neutralfarbe und lässt ${col} wirken.` });
  } else {
    // 2) Farbton-Beziehung zweier bunter Farben
    const d = hueDistance(A.h, B.h);
    const bothMuted = A.C < 0.12 && B.C < 0.12;
    if (d < 25) {
      if (dL > 0.15) {
        add(1.5, { kind: 'hue', effect: 'positive', text: `Gleicher Farbton in unterschiedlicher Helligkeit – eine Ton-in-Ton-Kombination.` });
      } else if (de > 3 && de < 12 && dL < 0.06) {
        add(-1, {
          kind: 'hue',
          effect: 'negative',
          text: `${nameA} und ${nameB} sind fast gleich, aber nicht ganz – das kann unbeabsichtigt wirken.`,
        });
      } else {
        add(0.5, { kind: 'hue', effect: 'neutral', text: `Sehr ähnliche Farben – wirkt monochrom und ruhig.` });
      }
    } else if (d < 70) {
      add(1, { kind: 'hue', effect: 'positive', text: `Die Farbtöne liegen im Farbkreis nah beieinander (analoge Harmonie).` });
    } else if (d >= 150) {
      if (bothMuted) {
        add(1, { kind: 'hue', effect: 'positive', text: `Gedeckter Komplementärkontrast: lebendig, aber nicht grell.` });
      } else {
        add(0, { kind: 'hue', effect: 'neutral', text: `Kräftiger Komplementärkontrast – auffällig und spannungsreich.` });
      }
    } else if (A.C > 0.12 && B.C > 0.12) {
      add(-1, {
        kind: 'saturation',
        effect: 'negative',
        text: `Zwei kräftige Farben ohne klare Farbkreis-Beziehung konkurrieren um Aufmerksamkeit.`,
      });
    } else {
      add(0.25, { kind: 'hue', effect: 'neutral', text: `Unterschiedliche Farbtöne; durch die gedeckte Sättigung wirkt es dennoch ruhig.` });
    }

    // 3) Sättigung
    if (A.C > 0.18 && B.C > 0.18) {
      add(-0.5, { kind: 'saturation', effect: 'negative', text: `Beide Farben sind sehr leuchtend und konkurrieren.` });
    } else if (Math.abs(A.C - B.C) > 0.08) {
      add(0.25, { kind: 'saturation', effect: 'positive', text: `Eine kräftigere und eine ruhigere Farbe ergänzen sich (Sättigungskontrast).` });
    }

    // 4) Temperatur
    const dT = Math.abs(A.temperatureScore - B.temperatureScore);
    if (dT > 1 && dL < 0.15) {
      add(-0.5, { kind: 'temperature', effect: 'negative', text: `Warm trifft kalt bei ähnlicher Helligkeit – kann unruhig wirken.` });
    } else if (dT > 0.8 && dL >= 0.2) {
      add(0.3, { kind: 'temperature', effect: 'positive', text: `Lebendiger Warm-Kalt-Kontrast.` });
    }
  }

  // 5) Helligkeit (für alle Kombinationen)
  if (dL >= 0.25) {
    add(1, { kind: 'lightness', effect: 'positive', text: `Klarer Helligkeitskontrast zwischen ${nameA} und ${nameB} – die Teile heben sich gut voneinander ab.` });
  } else if (dL < 0.08 && de > 12) {
    add(-0.5, { kind: 'lightness', effect: 'negative', text: `Kaum Helligkeitsunterschied: Die Teile verschwimmen aus der Entfernung.` });
  }

  // 6) Kuratierte Beispiele
  const cur = curatedMatch(a, b);
  if (cur) add(1.5, { kind: 'curated', effect: 'positive', text: `Entspricht dem kuratierten Beispiel „${cur}“.` });

  // 7) Farbtyp
  if (ctx.season) {
    for (const key of ctx.checkSeasonFor ?? []) {
      const hex = key === 'a' ? a : b;
      const fit = seasonFit(hex, ctx.season);
      const nm = key === 'a' ? nameA : nameB;
      if (fit.level === 'palette' || fit.level === 'compatible') {
        add(0.25, { kind: 'season', effect: 'positive', text: `${nm} passt zu ${ctx.season.nameDe}.` });
      } else if (fit.level === 'outside') {
        add(-0.5, { kind: 'season', effect: 'negative', text: `${nm} liegt eher außerhalb von ${ctx.season.nameDe} – besser nicht direkt am Gesicht.` });
      }
    }
  }

  // 8) Persönliche Vorlieben (Vorrang vor Theorie)
  for (const hex of [a, b]) {
    if (ctx.dislikedColors?.some((d) => deltaE2000(d, hex) < 8)) {
      add(-2, { kind: 'preference', effect: 'negative', text: `${nameColor(hex).name} gehört zu deinen weniger bevorzugten Farben.` });
    } else if (ctx.favoriteColors?.some((f) => deltaE2000(f, hex) < 8)) {
      add(0.5, { kind: 'preference', effect: 'positive', text: `${nameColor(hex).name} gehört zu deinen Lieblingsfarben.` });
    }
  }

  return { points, level: levelFromPoints(points), reasons };
}
