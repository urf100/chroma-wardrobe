/**
 * Geometrie der schematischen Figur (viewBox 0 0 240 520, Frontalansicht).
 * Alle Kleidungsformen werden für die linke Körperhälfte konstruiert und
 * gespiegelt (x' = 240 - x).
 */
export type Pt = [number, number];

export const W = 240;
export const H = 520;
export const CX = 120;

export const mx = (x: number) => W - x;
export const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [mx(x), y]);

/**
 * Spiegelt einen Pfad mit ausschließlich absoluten M/L/Q/C/Z-Befehlen an der
 * Mittelachse. Zahlen werden paarweise als (x, y) gelesen.
 */
export function mirrorPath(d: string): string {
  let i = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (num) => {
    const v = parseFloat(num);
    const out = i % 2 === 0 ? (W - v).toFixed(1) : num;
    i++;
    return out;
  });
}

export const poly = (pts: Pt[], close = true) =>
  pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + (close ? ' Z' : '');

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const atY = (a: Pt, b: Pt, y: number): Pt => lerp(a, b, (y - a[1]) / (b[1] - a[1]));

/** Anatomische Ankerpunkte (linke Hälfte). */
export const BODY = {
  neck: [108, 90] as Pt,
  shoulder: [76, 102] as Pt,
  armpit: [82, 148] as Pt,
  waist: [86, 228] as Pt,
  hip: [82, 266] as Pt,
  wristOuter: [50, 258] as Pt,
  wristInner: [67, 258] as Pt,
  waistY: 262,
  crotch: [120, 304] as Pt,
  ankleY: 470,
  groundY: 500,
};

export type Neckline = 'crew' | 'v' | 'deepv' | 'scoop' | 'none' | 'collar';

export interface TorsoOpts {
  hem: number;
  ease?: number; // zusätzliche Weite in px
  drop?: number; // überschnittene Schulter
  flare?: number; // Ausstellung am Saum
  neck?: Neckline;
  neckWidth?: number;
  vDepth?: number; // Tiefe des V-Ausschnitts (y)
}

function torsoLeftPoints(o: TorsoOpts): { neck: Pt; shoulder: Pt; armpit: Pt; waist: Pt; hem: Pt } {
  const e = o.ease ?? 0;
  const d = o.drop ?? 0;
  const nw = o.neckWidth ?? 0;
  const hemX = o.hem > 270 ? 82 - e - (o.flare ?? 0) - (o.hem - 270) * 0.06 : 84 - e - (o.flare ?? 0);
  return {
    neck: [BODY.neck[0] - nw, BODY.neck[1]],
    shoulder: [BODY.shoulder[0] - e * 0.45, BODY.shoulder[1] + d],
    armpit: [BODY.armpit[0] - e, BODY.armpit[1] + d * 0.5],
    waist: [BODY.waist[0] - e, BODY.waist[1]],
    hem: [hemX, o.hem],
  };
}

/** Geschlossener Rumpf als ein Pfad. */
export function torsoPath(o: TorsoOpts): string {
  const p = torsoLeftPoints(o);
  const r = {
    neck: [mx(p.neck[0]), p.neck[1]] as Pt,
    shoulder: [mx(p.shoulder[0]), p.shoulder[1]] as Pt,
    armpit: [mx(p.armpit[0]), p.armpit[1]] as Pt,
    waist: [mx(p.waist[0]), p.waist[1]] as Pt,
    hem: [mx(p.hem[0]), p.hem[1]] as Pt,
  };
  const neck = o.neck ?? 'crew';
  let neckline: string;
  switch (neck) {
    case 'v':
      neckline = `L${CX} ${o.vDepth ?? 120} L${p.neck[0]} ${p.neck[1]}`;
      break;
    case 'deepv':
      neckline = `L${CX} ${o.vDepth ?? 152} L${p.neck[0]} ${p.neck[1]}`;
      break;
    case 'scoop':
      neckline = `Q${CX} ${o.vDepth ?? 122} ${p.neck[0]} ${p.neck[1]}`;
      break;
    case 'collar':
      neckline = `L${CX} ${o.vDepth ?? 104} L${p.neck[0]} ${p.neck[1]}`;
      break;
    case 'none':
      neckline = `Q${CX} ${p.neck[1] - 2} ${p.neck[0]} ${p.neck[1]}`;
      break;
    default:
      neckline = `Q${CX} ${p.neck[1] + 14} ${p.neck[0]} ${p.neck[1]}`;
  }
  return [
    `M${p.neck[0]} ${p.neck[1]}`,
    `Q${p.shoulder[0] + 12} ${p.shoulder[1] - 4} ${p.shoulder[0]} ${p.shoulder[1]}`,
    `Q${p.shoulder[0] - 4} ${p.shoulder[1] + 10} ${p.armpit[0]} ${p.armpit[1]}`,
    `L${p.waist[0]} ${p.waist[1]}`,
    `L${p.hem[0]} ${p.hem[1]}`,
    `Q${CX} ${p.hem[1] + 4} ${r.hem[0]} ${r.hem[1]}`,
    `L${r.waist[0]} ${r.waist[1]}`,
    `L${r.armpit[0]} ${r.armpit[1]}`,
    `Q${r.shoulder[0] + 4} ${r.shoulder[1] + 10} ${r.shoulder[0]} ${r.shoulder[1]}`,
    `Q${r.shoulder[0] - 12} ${r.shoulder[1] - 4} ${r.neck[0]} ${r.neck[1]}`,
    neckline,
    'Z',
  ].join(' ');
}

/**
 * Offener Rumpf: zwei Vorderteile mit Abstand in der Mitte.
 * `edgeTop` = y, bis zu dem die Kante schräg vom Hals zur Mitte läuft.
 */
export function openTorsoPaths(o: TorsoOpts & { gap?: number; edgeTop?: number }): [string, string] {
  const p = torsoLeftPoints(o);
  const gap = o.gap ?? 14;
  const edgeTop = o.edgeTop ?? 160;
  const left = [
    `M${p.neck[0]} ${p.neck[1]}`,
    `Q${p.shoulder[0] + 12} ${p.shoulder[1] - 4} ${p.shoulder[0]} ${p.shoulder[1]}`,
    `Q${p.shoulder[0] - 4} ${p.shoulder[1] + 10} ${p.armpit[0]} ${p.armpit[1]}`,
    `L${p.waist[0]} ${p.waist[1]}`,
    `L${p.hem[0]} ${p.hem[1]}`,
    `Q${(p.hem[0] + CX - gap) / 2} ${p.hem[1] + 3} ${CX - gap} ${p.hem[1] + 1}`,
    `L${CX - gap} ${edgeTop}`,
    `L${p.neck[0] + 3} ${p.neck[1] + 4}`,
    'Z',
  ].join(' ');
  return [left, mirrorPath(left)];
}

export interface SleeveOpts {
  len: number; // 0..1 (0.3 = kurz, 1 = Handgelenk)
  ease?: number;
  drop?: number;
  loose?: number; // Weite am Ärmelende
}

/** Ärmel der linken Seite als Punktliste (für Spiegelung). */
export function sleevePoints(o: SleeveOpts): Pt[] {
  const e = o.ease ?? 0;
  const d = o.drop ?? 0;
  const S: Pt = [BODY.shoulder[0] - e * 0.45, BODY.shoulder[1] + d];
  const A: Pt = [BODY.armpit[0] - e, BODY.armpit[1] + d * 0.5];
  const Wo: Pt = [BODY.wristOuter[0] - e * 0.35, BODY.wristOuter[1]];
  const Wi: Pt = [BODY.wristInner[0] - e * 0.2, BODY.wristInner[1]];
  const yo = S[1] + o.len * (Wo[1] - S[1]);
  const outer = atY(S, Wo, yo);
  const yi = Math.max(A[1] + 4, yo + 6);
  const inner = atY(A, Wi, Math.min(yi, Wi[1]));
  const loose = o.loose ?? 0;
  return [S, [S[0] - 5, S[1] + 10], [outer[0] - loose, outer[1]], [inner[0] + loose * 0.3, inner[1]], A];
}

export function sleevePaths(o: SleeveOpts): [string, string] {
  const pts = sleevePoints(o);
  return [poly(pts), poly(mirror(pts))];
}

/** Ärmelende (Bündchen/Manschette) als schmales Band. */
export function cuffPaths(o: SleeveOpts, width = 7): [string, string] {
  const pts = sleevePoints(o);
  const outer = pts[2];
  const inner = pts[3];
  const dx = (outer[0] - pts[0][0]) / (outer[1] - pts[0][1]);
  const band: Pt[] = [
    [outer[0] - dx * width, outer[1] - width],
    outer,
    inner,
    [inner[0] - dx * width, inner[1] - width],
  ];
  return [poly(band), poly(mirror(band))];
}

export interface LegOpts {
  hem: number;
  outerHem: number; // x der äußeren Saumkante links
  innerHem: number; // x der inneren Saumkante links
  ease?: number;
  waist?: number;
}

export function legsPath(o: LegOpts): string {
  const e = o.ease ?? 0;
  const wy = o.waist ?? BODY.waistY;
  const kneeY = Math.min(380, o.hem - 10);
  const kneeT = (kneeY - 300) / Math.max(1, o.hem - 300);
  const left: Pt[] = [
    [84 - e * 0.3, wy],
    [81 - e, 292],
    [81 - e + (o.outerHem - (81 - e)) * Math.max(0, kneeT), kneeY],
    [o.outerHem, o.hem],
    [o.innerHem, o.hem],
    [116 - (116 - o.innerHem) * Math.max(0, kneeT), kneeY],
  ];
  const right = mirror(left).reverse();
  return poly([...left, BODY.crotch, ...right]);
}
