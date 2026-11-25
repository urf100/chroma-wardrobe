/**
 * Schematische Figur mit geschichteten Kleidungsstücken.
 * Keine fotorealistische Anprobe, sondern eine Farbvisualisierung.
 */
import { forwardRef, useId, type ReactNode } from 'react';
import type { GarmentColor, GarmentPattern, OutfitDisplayOptions, OutfitSlot, OutfitSlotValue } from '@/domain/types';
import { DEFAULT_CATALOG, SLOT_ORDER, type Catalog } from '@/domain/garments/catalog';
import { detailColor } from '@/domain/color/convert';
import { PatternDef, patternColors } from './patterns';
import { RENDERERS, thumbBox, type RenderCtx } from './garments';
import { H, W } from './geometry';

export const MANNEQUIN = '#D9D5CE';
export const MANNEQUIN_SHADE = '#C9C4BC';

const OPENABLE = new Set(['outer', 'knit', 'overshirt']);

export interface GarmentLayerProps {
  silhouette: string;
  colors: GarmentColor[];
  pattern: GarmentPattern;
  attributes?: Record<string, string>;
  open?: boolean;
  skin?: string;
  shadeId: string;
}

export function GarmentLayer({ silhouette, colors, pattern, attributes = {}, open = false, skin = MANNEQUIN, shadeId }: GarmentLayerProps) {
  const uid = useId().replace(/:/g, '');
  const pc = patternColors(colors);
  const patId = `pat-${uid}`;
  const hasPattern = pattern.type !== 'solid' && colors.length > 0;
  const render = RENDERERS[silhouette] ?? RENDERERS.tee;
  const rc: RenderCtx = {
    fill: hasPattern ? `url(#${patId})` : pc.main,
    main: pc.main,
    secondary: pc.secondary,
    accent: pc.accent,
    outline: detailColor(pc.main, 0.2),
    detail: detailColor(pc.main, 0.13),
    shade: `url(#${shadeId})`,
    attrs: attributes,
    open,
    pattern: pattern.type,
    skin,
  };
  return (
    <g data-silhouette={silhouette}>
      {hasPattern && (
        <defs>
          <PatternDef id={patId} type={pattern.type} pc={pc} />
        </defs>
      )}
      {render(rc)}
    </g>
  );
}

export function ShadeDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.16" />
        <stop offset="0.22" stopColor="#000" stopOpacity="0" />
        <stop offset="0.78" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.16" />
      </linearGradient>
    </defs>
  );
}

export interface FigureAppearance {
  skin?: string;
  hair?: string;
  beard?: string;
  hasBeard?: boolean;
}

export interface FigureProps {
  slots: Partial<Record<OutfitSlot, OutfitSlotValue>>;
  options: OutfitDisplayOptions;
  appearance?: FigureAppearance;
  catalog?: Catalog;
  title?: string;
  className?: string;
  background?: string;
}

function Body({ skin }: { skin: string }) {
  const shade = skin === MANNEQUIN ? MANNEQUIN_SHADE : detailColor(skin, 0.06);
  return (
    <g>
      {/* Beine */}
      <path d="M84 262 L82 300 L86 400 L89 472 L108 472 L111 400 L116 320 L120 304 L124 320 L129 400 L132 472 L151 472 L154 400 L158 300 L156 262 Z" fill={skin} />
      <ellipse cx={99} cy={492} rx={14} ry={7} fill={shade} />
      <ellipse cx={141} cy={492} rx={14} ry={7} fill={shade} />
      {/* Arme */}
      <path d="M76 102 L64 110 L58 150 L52 210 L50 258 L67 260 L70 210 L78 154 L82 146 Z" fill={skin} />
      <path d="M164 102 L176 110 L182 150 L188 210 L190 258 L173 260 L170 210 L162 154 L158 146 Z" fill={skin} />
      <ellipse cx={58} cy={274} rx={8.5} ry={13} fill={skin} />
      <ellipse cx={182} cy={274} rx={8.5} ry={13} fill={skin} />
      {/* Rumpf */}
      <path d="M108 90 L76 102 L82 148 L86 228 L82 268 L158 268 L154 228 L158 148 L164 102 L132 90 Z" fill={skin} />
      {/* Hals und Kopf */}
      <path d="M110 66 L110 96 L130 96 L130 66 Z" fill={shade} />
      <ellipse cx={120} cy={47} rx={22} ry={27} fill={skin} />
    </g>
  );
}

function Hair({ color }: { color: string }) {
  return <path d="M97 46 Q94 16 120 16 Q146 16 143 46 Q141 30 130 27 Q120 34 104 29 Q99 34 97 46 Z" fill={color} />;
}

function Beard({ color }: { color: string }) {
  return (
    <path
      d="M98 46 Q99 70 112 76 Q120 80 128 76 Q141 70 142 46 Q139 58 133 62 Q127 58 120 59 Q113 58 107 62 Q101 58 98 46 Z M113 66 Q120 69 127 66 Q120 64 113 66 Z"
      fill={color}
      fillRule="evenodd"
    />
  );
}

export const OutfitFigure = forwardRef<SVGSVGElement, FigureProps>(function OutfitFigure(
  { slots, options, appearance = {}, catalog = DEFAULT_CATALOG, title = 'Outfit-Vorschau', className, background },
  ref,
) {
  const shadeId = `shade-${useId().replace(/:/g, '')}`;
  const skin = options.showSkin && appearance.skin ? appearance.skin : MANNEQUIN;
  const sil = (v: OutfitSlotValue) => catalog.subcategories.get(v.subcategory)?.silhouette ?? 'tee';
  const visible = (s: OutfitSlot) => slots[s] && !slots[s]!.hidden && slots[s]!.colors.length > 0;
  const onepiece = visible('onepiece') ? slots.onepiece : undefined;

  const layers: ReactNode[] = [];
  for (const slot of SLOT_ORDER) {
    const v = slots[slot];
    if (!v || v.hidden || !v.colors.length) continue;
    if (slot === 'bottom' && onepiece) continue;
    const silhouette = sil(v);
    layers.push(
      <GarmentLayer
        key={slot}
        silhouette={silhouette}
        colors={v.colors}
        pattern={v.pattern}
        attributes={v.attributes}
        open={OPENABLE.has(slot) && options.jacketOpen}
        skin={skin}
        shadeId={shadeId}
      />,
    );
  }
  // Anzug: passende Hose, wenn kein eigenes Unterteil gewählt ist
  const outer = slots.outer;
  if (outer && !outer.hidden && sil(outer) === 'suit' && !visible('bottom') && !onepiece) {
    const idx = layers.findIndex((l) => (l as { key?: string }).key === 'base');
    const trousers = <GarmentLayer key="suit-trousers" silhouette="suit-trousers" colors={outer.colors} pattern={outer.pattern} shadeId={shadeId} skin={skin} />;
    layers.splice(idx >= 0 ? idx : 0, 0, trousers);
  }

  const headwear = visible('headwear');
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className={className} xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <ShadeDefs id={shadeId} />
      {background && <rect width={W} height={H} fill={background} />}
      <ellipse cx={120} cy={503} rx={70} ry={6} fill="#000" opacity={0.07} />
      <Body skin={skin} />
      {options.showHair && appearance.hair && !headwear && <Hair color={appearance.hair} />}
      {options.showBeard && appearance.hasBeard && appearance.beard && <Beard color={appearance.beard} />}
      {layers}
    </svg>
  );
});

/** Einzelnes Kleidungsstück als Vorschaubild. */
export function GarmentIllustration({
  subcategory,
  colors,
  pattern,
  attributes,
  catalog = DEFAULT_CATALOG,
  open = false,
  className,
  title,
  decorative = false,
}: {
  decorative?: boolean;
  subcategory: string;
  colors: GarmentColor[];
  pattern: GarmentPattern;
  attributes?: Record<string, string>;
  catalog?: Catalog;
  open?: boolean;
  className?: string;
  title?: string;
}) {
  const shadeId = `shade-${useId().replace(/:/g, '')}`;
  const sub = catalog.subcategories.get(subcategory);
  const silhouette = sub?.silhouette ?? 'tee';
  const slot = sub?.slot ?? 'base';
  const [x, y, w, h] = thumbBox(silhouette, slot, attributes ?? {});
  return (
    <svg
      viewBox={`${x} ${y} ${w} ${h}`}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': title ?? sub?.label ?? 'Kleidungsstück' })}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <ShadeDefs id={shadeId} />
      <GarmentLayer silhouette={silhouette} colors={colors} pattern={pattern} attributes={attributes} open={open} shadeId={shadeId} />
    </svg>
  );
}
