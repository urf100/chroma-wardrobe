/**
 * Parametrische Silhouetten aller Kleidungsarten.
 *
 * Jede Silhouette ist eine Funktion, die SVG-Elemente im Koordinatensystem
 * der Figur (240 × 520) erzeugt. So passen alle Teile übereinander, und
 * dieselbe Zeichnung dient als Vorschaubild (mit zugeschnittener viewBox).
 */
import type { ReactNode } from 'react';
import type { PatternType } from '@/domain/types';
import {
  BODY,
  CX,
  cuffPaths,
  legsPath,
  mirror,
  mirrorPath,
  mx,
  openTorsoPaths,
  poly,
  sleevePaths,
  torsoPath,
  type Pt,
  type TorsoOpts,
} from './geometry';

export interface RenderCtx {
  fill: string;
  main: string;
  secondary: string;
  accent: string;
  outline: string;
  detail: string;
  shade: string;
  attrs: Record<string, string>;
  open: boolean;
  pattern: PatternType;
  skin: string;
}

type Renderer = (rc: RenderCtx) => ReactNode;

/* ---------------- Grundelemente ---------------- */

function Shape({ d, rc, fill }: { d: string; rc: RenderCtx; fill?: string }) {
  return (
    <g>
      <path d={d} fill={fill ?? rc.fill} stroke={rc.outline} strokeWidth={1.1} strokeLinejoin="round" />
      <path d={d} fill={rc.shade} />
    </g>
  );
}

const Line = ({ d, rc, w = 1, dash, color }: { d: string; rc: RenderCtx; w?: number; dash?: string; color?: string }) => (
  <path d={d} fill="none" stroke={color ?? rc.detail} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
);

const Dot = ({ x, y, rc, r = 1.6, color }: { x: number; y: number; rc: RenderCtx; r?: number; color?: string }) => (
  <circle cx={x} cy={y} r={r} fill={color ?? rc.detail} />
);

const both = (d: string) => [d, mirrorPath(d)];

/** Gerippter Streifen (Bündchen) als Linienschraffur. */
function Rib({ d, rc, x1, x2, y1, y2 }: { d: string; rc: RenderCtx; x1: number; x2: number; y1: number; y2: number }) {
  const lines: ReactNode[] = [];
  for (let x = x1 + 2; x < x2; x += 3) lines.push(<line key={x} x1={x} y1={y1} x2={x} y2={y2} stroke={rc.detail} strokeWidth={0.6} opacity={0.6} />);
  return (
    <g>
      <Shape d={d} rc={rc} />
      {lines}
    </g>
  );
}

function Sleeves({ rc, len, ease = 0, drop = 0, loose = 0, cuff }: { rc: RenderCtx; len: number; ease?: number; drop?: number; loose?: number; cuff?: 'rib' | 'band' | 'shirt' }) {
  const [l, r] = sleevePaths({ len, ease, drop, loose });
  const [cl, cr] = cuffPaths({ len, ease, drop, loose }, cuff === 'shirt' ? 8 : 6);
  return (
    <g>
      <Shape d={l} rc={rc} />
      <Shape d={r} rc={rc} />
      {cuff && (
        <>
          <Shape d={cl} rc={rc} />
          <Shape d={cr} rc={rc} />
        </>
      )}
    </g>
  );
}

function Hood({ rc, fur }: { rc: RenderCtx; fur?: boolean }) {
  const d = 'M98 96 Q90 70 104 60 Q120 52 136 60 Q150 70 142 96 Q134 84 120 84 Q106 84 98 96 Z';
  return (
    <g>
      <Shape d={d} rc={rc} />
      {fur && (
        <path
          d="M99 95 Q92 70 105 61 Q120 53 135 61 Q148 70 141 95"
          fill="none"
          stroke="#D8CCB6"
          strokeWidth={6}
          strokeDasharray="2 1.5"
          strokeLinecap="round"
          opacity={0.95}
        />
      )}
    </g>
  );
}

function StandCollar({ rc, h = 12 }: { rc: RenderCtx; h?: number }) {
  return <Shape d={`M105 ${92 - h} L135 ${92 - h} L136 96 Q120 101 104 96 Z`} rc={rc} />;
}

function PointCollar({ rc, open }: { rc: RenderCtx; open?: boolean }) {
  const l = open ? 'M108 86 L99 106 L114 118 L116 96 Z' : 'M108 86 L101 104 L119 102 Z';
  return (
    <g>
      {both(l).map((d, i) => (
        <Shape key={i} d={d} rc={rc} />
      ))}
    </g>
  );
}

function Lapels({ rc, open, wide = false, gap = 14, edgeTop = 168 }: { rc: RenderCtx; open: boolean; wide?: boolean; gap?: number; edgeTop?: number }) {
  const w = wide ? 6 : 0;
  const left: Pt[] = open
    ? [
        [108, 89],
        [96 - w, 104],
        [102 - w, 109],
        [96 - w, 118],
        [CX - gap, edgeTop],
        [CX - gap + 2, edgeTop - 8],
        [111, 96],
      ]
    : [
        [108, 89],
        [97 - w, 106],
        [104 - w, 111],
        [99 - w, 120],
        [CX, 156],
        [111, 98],
      ];
  return (
    <g>
      <Shape d={poly(left)} rc={rc} />
      <Shape d={poly(mirror(left))} rc={rc} />
    </g>
  );
}

function Buttons({ rc, ys, x = CX, r = 1.8 }: { rc: RenderCtx; ys: number[]; x?: number; r?: number }) {
  return (
    <g>
      {ys.map((y) => (
        <Dot key={y} x={x} y={y} rc={rc} r={r} />
      ))}
    </g>
  );
}

function Zip({ rc, from = 96, to, x = CX }: { rc: RenderCtx; from?: number; to: number; x?: number }) {
  return (
    <g>
      <Line d={`M${x} ${from} L${x} ${to}`} rc={rc} w={1.4} />
      <rect x={x - 1.6} y={from + 2} width={3.2} height={6} rx={1} fill={rc.detail} />
    </g>
  );
}

function Pocket({ rc, x, y, w, h, flap = true }: { rc: RenderCtx; x: number; y: number; w: number; h: number; flap?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={1.5} fill="none" stroke={rc.detail} strokeWidth={0.9} />
      {flap && <rect x={x - 1} y={y - 1} width={w + 2} height={h * 0.35} rx={1.5} fill={rc.fill} stroke={rc.detail} strokeWidth={0.9} />}
    </g>
  );
}

function PocketPair(props: { rc: RenderCtx; x: number; y: number; w: number; h: number; flap?: boolean }) {
  return (
    <g>
      <Pocket {...props} />
      <Pocket {...props} x={mx(props.x + props.w)} />
    </g>
  );
}

/* ---------------- Oberteile ---------------- */

interface TopSpec extends TorsoOpts {
  sleeve: number; // 0 = ärmellos
  loose?: number;
  cuff?: 'rib' | 'band' | 'shirt';
}

function Top({ rc, spec, children }: { rc: RenderCtx; spec: TopSpec; children?: ReactNode }) {
  return (
    <g>
      {spec.sleeve > 0 && <Sleeves rc={rc} len={spec.sleeve} ease={spec.ease} drop={spec.drop} loose={spec.loose} cuff={spec.cuff} />}
      <Shape d={torsoPath(spec)} rc={rc} />
      {children}
    </g>
  );
}

const crewRib = (rc: RenderCtx, w = 2.2) => <Line d="M108 90 Q120 104 132 90" rc={rc} w={w} />;

const shirtSleeve = (rc: RenderCtx) => (rc.attrs.sleeve === 'short' ? 0.33 : 1);

function ShirtBase(rc: RenderCtx, opts: { hem?: number; ease?: number; flannel?: boolean; overshirt?: boolean }) {
  const hem = opts.hem ?? 282;
  const ease = opts.ease ?? 2;
  const sleeve = opts.overshirt ? 1 : shirtSleeve(rc);
  const open = !!opts.overshirt && rc.open;
  if (open) {
    const [l, r] = openTorsoPaths({ hem, ease, gap: 10, edgeTop: 112 });
    return (
      <g>
        <Sleeves rc={rc} len={sleeve} ease={ease} cuff="shirt" />
        <Shape d={l} rc={rc} />
        <Shape d={r} rc={rc} />
        <PointCollar rc={rc} open />
        <PocketPair rc={rc} x={94} y={130} w={15} h={17} />
      </g>
    );
  }
  return (
    <Top rc={rc} spec={{ hem, ease, neck: 'collar', sleeve, cuff: sleeve === 1 ? 'shirt' : undefined }}>
      <Line d={`M${CX} 102 L${CX} ${hem}`} rc={rc} w={0.8} />
      <Buttons rc={rc} ys={[112, 140, 168, 196, 224, 252].filter((y) => y < hem - 8)} r={1.3} />
      <PointCollar rc={rc} />
      {opts.flannel || opts.overshirt ? <PocketPair rc={rc} x={94} y={130} w={15} h={17} /> : <Pocket rc={rc} x={98} y={132} w={13} h={15} flap={false} />}
    </Top>
  );
}

const TOPS: Record<string, Renderer> = {
  tee: (rc) => <Top rc={rc} spec={{ hem: 270, ease: 2, sleeve: 0.3, loose: 2 }}>{crewRib(rc)}</Top>,
  'tee-oversized': (rc) => (
    <Top rc={rc} spec={{ hem: 284, ease: 10, drop: 10, sleeve: 0.42, loose: 6 }}>
      {crewRib(rc, 2.6)}
      <Line d="M68 116 L72 108" rc={rc} w={0.6} />
    </Top>
  ),
  longsleeve: (rc) => <Top rc={rc} spec={{ hem: 272, ease: 2, sleeve: 1, cuff: 'rib' }}>{crewRib(rc)}</Top>,
  polo: (rc) => (
    <Top rc={rc} spec={{ hem: 272, ease: 3, sleeve: 0.3, loose: 1, neck: 'collar', vDepth: 100, cuff: 'rib' }}>
      <rect x={116} y={96} width={8} height={36} fill="none" stroke={rc.detail} strokeWidth={0.9} />
      <Buttons rc={rc} ys={[106, 118, 128]} r={1.2} />
      <PointCollar rc={rc} />
    </Top>
  ),
  shirt: (rc) => ShirtBase(rc, {}),
  'shirt-flannel': (rc) => ShirtBase(rc, { flannel: true, ease: 4 }),
  overshirt: (rc) => ShirtBase(rc, { overshirt: true, hem: 288, ease: 7 }),
  tank: (rc) => (
    <g>
      <Shape d="M106 88 L97 90 Q94 128 85 150 L86 228 L84 268 Q120 272 156 268 L154 228 L155 150 Q146 128 143 90 L134 88 Q120 118 106 88 Z" rc={rc} />
      <Line d="M106 88 Q120 118 134 88" rc={rc} w={1.6} />
    </g>
  ),
  blouse: (rc) => (
    <Top rc={rc} spec={{ hem: 276, ease: 4, flare: 5, neck: 'v', vDepth: 118, sleeve: shirtSleeve(rc), loose: 5, cuff: shirtSleeve(rc) === 1 ? 'band' : undefined }}>
      <Line d="M110 92 Q114 104 120 118 Q126 104 130 92" rc={rc} w={1.2} />
      <Buttons rc={rc} ys={[132, 152, 172, 192, 212]} r={1.2} />
    </Top>
  ),
};

/* ---------------- Strick & Sweat ---------------- */

function KnitBase(rc: RenderCtx, opts: { hem?: number; ease?: number; neck?: TorsoOpts['neck']; hood?: boolean; turtle?: boolean; raglan?: boolean }) {
  const hem = opts.hem ?? 274;
  const ease = opts.ease ?? 5;
  return (
    <g>
      {opts.hood && <Hood rc={rc} />}
      <Top rc={rc} spec={{ hem, ease, neck: opts.neck ?? 'crew', sleeve: 1, cuff: 'rib', loose: 2 }}>
        <Rib d={`M${84 - ease} ${hem - 12} L${mx(84 - ease)} ${hem - 12} L${mx(84 - ease)} ${hem} Q${CX} ${hem + 4} ${84 - ease} ${hem} Z`} rc={rc} x1={84 - ease} x2={mx(84 - ease)} y1={hem - 11} y2={hem + 1} />
        {!opts.turtle && !opts.hood && opts.neck !== 'deepv' && crewRib(rc, 3)}
        {opts.raglan && (
          <>
            <Line d={`M106 92 L${82 - ease} 146`} rc={rc} w={0.8} />
            <Line d={`M134 92 L${mx(82 - ease)} 146`} rc={rc} w={0.8} />
          </>
        )}
      </Top>
      {opts.turtle && (
        <Rib d="M107 64 L133 64 L134 94 Q120 100 106 94 Z" rc={rc} x1={107} x2={133} y1={66} y2={94} />
      )}
    </g>
  );
}

function Cardigan(rc: RenderCtx, kind: 'cardigan' | 'zip-hoodie' | 'knit-jacket') {
  const hem = kind === 'zip-hoodie' ? 274 : 278;
  const ease = kind === 'knit-jacket' ? 7 : 5;
  const isOpen = rc.open;
  const hood = kind === 'zip-hoodie';
  const ribHem = `M${84 - ease} ${hem - 12} L${mx(84 - ease)} ${hem - 12} L${mx(84 - ease)} ${hem} Q${CX} ${hem + 4} ${84 - ease} ${hem} Z`;
  if (isOpen) {
    const [l, r] = openTorsoPaths({ hem, ease, gap: 12, edgeTop: kind === 'cardigan' ? 180 : 104 });
    return (
      <g>
        {hood && <Hood rc={rc} />}
        <Sleeves rc={rc} len={1} ease={ease} cuff="rib" loose={2} />
        <Shape d={l} rc={rc} />
        <Shape d={r} rc={rc} />
        {kind === 'knit-jacket' && <StandCollar rc={rc} h={8} />}
        <Line d={`M${84 - ease} ${hem - 12} L${CX - 12} ${hem - 11}`} rc={rc} w={0.9} />
        <Line d={`M${mx(84 - ease)} ${hem - 12} L${CX + 12} ${hem - 11}`} rc={rc} w={0.9} />
      </g>
    );
  }
  return (
    <g>
      {hood && <Hood rc={rc} />}
      <Top rc={rc} spec={{ hem, ease, neck: kind === 'cardigan' ? 'deepv' : 'crew', vDepth: 176, sleeve: 1, cuff: 'rib', loose: 2 }}>
        <Rib d={ribHem} rc={rc} x1={84 - ease} x2={mx(84 - ease)} y1={hem - 11} y2={hem + 1} />
        {kind === 'cardigan' ? (
          <>
            <Line d="M108 90 L120 176 L132 90" rc={rc} w={2} />
            <Buttons rc={rc} ys={[188, 206, 224, 242, 258]} r={1.6} />
          </>
        ) : rc.attrs.closure === 'buttons' ? (
          <>
            <Line d={`M${CX} 94 L${CX} ${hem}`} rc={rc} w={0.8} />
            <Buttons rc={rc} ys={[110, 140, 170, 200, 230]} />
          </>
        ) : (
          <Zip rc={rc} from={hood ? 92 : 84} to={hem} />
        )}
        {kind === 'zip-hoodie' && (
          <>
            <Line d="M100 222 L94 254" rc={rc} />
            <Line d="M140 222 L146 254" rc={rc} />
            <Line d="M114 94 L113 136" rc={rc} w={1} />
            <Line d="M126 94 L127 136" rc={rc} w={1} />
          </>
        )}
      </Top>
      {kind === 'knit-jacket' && <StandCollar rc={rc} h={10} />}
    </g>
  );
}

const KNIT: Record<string, Renderer> = {
  sweater: (rc) => KnitBase(rc, {}),
  turtleneck: (rc) => KnitBase(rc, { turtle: true, neck: 'none' }),
  sweatshirt: (rc) => KnitBase(rc, { ease: 8, raglan: true }),
  hoodie: (rc) => (
    <g>
      {KnitBase(rc, { ease: 8, hood: true })}
      <path d="M100 214 L140 214 L148 256 L92 256 Z" fill="none" stroke={rc.detail} strokeWidth={1} />
      <Line d="M114 94 L113 136" rc={rc} w={1} />
      <Line d="M126 94 L127 136" rc={rc} w={1} />
      <Dot x={113} y={138} rc={rc} r={1.4} />
      <Dot x={127} y={138} rc={rc} r={1.4} />
    </g>
  ),
  cardigan: (rc) => Cardigan(rc, 'cardigan'),
  'zip-hoodie': (rc) => Cardigan(rc, 'zip-hoodie'),
  'knit-jacket': (rc) => Cardigan(rc, 'knit-jacket'),
};

/* ---------------- Jacken & Mäntel ---------------- */

interface JacketSpec {
  hem: number;
  ease: number;
  flare?: number;
  loose?: number;
  cuff?: 'rib' | 'band';
  collar: 'notch' | 'wide-notch' | 'point' | 'stand' | 'tall-stand' | 'hood' | 'fur-hood' | 'rib' | 'none';
  closure: 'zip' | 'buttons' | 'double' | 'asym' | 'storm' | 'none';
  ribHem?: boolean;
  gap?: number;
  edgeTop?: number;
}

function Jacket({ rc, s, children, openExtras }: { rc: RenderCtx; s: JacketSpec; children?: ReactNode; openExtras?: ReactNode }) {
  const lapel = s.collar === 'notch' || s.collar === 'wide-notch';
  const hooded = s.collar === 'hood' || s.collar === 'fur-hood';
  const gap = s.gap ?? (lapel ? 16 : 12);
  const edgeTop = s.edgeTop ?? (lapel ? 170 : 100);
  const ribD = `M${83 - s.ease} ${s.hem - 12} L${mx(83 - s.ease)} ${s.hem - 12} L${mx(83 - s.ease)} ${s.hem} Q${CX} ${s.hem + 4} ${83 - s.ease} ${s.hem} Z`;
  const collar = (open: boolean) => {
    switch (s.collar) {
      case 'notch':
      case 'wide-notch':
        return <Lapels rc={rc} open={open} wide={s.collar === 'wide-notch'} gap={gap} edgeTop={edgeTop} />;
      case 'point':
        return <PointCollar rc={rc} open={open} />;
      case 'stand':
        return <StandCollar rc={rc} h={10} />;
      case 'tall-stand':
        return <StandCollar rc={rc} h={18} />;
      case 'rib':
        return <Rib d="M105 82 L135 82 L136 96 Q120 101 104 96 Z" rc={rc} x1={105} x2={135} y1={83} y2={97} />;
      default:
        return null;
    }
  };
  if (rc.open && s.closure !== 'none') {
    const [l, r] = openTorsoPaths({ hem: s.hem, ease: s.ease, flare: s.flare, gap, edgeTop });
    return (
      <g>
        {hooded && <Hood rc={rc} fur={s.collar === 'fur-hood'} />}
        <Sleeves rc={rc} len={1} ease={s.ease} loose={s.loose ?? 3} cuff={s.cuff === 'rib' ? 'rib' : undefined} />
        <Shape d={l} rc={rc} />
        <Shape d={r} rc={rc} />
        {s.ribHem && (
          <>
            <Line d={`M${83 - s.ease} ${s.hem - 12} L${CX - gap} ${s.hem - 11}`} rc={rc} />
            <Line d={`M${mx(83 - s.ease)} ${s.hem - 12} L${CX + gap} ${s.hem - 11}`} rc={rc} />
          </>
        )}
        {collar(true)}
        {openExtras}
      </g>
    );
  }
  const neck: TorsoOpts['neck'] = lapel ? 'deepv' : s.collar === 'point' ? 'collar' : 'crew';
  return (
    <g>
      {hooded && <Hood rc={rc} fur={s.collar === 'fur-hood'} />}
      <Top rc={rc} spec={{ hem: s.hem, ease: s.ease, flare: s.flare, neck, vDepth: lapel ? 156 : 104, sleeve: 1, loose: s.loose ?? 3, cuff: s.cuff === 'rib' ? 'rib' : undefined }}>
        {s.ribHem && <Rib d={ribD} rc={rc} x1={83 - s.ease} x2={mx(83 - s.ease)} y1={s.hem - 11} y2={s.hem + 1} />}
        {s.closure === 'zip' && <Zip rc={rc} from={lapel ? 156 : 94} to={s.hem} />}
        {s.closure === 'storm' && (
          <>
            <rect x={116} y={94} width={8} height={s.hem - 94} fill={rc.fill} stroke={rc.detail} strokeWidth={0.9} />
            <Buttons rc={rc} ys={Array.from({ length: Math.floor((s.hem - 110) / 32) + 1 }, (_, i) => 110 + i * 32)} r={1.3} />
          </>
        )}
        {s.closure === 'buttons' && (
          <>
            <Line d={`M${CX} ${lapel ? 156 : 100} L${CX} ${s.hem}`} rc={rc} w={0.8} />
            <Buttons rc={rc} ys={lapel ? [184, 214, 244].filter((y) => y < s.hem - 10) : [114, 146, 178, 210, 242].filter((y) => y < s.hem - 10)} />
          </>
        )}
        {s.closure === 'double' && (
          <>
            <Line d={`M${CX + 10} 156 L${CX + 10} ${s.hem}`} rc={rc} w={0.8} />
            {[172, 206, 240].map((y) => (
              <g key={y}>
                <Dot x={CX - 10} y={y} rc={rc} r={2} />
                <Dot x={CX + 18} y={y} rc={rc} r={2} />
              </g>
            ))}
          </>
        )}
        {s.closure === 'asym' && <Line d={`M128 92 L108 176 L110 ${s.hem}`} rc={rc} w={1.5} />}
      </Top>
      {collar(false)}
      {children}
    </g>
  );
}

const len = (rc: RenderCtx, short: number, regular: number, long: number) =>
  rc.attrs.length === 'short' ? short : rc.attrs.length === 'long' ? long : regular;
const hoodAttr = (rc: RenderCtx, fallback: JacketSpec['collar'], fur = false): JacketSpec['collar'] =>
  rc.attrs.hood === 'yes' ? (fur ? 'fur-hood' : 'hood') : fallback;

function Quilting({ rc, hem, ease, diamond }: { rc: RenderCtx; hem: number; ease: number; diamond?: boolean }) {
  const lines: ReactNode[] = [];
  if (diamond) {
    for (let k = -200; k < 300; k += 18) {
      lines.push(<line key={`a${k}`} x1={60} y1={100 + k} x2={180} y2={220 + k} stroke={rc.detail} strokeWidth={0.6} opacity={0.6} />);
      lines.push(<line key={`b${k}`} x1={180} y1={100 + k} x2={60} y2={220 + k} stroke={rc.detail} strokeWidth={0.6} opacity={0.6} />);
    }
  } else {
    for (let y = 122; y < hem - 4; y += 22) lines.push(<path key={y} d={`M${82 - ease} ${y} Q${CX} ${y + 5} ${mx(82 - ease)} ${y}`} fill="none" stroke={rc.detail} strokeWidth={1} opacity={0.8} />);
    for (let y = 132; y < 258; y += 22) {
      lines.push(<line key={`sl${y}`} x1={78 - ease - (y - 120) * 0.13} y1={y} x2={64 - ease * 0.4 - (y - 120) * 0.13} y2={y + 4} stroke={rc.detail} strokeWidth={1} opacity={0.8} />);
      lines.push(<line key={`sr${y}`} x1={mx(78 - ease - (y - 120) * 0.13)} y1={y} x2={mx(64 - ease * 0.4 - (y - 120) * 0.13)} y2={y + 4} stroke={rc.detail} strokeWidth={1} opacity={0.8} />);
    }
  }
  const clipId = `q-${hem}-${ease}-${diamond ? 'd' : 'h'}`;
  return (
    <g>
      <clipPath id={clipId}>
        <path d={torsoPath({ hem, ease })} />
        <path d={sleevePaths({ len: 1, ease })[0]} />
        <path d={sleevePaths({ len: 1, ease })[1]} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>{lines}</g>
    </g>
  );
}

const OUTER: Record<string, Renderer> = {
  'leather-jacket': (rc) => (
    <Jacket rc={rc} s={{ hem: 266, ease: 5, collar: 'wide-notch', closure: 'asym', gap: 14, edgeTop: 150 }}>
      <rect x={78} y={256} width={84} height={8} fill={rc.fill} stroke={rc.detail} strokeWidth={0.8} />
      <rect x={146} y={255} width={7} height={10} fill="none" stroke="#B9B4AA" strokeWidth={1.4} />
      <Line d="M92 196 L104 190" rc={rc} w={1.4} />
      <Line d="M136 200 L148 194" rc={rc} w={1.4} />
      <path d="M92 130 Q100 160 96 200" fill="none" stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={5} strokeLinecap="round" />
      <path d="M58 150 Q56 190 56 230" fill="none" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={4} strokeLinecap="round" />
    </Jacket>
  ),
  bomber: (rc) => (
    <Jacket rc={rc} s={{ hem: 262, ease: 10, loose: 6, cuff: 'rib', collar: 'rib', closure: 'zip', ribHem: true }}>
      <Line d="M96 206 L92 236" rc={rc} w={1.4} />
      <Line d="M144 206 L148 236" rc={rc} w={1.4} />
      <rect x={60} y={138} width={9} height={14} rx={1} fill="none" stroke={rc.detail} strokeWidth={0.9} transform="rotate(8 64 145)" />
    </Jacket>
  ),
  parka: (rc) => {
    const hem = len(rc, 300, 346, 394);
    return (
      <Jacket rc={rc} s={{ hem, ease: 10, flare: 3, collar: hoodAttr(rc, 'tall-stand', true), closure: rc.attrs.closure === 'buttons' ? 'storm' : 'storm' }} openExtras={<PocketPair rc={rc} x={86} y={hem - 64} w={22} h={26} />}>
        <PocketPair rc={rc} x={94} y={130} w={16} h={18} />
        <PocketPair rc={rc} x={86} y={hem - 64} w={22} h={26} />
        <Line d={`M76 226 Q120 232 164 226`} rc={rc} w={0.9} dash="3 2" />
      </Jacket>
    );
  },
  'hooded-jacket': (rc) => (
    <Jacket rc={rc} s={{ hem: 284, ease: 7, collar: 'hood', closure: 'zip' }}>
      <Line d="M96 214 L90 248" rc={rc} />
      <Line d="M144 214 L150 248" rc={rc} />
    </Jacket>
  ),
  'denim-jacket': (rc) => {
    const stitch = '#C8893A';
    return (
      <Jacket rc={rc} s={{ hem: 262, ease: 5, collar: 'point', closure: 'buttons', gap: 10, edgeTop: 110 }} openExtras={<PocketPair rc={rc} x={92} y={134} w={18} h={18} />}>
        <path d="M80 122 L104 130 L120 122 L136 130 L160 122" fill="none" stroke={stitch} strokeWidth={0.9} strokeDasharray="2 1.5" />
        <PocketPair rc={rc} x={92} y={134} w={18} h={18} />
        <Line d="M80 248 L160 248" rc={rc} w={0.9} color={stitch} dash="2 1.5" />
        <Line d="M104 150 L104 248" rc={rc} w={0.8} color={stitch} dash="2 1.5" />
        <Line d="M136 150 L136 248" rc={rc} w={0.8} color={stitch} dash="2 1.5" />
      </Jacket>
    );
  },
  harrington: (rc) => (
    <Jacket
      rc={rc}
      s={{ hem: 262, ease: 6, cuff: 'rib', collar: 'stand', closure: 'zip', ribHem: true }}
      openExtras={
        <g>
          <path d="M108 90 L104 112 L114 100 Z" fill="#9B3B32" />
          <path d="M132 90 L136 112 L126 100 Z" fill="#9B3B32" />
          <path d="M108 90 L104 112" stroke="#E2C86A" strokeWidth={0.8} />
        </g>
      }
    >
      <Line d="M78 124 Q100 130 120 124 Q140 130 162 124" rc={rc} w={0.9} />
      <Line d="M92 216 L104 226" rc={rc} w={1.4} />
      <Line d="M148 216 L136 226" rc={rc} w={1.4} />
    </Jacket>
  ),
  'quilted-jacket': (rc) => (
    <g>
      <Jacket rc={rc} s={{ hem: 278, ease: 6, collar: 'stand', closure: 'buttons' }} />
      {!rc.open && <Quilting rc={rc} hem={278} ease={6} diamond />}
    </g>
  ),
  'down-jacket': (rc) => {
    const hem = len(rc, 270, 330, 392);
    return (
      <g>
        <Jacket rc={rc} s={{ hem, ease: 15, loose: 6, cuff: 'rib', collar: hoodAttr(rc, 'tall-stand'), closure: 'zip' }} />
        {!rc.open && <Quilting rc={rc} hem={hem} ease={15} />}
      </g>
    );
  },
  'fleece-jacket': (rc) => (
    <Jacket rc={rc} s={{ hem: 272, ease: 7, collar: 'stand', closure: 'zip' }}>
      <path d="M78 102 L106 94 L104 120 L80 126 Z" fill={rc.secondary} opacity={0.9} stroke={rc.outline} strokeWidth={0.8} />
      <path d="M162 102 L134 94 L136 120 L160 126 Z" fill={rc.secondary} opacity={0.9} stroke={rc.outline} strokeWidth={0.8} />
      <rect x={130} y={136} width={16} height={18} rx={2} fill={rc.secondary} opacity={0.9} />
    </Jacket>
  ),
  softshell: (rc) => (
    <Jacket rc={rc} s={{ hem: 276, ease: 6, collar: hoodAttr(rc, 'tall-stand'), closure: 'zip' }}>
      <Line d="M82 150 Q100 140 116 116" rc={rc} w={0.9} />
      <Line d="M158 150 Q140 140 124 116" rc={rc} w={0.9} />
      <Line d="M130 132 L146 146" rc={rc} w={1.4} />
    </Jacket>
  ),
  'rain-jacket': (rc) => {
    const hem = len(rc, 284, 320, 372);
    return (
      <Jacket rc={rc} s={{ hem, ease: 9, flare: 3, collar: hoodAttr(rc, 'tall-stand'), closure: 'storm' }}>
        <PocketPair rc={rc} x={88} y={hem - 66} w={20} h={18} />
        <Line d={`M80 ${hem - 4} Q120 ${hem + 2} 160 ${hem - 4}`} rc={rc} dash="3 2" />
      </Jacket>
    );
  },
  windbreaker: (rc) => (
    <g>
      <Jacket rc={rc} s={{ hem: 272, ease: 9, loose: 4, cuff: 'rib', collar: 'stand', closure: 'none' }}>
        <path d="M78 132 L162 132 L163 160 L77 160 Z" fill={rc.secondary} opacity={0.95} stroke={rc.outline} strokeWidth={0.8} />
        <Zip rc={rc} from={84} to={132} />
        <path d="M100 210 L140 210 L146 250 L94 250 Z" fill="none" stroke={rc.detail} strokeWidth={1} />
      </Jacket>
    </g>
  ),
  trenchcoat: (rc) => {
    const hem = len(rc, 330, 380, 416);
    return (
      <Jacket rc={rc} s={{ hem, ease: 7, flare: 12, collar: 'wide-notch', closure: 'double', gap: 18, edgeTop: 176 }} openExtras={<rect x={74} y={222} width={14} height={9} fill={rc.fill} stroke={rc.detail} strokeWidth={0.8} />}>
        <rect x={74} y={222} width={92} height={10} fill={rc.fill} stroke={rc.detail} strokeWidth={0.9} />
        <rect x={115} y={220} width={10} height={14} fill="none" stroke={rc.detail} strokeWidth={1.3} />
        <path d="M72 100 L94 96 L96 104 L74 108 Z" fill={rc.fill} stroke={rc.detail} strokeWidth={0.8} />
        <path d="M168 100 L146 96 L144 104 L166 108 Z" fill={rc.fill} stroke={rc.detail} strokeWidth={0.8} />
        <path d="M124 104 L150 110 L152 146 L128 140 Z" fill={rc.fill} stroke={rc.detail} strokeWidth={0.8} />
        <Line d="M90 262 L96 290" rc={rc} w={1.2} />
        <Line d="M150 262 L144 290" rc={rc} w={1.2} />
      </Jacket>
    );
  },
  'wool-coat': (rc) => {
    const hem = len(rc, 300, 352, 398);
    return (
      <Jacket rc={rc} s={{ hem, ease: 6, flare: 6, collar: 'notch', closure: 'buttons' }}>
        <rect x={86} y={268} width={22} height={5} fill={rc.fill} stroke={rc.detail} strokeWidth={0.8} />
        <rect x={132} y={268} width={22} height={5} fill={rc.fill} stroke={rc.detail} strokeWidth={0.8} />
        <Line d="M134 134 L148 134" rc={rc} w={1.2} />
      </Jacket>
    );
  },
  'transition-jacket': (rc) => (
    <Jacket rc={rc} s={{ hem: 282, ease: 6, collar: hoodAttr(rc, 'stand'), closure: rc.attrs.closure === 'buttons' ? 'buttons' : 'zip' }}>
      <Line d="M94 218 L98 244" rc={rc} w={1.3} />
      <Line d="M146 218 L142 244" rc={rc} w={1.3} />
    </Jacket>
  ),
  'winter-coat': (rc) => {
    const hem = len(rc, 300, 350, 392);
    return (
      <Jacket rc={rc} s={{ hem, ease: 10, flare: 6, collar: hoodAttr(rc, 'tall-stand', true), closure: 'storm' }}>
        <PocketPair rc={rc} x={86} y={240} w={22} h={24} />
      </Jacket>
    );
  },
  blazer: (rc) => (
    <Jacket rc={rc} s={{ hem: 292, ease: 4, collar: 'notch', closure: 'buttons', gap: 16, edgeTop: 172 }}>
      <Line d="M132 134 L146 132" rc={rc} w={1.4} />
      <rect x={88} y={246} width={20} height={4} fill={rc.fill} stroke={rc.detail} strokeWidth={0.8} />
      <rect x={132} y={246} width={20} height={4} fill={rc.fill} stroke={rc.detail} strokeWidth={0.8} />
    </Jacket>
  ),
  'sport-coat': (rc) => (
    <Jacket rc={rc} s={{ hem: 292, ease: 5, collar: 'notch', closure: 'buttons', gap: 16, edgeTop: 172 }}>
      <rect x={130} y={128} width={16} height={12} rx={3} fill="none" stroke={rc.detail} strokeWidth={0.9} />
      <rect x={86} y={238} width={22} height={26} rx={4} fill="none" stroke={rc.detail} strokeWidth={0.9} />
      <rect x={132} y={238} width={22} height={26} rx={4} fill="none" stroke={rc.detail} strokeWidth={0.9} />
    </Jacket>
  ),
  vest: (rc) => (
    <g>
      <Shape d="M106 90 L94 96 Q92 130 84 150 L86 228 L84 262 L112 272 L120 278 L128 272 L156 262 L154 228 L156 150 Q148 130 146 96 L134 90 L120 160 Z" rc={rc} />
      <Buttons rc={rc} ys={[172, 192, 212, 232, 252]} />
      <Line d="M92 236 L106 234" rc={rc} w={1.2} />
      <Line d="M148 236 L134 234" rc={rc} w={1.2} />
    </g>
  ),
  suit: (rc) => OUTER.blazer(rc),
};

/* ---------------- Unterteile ---------------- */

function Waistband({ rc, loops = true, top = BODY.waistY }: { rc: RenderCtx; loops?: boolean; top?: number }) {
  return (
    <g>
      <path d={`M84 ${top} L156 ${top} L156 ${top + 9} L84 ${top + 9} Z`} fill={rc.fill} stroke={rc.outline} strokeWidth={0.9} />
      {loops && [92, 108, 132, 148].map((x) => <rect key={x} x={x} y={top} width={2.5} height={11} fill={rc.fill} stroke={rc.detail} strokeWidth={0.6} />)}
    </g>
  );
}

function Pants({ rc, legs, children, band = true }: { rc: RenderCtx; legs: Parameters<typeof legsPath>[0]; children?: ReactNode; band?: boolean }) {
  return (
    <g>
      <Shape d={legsPath(legs)} rc={rc} />
      {band && <Waistband rc={rc} />}
      {children}
    </g>
  );
}

const BOTTOMS: Record<string, Renderer> = {
  jeans: (rc) => {
    const st = '#C8893A';
    return (
      <Pants rc={rc} legs={{ hem: BODY.ankleY, outerHem: 87, innerHem: 110 }}>
        <path d="M86 274 Q100 276 102 290" fill="none" stroke={st} strokeWidth={0.9} strokeDasharray="2 1.5" />
        <path d="M154 274 Q140 276 138 290" fill="none" stroke={st} strokeWidth={0.9} strokeDasharray="2 1.5" />
        <path d="M124 272 L124 296 Q122 302 118 302" fill="none" stroke={st} strokeWidth={0.9} strokeDasharray="2 1.5" />
        <Line d="M95 466 L109 466" rc={rc} color={st} dash="2 1.5" w={0.8} />
        <Line d="M131 466 L145 466" rc={rc} color={st} dash="2 1.5" w={0.8} />
        <Dot x={100} y={279} rc={rc} r={1} color="#B8A27A" />
        <Dot x={140} y={279} rc={rc} r={1} color="#B8A27A" />
      </Pants>
    );
  },
  chino: (rc) => (
    <Pants rc={rc} legs={{ hem: BODY.ankleY, outerHem: 90, innerHem: 109 }}>
      <Line d="M88 274 L98 296" rc={rc} />
      <Line d="M152 274 L142 296" rc={rc} />
      <Line d="M121 272 L121 298" rc={rc} w={0.8} />
      <Line d="M90 462 L109 462" rc={rc} w={0.8} />
      <Line d="M131 462 L150 462" rc={rc} w={0.8} />
    </Pants>
  ),
  trousers: (rc) => (
    <Pants rc={rc} legs={{ hem: BODY.ankleY, outerHem: 86, innerHem: 112 }}>
      <Line d="M88 274 L97 294" rc={rc} />
      <Line d="M152 274 L143 294" rc={rc} />
      <Line d="M100 296 L99 468" rc={rc} w={0.7} />
      <Line d="M140 296 L141 468" rc={rc} w={0.7} />
    </Pants>
  ),
  cargo: (rc) => (
    <Pants rc={rc} legs={{ hem: BODY.ankleY, outerHem: 83, innerHem: 113, ease: 4 }}>
      <PocketPair rc={rc} x={74} y={330} w={20} h={34} />
      <Line d="M86 274 L96 294" rc={rc} />
      <Line d="M154 274 L144 294" rc={rc} />
    </Pants>
  ),
  corduroy: (rc) => {
    const wales: ReactNode[] = [];
    for (let x = 78; x < 162; x += 3.2) wales.push(<line key={x} x1={x} y1={272} x2={x} y2={470} stroke={rc.detail} strokeWidth={0.6} opacity={0.45} />);
    return (
      <g>
        <clipPath id="cord-clip">
          <path d={legsPath({ hem: BODY.ankleY, outerHem: 87, innerHem: 111 })} />
        </clipPath>
        <Pants rc={rc} legs={{ hem: BODY.ankleY, outerHem: 87, innerHem: 111 }}>
          <g clipPath="url(#cord-clip)">{wales}</g>
          <Line d="M88 274 L98 296" rc={rc} />
          <Line d="M152 274 L142 296" rc={rc} />
        </Pants>
      </g>
    );
  },
  joggers: (rc) => (
    <g>
      <Shape d={legsPath({ hem: BODY.ankleY, outerHem: 93, innerHem: 108, ease: 3 })} rc={rc} />
      <Rib d="M84 258 L156 258 L156 272 L84 272 Z" rc={rc} x1={84} x2={156} y1={259} y2={271} />
      <Rib d="M92 456 L109 456 L108 470 L93 470 Z" rc={rc} x1={92} x2={109} y1={457} y2={470} />
      <Rib d="M148 456 L131 456 L132 470 L147 470 Z" rc={rc} x1={131} x2={148} y1={457} y2={470} />
      <Line d="M116 270 L112 290" rc={rc} w={1} />
      <Line d="M124 270 L128 290" rc={rc} w={1} />
    </g>
  ),
  shorts: (rc) => (
    <Pants rc={rc} legs={{ hem: 362, outerHem: 80, innerHem: 114, ease: 2 }}>
      <Line d="M80 354 L114 354" rc={rc} w={0.8} />
      <Line d="M126 354 L160 354" rc={rc} w={0.8} />
      <Line d="M88 274 L98 294" rc={rc} />
      <Line d="M152 274 L142 294" rc={rc} />
    </Pants>
  ),
  skirt: (rc) => (
    <g>
      <Shape d="M84 262 L156 262 L172 372 Q120 382 68 372 Z" rc={rc} />
      <Waistband rc={rc} loops={false} />
      <Line d="M104 274 L98 372" rc={rc} w={0.6} />
      <Line d="M136 274 L142 372" rc={rc} w={0.6} />
    </g>
  ),
  'suit-trousers': (rc) => BOTTOMS.trousers(rc),
};

/* ---------------- Einteiler ---------------- */

const ONEPIECE: Record<string, Renderer> = {
  dress: (rc) => (
    <g>
      <Sleeves rc={rc} len={0.28} ease={1} loose={2} />
      <Shape d="M108 90 Q90 96 76 102 Q72 112 82 148 L86 226 L64 386 Q120 396 176 386 L154 226 L158 148 Q168 112 164 102 Q150 96 132 90 Q120 112 108 90 Z" rc={rc} />
      <Line d="M86 228 Q120 236 154 228" rc={rc} />
      <Line d="M104 240 L94 384" rc={rc} w={0.6} />
      <Line d="M136 240 L146 384" rc={rc} w={0.6} />
    </g>
  ),
  overall: (rc) => (
    <g>
      <Shape d={legsPath({ hem: BODY.ankleY, outerHem: 86, innerHem: 111, ease: 2, waist: 250 })} rc={rc} />
      <Shape d="M98 168 L142 168 L144 256 L96 256 Z" rc={rc} />
      <Shape d="M98 168 L88 104 L96 102 L104 168 Z" rc={rc} />
      <Shape d="M142 168 L152 104 L144 102 L136 168 Z" rc={rc} />
      <Dot x={102} y={174} rc={rc} r={2.2} color="#B9B4AA" />
      <Dot x={138} y={174} rc={rc} r={2.2} color="#B9B4AA" />
      <rect x={108} y={182} width={24} height={20} rx={2} fill="none" stroke={rc.detail} strokeWidth={0.9} />
    </g>
  ),
};

/* ---------------- Schuhe (Seitenansicht, nach außen zeigend) ---------------- */

function ShoePair({ rc, upper, sole, extras, soleColor }: { rc: RenderCtx; upper: string; sole: string; extras?: (side: 'l' | 'r') => ReactNode; soleColor?: string }) {
  const sc = soleColor ?? rc.secondary;
  return (
    <g>
      {(['l', 'r'] as const).map((side) => (
        <g key={side} transform={side === 'r' ? `translate(${240} 0) scale(-1 1)` : undefined}>
          <Shape d={upper} rc={rc} />
          <path d={sole} fill={sc} stroke={rc.outline} strokeWidth={0.8} />
          {extras?.(side)}
        </g>
      ))}
    </g>
  );
}

const SHOES: Record<string, Renderer> = {
  sneaker: (rc) => (
    <ShoePair
      rc={rc}
      soleColor={rc.secondary === rc.detail ? '#F1EEE7' : rc.secondary}
      upper="M110 494 L110 482 Q110 474 102 474 L95 476 Q84 481 74 486 Q64 490 64 494 Z"
      sole="M63 493 L112 493 L112 500 L64 500 Q62 497 63 493 Z"
      extras={() => (
        <g>
          <Line d="M92 478 L86 484 M96 477 L90 483 M100 476 L94 482" rc={rc} w={0.9} />
          <Line d="M72 488 Q76 486 78 492" rc={rc} w={0.8} />
        </g>
      )}
    />
  ),
  boots: (rc) => (
    <ShoePair
      rc={rc}
      soleColor="#2A2522"
      upper="M110 493 L111 452 L93 452 L91 474 Q80 479 71 485 Q64 489 64 493 Z"
      sole="M62 492 L113 492 L113 501 L63 501 Q61 497 62 492 Z"
      extras={() => (
        <g>
          <Line d="M93 458 L99 462 M93 464 L99 468 M93 470 L98 474" rc={rc} w={0.9} />
          <rect x={108} y={448} width={3} height={8} fill={rc.detail} />
        </g>
      )}
    />
  ),
  chelsea: (rc) => (
    <ShoePair
      rc={rc}
      soleColor="#2A2522"
      upper="M110 494 L111 454 L94 454 Q92 470 86 478 Q76 484 68 488 Q62 491 63 494 Z"
      sole="M62 493 L112 493 L112 500 L102 500 L100 497 L64 497 Q61 496 62 493 Z"
      extras={() => (
        <g>
          <path d="M104 456 L110 456 L109 482 Q106 470 104 456 Z" fill={rc.detail} opacity={0.8} />
          <rect x={107} y={448} width={3.5} height={8} rx={1} fill={rc.detail} />
        </g>
      )}
    />
  ),
  derby: (rc) => (
    <ShoePair
      rc={rc}
      soleColor="#2A2522"
      upper="M110 495 L110 486 Q108 480 100 481 Q88 483 76 489 Q64 494 63 497 Z"
      sole="M62 496 L111 495 L111 501 L101 501 L100 499 L64 499 Q61 498 62 496 Z"
      extras={() => (
        <g>
          <Line d="M96 482 L90 486 M99 482 L93 486" rc={rc} w={0.8} />
          <path d="M78 488 Q72 492 70 494" fill="none" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1.4} />
        </g>
      )}
    />
  ),
  loafer: (rc) => (
    <ShoePair
      rc={rc}
      soleColor="#2A2522"
      upper="M110 495 L110 488 Q106 484 98 486 Q86 486 76 490 Q64 494 63 497 Z"
      sole="M62 496 L111 495 L111 501 L101 501 L100 499 L64 499 Q61 498 62 496 Z"
      extras={() => <Line d="M84 488 L94 486" rc={rc} w={1.6} />}
    />
  ),
  sandals: (rc) => (
    <g>
      {(['l', 'r'] as const).map((side) => (
        <g key={side} transform={side === 'r' ? 'translate(240 0) scale(-1 1)' : undefined}>
          <path d="M108 494 L108 480 Q104 476 98 478 Q86 482 74 488 Q66 492 66 494 Z" fill={rc.skin} />
          <path d="M63 494 L112 494 L112 500 L64 500 Z" fill={rc.secondary} stroke={rc.outline} strokeWidth={0.8} />
          <path d="M80 494 L88 484 L94 494" fill="none" stroke={rc.main} strokeWidth={3} />
          <path d="M98 494 L104 478" fill="none" stroke={rc.main} strokeWidth={3} />
        </g>
      ))}
    </g>
  ),
  'shoe-generic': (rc) => (
    <ShoePair rc={rc} upper="M110 495 L110 484 Q108 478 100 479 Q88 482 76 488 Q64 493 63 496 Z" sole="M62 495 L111 494 L111 501 L64 501 Q61 498 62 495 Z" />
  ),
};

/* ---------------- Accessoires ---------------- */

const ACCESSORIES: Record<string, Renderer> = {
  scarf: (rc) => (
    <g>
      <Shape d="M106 112 L101 206 L119 208 L123 114 Z" rc={rc} />
      <Shape d="M100 84 Q120 100 140 84 L144 100 Q120 120 96 100 Z" rc={rc} />
      <Shape d="M122 108 L127 196 L143 192 L136 100 Z" rc={rc} />
      <Line d="M102 206 L102 212 M106 207 L106 213 M110 207 L110 213 M114 208 L114 214 M118 208 L118 214" rc={rc} w={0.8} />
    </g>
  ),
  neckerchief: (rc) => (
    <g>
      <Shape d="M104 88 Q120 100 136 88 L130 102 L120 124 L110 102 Z" rc={rc} />
      <circle cx={120} cy={101} r={4} fill={rc.fill} stroke={rc.outline} strokeWidth={0.8} />
    </g>
  ),
  beanie: (rc) => (
    <g>
      <Shape d="M97 40 Q97 12 120 11 Q143 12 143 40 Z" rc={rc} />
      <Rib d="M95 34 L145 34 L145 45 Q120 48 95 45 Z" rc={rc} x1={95} x2={145} y1={35} y2={46} />
    </g>
  ),
  cap: (rc) => (
    <g>
      <Shape d="M98 38 Q98 15 120 14 Q142 15 142 38 Z" rc={rc} />
      <Shape d="M96 37 Q120 44 150 34 Q155 41 142 45 Q118 51 96 42 Z" rc={rc} />
      <circle cx={120} cy={15} r={2} fill={rc.detail} />
      <Line d="M120 15 L120 38" rc={rc} w={0.7} />
    </g>
  ),
  belt: (rc) => (
    <g>
      <rect x={83} y={262} width={74} height={8} fill={rc.fill} stroke={rc.outline} strokeWidth={0.8} />
      <rect x={114} y={260} width={12} height={12} rx={1.5} fill="none" stroke={rc.secondary === rc.detail ? '#C9A44C' : rc.secondary} strokeWidth={2} />
    </g>
  ),
  bag: (rc) => (
    <g>
      <path d="M80 104 L152 254" stroke={rc.detail} strokeWidth={4} strokeLinecap="round" />
      <Shape d="M144 250 L184 250 Q187 250 187 254 L187 292 Q187 296 183 296 L148 296 Q144 296 144 292 Z" rc={rc} />
      <path d="M144 252 L187 252 L187 268 Q165 274 144 268 Z" fill={rc.fill} stroke={rc.detail} strokeWidth={0.8} />
    </g>
  ),
  jewelry: (rc) => (
    <g>
      <path d="M108 90 Q120 116 132 90" fill="none" stroke={rc.main} strokeWidth={1.4} />
      <circle cx={120} cy={110} r={2.6} fill={rc.main} stroke={rc.outline} strokeWidth={0.5} />
    </g>
  ),
  watch: (rc) => (
    <g>
      <path d="M51 242 L68 243 L68 253 L50 252 Z" fill={rc.secondary} stroke={rc.outline} strokeWidth={0.7} />
      <circle cx={59} cy={247.5} r={5} fill={rc.main} stroke={rc.outline} strokeWidth={1} />
      <circle cx={59} cy={247.5} r={3.4} fill="#F4F2EE" />
    </g>
  ),
  glasses: (rc) => (
    <g fill="none" stroke={rc.main} strokeWidth={2}>
      <rect x={103} y={40} width={14} height={10} rx={4} />
      <rect x={123} y={40} width={14} height={10} rx={4} />
      <path d="M117 44 Q120 42 123 44 M103 44 L98 42 M137 44 L142 42" />
    </g>
  ),
  gloves: (rc) => (
    <g>
      {[58, 182].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={274} rx={9} ry={14} fill={rc.fill} stroke={rc.outline} strokeWidth={0.8} />
          <rect x={cx - 9} y={256} width={18} height={6} rx={2} fill={rc.fill} stroke={rc.detail} strokeWidth={0.8} />
        </g>
      ))}
    </g>
  ),
};

export const RENDERERS: Record<string, Renderer> = { ...TOPS, ...KNIT, ...OUTER, ...BOTTOMS, ...ONEPIECE, ...SHOES, ...ACCESSORIES };

/** Ungefähre Saumhöhe (für die Thumbnail-viewBox). */
export function hemOf(silhouette: string, attrs: Record<string, string>): number {
  const l = (s: number, r: number, lo: number) => (attrs.length === 'short' ? s : attrs.length === 'long' ? lo : r);
  switch (silhouette) {
    case 'parka':
      return l(300, 346, 394);
    case 'down-jacket':
      return l(270, 330, 392);
    case 'rain-jacket':
      return l(284, 320, 372);
    case 'trenchcoat':
      return l(330, 380, 416);
    case 'wool-coat':
      return l(300, 352, 398);
    case 'winter-coat':
      return l(300, 350, 392);
    case 'blazer':
    case 'sport-coat':
    case 'suit':
      return 292;
    case 'tee-oversized':
    case 'overshirt':
      return 288;
    default:
      return 284;
  }
}

/** Zuschnitt für Vorschaubilder: [x, y, Breite, Höhe]. */
export function thumbBox(silhouette: string, slot: string, attrs: Record<string, string>): [number, number, number, number] {
  switch (slot) {
    case 'bottom':
      if (silhouette === 'shorts') return [56, 250, 128, 124];
      if (silhouette === 'skirt') return [56, 250, 128, 140];
      return [58, 250, 124, 226];
    case 'shoes':
      return [56, 444, 62, 62];
    case 'scarf':
      return silhouette === 'neckerchief' ? [96, 80, 48, 50] : [86, 72, 68, 148];
    case 'headwear':
      return [88, 4, 66, 52];
    case 'onepiece':
      return silhouette === 'overall' ? [52, 96, 136, 380] : [44, 70, 152, 330];
    case 'accessory':
      switch (silhouette) {
        case 'belt':
          return [78, 250, 84, 32];
        case 'bag':
          return [70, 96, 124, 206];
        case 'jewelry':
          return [100, 84, 40, 36];
        case 'watch':
          return [44, 234, 30, 28];
        case 'glasses':
          return [94, 30, 52, 28];
        case 'gloves':
          return [40, 248, 160, 44];
        default:
          return [40, 60, 160, 240];
      }
    default: {
      const hem = hemOf(silhouette, attrs);
      const top = 50;
      const h = Math.max(hem + 14 - top, 230);
      const w = h * 0.78;
      return [CX - w / 2, top, w, h];
    }
  }
}
