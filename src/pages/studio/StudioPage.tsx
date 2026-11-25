/**
 * Outfit-Studio: Kleidungsstücke aus dem Bestand oder freie Farben auf einer
 * schematischen Figur kombinieren, vergleichen, analysieren und speichern.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FilePlus2,
  Palette as PaletteIcon,
  Save,
  Shirt,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type { Garment, GarmentColor, Outfit, OutfitSlot, OutfitSlotValue, PatternType } from '@/domain/types';
import { useAppData } from '@/app/AppData';
import { buildPaletteGroups } from '@/app/paletteGroups';
import { OutfitFigure } from '@/illustrations/Figure';
import { GarmentIllustration } from '@/illustrations/Figure';
import { DEFAULT_SUB_FOR_SLOT, SLOT_LABEL, SLOT_UI_ORDER, defaultAttributes, subcategoriesForSlot } from '@/domain/garments/catalog';
import { slotFromGarment } from '@/domain/garments/outfitSlots';
import { analyzeOutfit } from '@/domain/recommendation/outfitAnalysis';
import { CURATED_EXAMPLES, HARMONY_LABEL } from '@/domain/examples/curated';
import { createOutfit, deriveOutfitKind, garmentColor } from '@/domain/profile/factory';
import { nameColor } from '@/domain/color';
import { ColorChooser } from '@/components/color/ColorPicker';
import { ColorStrip, copyText } from '@/components/color/Swatch';
import { Badge, Button, Chip, PageHeader, Segmented, TextInput, Toggle, cx } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { store } from '@/data/store';
import { createId, nowIso } from '@/domain/id';
import { t } from '@/i18n';
import { downloadBlob, downloadJson, exportOutfitPng } from './exportImage';

const PATTERNS: PatternType[] = ['solid', 'check', 'stripes', 'melange', 'houndstooth', 'herringbone', 'camouflage', 'colorblock', 'print'];


/** Aktualisiert Slots mit den aktuellen Daten verknüpfter Kleidungsstücke. */
function resolveSlots(slots: Outfit['slots'], garments: Garment[]): Outfit['slots'] {
  const out: Outfit['slots'] = {};
  for (const [k, v] of Object.entries(slots) as [OutfitSlot, OutfitSlotValue][]) {
    if (!v) continue;
    const g = v.garmentId ? garments.find((x) => x.id === v.garmentId) : undefined;
    out[k] = g ? { ...slotFromGarment(g), hidden: v.hidden } : { ...v, garmentId: undefined };
  }
  return out;
}

function exampleToSlots(exampleId: string): Outfit['slots'] {
  const ex = CURATED_EXAMPLES.find((e) => e.id === exampleId);
  if (!ex) return {};
  const slots: Outfit['slots'] = {};
  for (const [slot, def] of Object.entries(ex.studio) as [OutfitSlot, { colorIndex: number; subcategory: string }][]) {
    const c = ex.colors[def.colorIndex];
    slots[slot] = { subcategory: def.subcategory, colors: [garmentColor(c.hex, 1, 'main', c.name)], pattern: { type: 'solid' }, attributes: defaultAttributes(def.subcategory) };
  }
  return slots;
}

export default function StudioPage() {
  const { profile, garments, outfits, catalog, season } = useAppData();
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const [outfitA, setOutfitA] = useState<Outfit | null>(null);
  const [outfitB, setOutfitB] = useState<Outfit | null>(null);
  const [side, setSide] = useState<'A' | 'B'>('A');
  const [panel, setPanel] = useState<'parts' | 'analysis' | 'saved' | 'examples'>('parts');
  const [picker, setPicker] = useState<{ slot: OutfitSlot; mode: 'wardrobe' | 'color' } | null>(null);
  const svgA = useRef<SVGSVGElement>(null);
  const svgB = useRef<SVGSVGElement>(null);

  // Initialisierung über URL-Parameter
  useEffect(() => {
    if (!profile || outfitA) return;
    const base = createOutfit(profile.id, { name: 'Neues Outfit' });
    const gid = params.get('garment');
    const oid = params.get('outfit');
    const ex = params.get('example');
    const colors = params.get('colors');
    if (oid) {
      const o = outfits.find((x) => x.id === oid);
      if (o) return setOutfitA(structuredClone(o));
    }
    const ids = params.get('ids');
    if (ids) {
      const slots: Outfit['slots'] = {};
      for (const id of ids.split(',')) {
        const g = garments.find((x) => x.id === id);
        if (g) slots[catalog.subcategories.get(g.subcategory)?.slot ?? 'base'] = slotFromGarment(g);
      }
      const bottomHex = params.get('bottom');
      if (bottomHex && /^[0-9a-f]{6}$/i.test(bottomHex) && !slots.bottom) slots.bottom = { subcategory: 'chino', colors: [garmentColor(`#${bottomHex.toUpperCase()}`)], pattern: { type: 'solid' } };
      return setOutfitA({ ...base, name: params.get('name') ?? 'Vorgeschlagenes Outfit', slots });
    }
    if (gid) {
      const g = garments.find((x) => x.id === gid);
      if (g) {
        const slot = catalog.subcategories.get(g.subcategory)?.slot ?? 'base';
        return setOutfitA({ ...base, name: `Outfit mit ${g.name}`, slots: { [slot]: slotFromGarment(g) } });
      }
    }
    if (ex) {
      const e = CURATED_EXAMPLES.find((x) => x.id === ex);
      if (e) return setOutfitA({ ...base, name: e.title, sourceExampleId: e.id, slots: exampleToSlots(e.id) });
    }
    if (colors) {
      const hexes = colors.split(',').filter((h) => /^[0-9a-f]{6}$/i.test(h)).map((h) => `#${h.toUpperCase()}`);
      const order: OutfitSlot[] = ['base', 'bottom', 'outer', 'shoes'];
      const slots: Outfit['slots'] = {};
      hexes.slice(0, 4).forEach((h, i) => (slots[order[i]] = { subcategory: DEFAULT_SUB_FOR_SLOT[order[i]], colors: [garmentColor(h)], pattern: { type: 'solid' } }));
      return setOutfitA({ ...base, name: 'Farbexperiment', slots });
    }
    // Standard: Startkombination aus dem Kleiderschrank oder neutrale Farben
    const owned = garments.filter((g) => g.ownership === 'owned');
    const firstOf = (slot: OutfitSlot) => owned.find((g) => catalog.subcategories.get(g.subcategory)?.slot === slot);
    const slots: Outfit['slots'] = {};
    for (const s of ['base', 'outer'] as OutfitSlot[]) {
      const g = firstOf(s);
      if (g) slots[s] = slotFromGarment(g);
    }
    if (!slots.base) slots.base = { subcategory: 'tshirt', colors: [garmentColor('#35483C')], pattern: { type: 'solid' } };
    slots.bottom = firstOf('bottom') ? slotFromGarment(firstOf('bottom')!) : { subcategory: 'chino', colors: [garmentColor('#CBB99C', 1, 'main', 'Sandbeige')], pattern: { type: 'solid' } };
    slots.shoes = firstOf('shoes') ? slotFromGarment(firstOf('shoes')!) : { subcategory: 'sneaker', colors: [garmentColor('#F3EAD7', 1, 'main', 'Cremeweiß')], pattern: { type: 'solid' } };
    setOutfitA({ ...base, slots });
  }, [profile, garments, outfits, catalog, params, outfitA]);

  const current = side === 'A' ? outfitA : outfitB;
  const setCurrent = (fn: (o: Outfit) => Outfit) => (side === 'A' ? setOutfitA((o) => (o ? fn(o) : o)) : setOutfitB((o) => (o ? fn(o) : o)));

  const resolvedA = useMemo(() => (outfitA ? resolveSlots(outfitA.slots, garments) : {}), [outfitA, garments]);
  const resolvedB = useMemo(() => (outfitB ? resolveSlots(outfitB.slots, garments) : {}), [outfitB, garments]);
  const resolved = side === 'A' ? resolvedA : resolvedB;
  const analysis = useMemo(
    () => (current ? analyzeOutfit(resolved, current.options, { season, personalContrast: profile?.appearance.contrast }) : null),
    [current, resolved, season, profile],
  );
  const groups = useMemo(() => buildPaletteGroups(profile, season), [profile, season]);

  if (!profile || !outfitA || !current || !analysis) return null;

  const appearance = {
    skin: profile.appearance.skinTone?.hex,
    hair: profile.appearance.hairColor?.hex,
    beard: profile.appearance.beardColor?.hex,
    hasBeard: profile.appearance.hasBeard,
  };
  const kind = deriveOutfitKind({ slots: resolved });
  const isSaved = outfits.some((o) => o.id === current.id);
  const containsPlanned = Object.values(resolved).some((v) => v?.garmentId && garments.find((g) => g.id === v.garmentId)?.ownership !== 'owned');

  const setSlot = (slot: OutfitSlot, value: OutfitSlotValue | undefined) =>
    setCurrent((o) => {
      const slots = { ...o.slots };
      if (value) slots[slot] = value;
      else delete slots[slot];
      return { ...o, slots };
    });

  const save = async (asCopy = false) => {
    const o: Outfit = { ...current, slots: resolved, kind, updatedAt: nowIso(), ...(asCopy ? { id: createId('out'), name: `${current.name} (Kopie)`, createdAt: nowIso(), favorite: false } : {}) };
    await store.outfits.put(o);
    setCurrent(() => o);
    toast.show(asCopy ? 'Outfit dupliziert und gespeichert.' : 'Outfit gespeichert.');
  };

  const exportPng = async () => {
    try {
      const svgs = [svgA.current, outfitB ? svgB.current : null].filter((s): s is SVGSVGElement => !!s);
      const blob = await exportOutfitPng(svgs, current.name, analysis.palette);
      downloadBlob(blob, `${current.name.replace(/[^\p{L}\p{N}-]+/gu, '-').toLowerCase() || 'outfit'}.png`);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Export fehlgeschlagen.', { tone: 'error' });
    }
  };

  const slotForPicker = picker?.slot;
  const pickerGarments = slotForPicker
    ? garments.filter((g) => catalog.subcategories.get(g.subcategory)?.slot === slotForPicker && g.ownership !== 'archived' && g.ownership !== 'sold')
    : [];

  return (
    <div>
      <PageHeader
        eyebrow={t.nav.studio}
        title="Farblabor"
        description="Kombiniere eigene Kleidungsstücke oder experimentiere frei mit Farben. Die Figur ist eine schematische Farbvisualisierung – keine fotorealistische Anprobe."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TextInput aria-label="Name des Outfits" value={current.name} onChange={(e) => setCurrent((o) => ({ ...o, name: e.target.value }))} className="w-full font-medium sm:w-64" />
        <Badge tone={kind === 'wardrobe' ? 'positive' : 'info'}>{kind === 'wardrobe' ? 'Aus deinem Kleiderschrank' : 'Farbexperiment'}</Badge>
        {containsPlanned && <Badge tone="attention">enthält geplante Teile</Badge>}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => save()}>
            <Save className="h-4 w-4" /> {isSaved ? 'Aktualisieren' : 'Speichern'}
          </Button>
          <Button variant="outline" size="icon" aria-label="Als Favorit markieren" aria-pressed={current.favorite} onClick={() => setCurrent((o) => ({ ...o, favorite: !o.favorite }))}>
            <Star className={cx('h-4 w-4', current.favorite && 'fill-current')} />
          </Button>
          <Button variant="outline" onClick={() => save(true)} title="Als neues Outfit speichern">
            <Copy className="h-4 w-4" /> Duplizieren
          </Button>
          <Button variant="outline" onClick={exportPng}>
            <Download className="h-4 w-4" /> Bild
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setOutfitA(createOutfit(profile.id, { slots: {} }));
              setOutfitB(null);
              setSide('A');
              setParams({});
            }}
          >
            <FilePlus2 className="h-4 w-4" /> Neu
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Bühne */}
        <div className="space-y-3">
          <div className={cx('grid gap-3', outfitB && 'grid-cols-2')}>
            {(['A', 'B'] as const)
              .filter((s) => s === 'A' || outfitB)
              .map((s) => {
                const o = s === 'A' ? outfitA : outfitB!;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSide(s)}
                    aria-pressed={side === s}
                    aria-label={`Outfit ${s} bearbeiten`}
                    className={cx('relative flex justify-center rounded-3xl bg-stage p-4 transition-shadow', outfitB && side === s && 'ring-2 ring-ink')}
                  >
                    {outfitB && <span className="absolute top-3 left-3 rounded-full bg-surface px-2 py-0.5 text-xs font-semibold">{s}</span>}
                    <OutfitFigure
                      ref={s === 'A' ? svgA : svgB}
                      slots={s === 'A' ? resolvedA : resolvedB}
                      options={o.options}
                      appearance={appearance}
                      catalog={catalog}
                      title={`Outfit ${o.name}`}
                      className={cx('w-auto', outfitB ? 'h-[min(62vh,520px)]' : 'h-[min(70vh,600px)]')}
                    />
                  </button>
                );
              })}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-2xl border border-line bg-surface px-4 py-2">
            <Toggle checked={current.options.jacketOpen} onChange={(v) => setCurrent((o) => ({ ...o, options: { ...o.options, jacketOpen: v } }))} label="Jacken offen" />
            <Toggle checked={current.options.showSkin} onChange={(v) => setCurrent((o) => ({ ...o, options: { ...o.options, showSkin: v } }))} label="Hautton" />
            <Toggle checked={current.options.showHair} onChange={(v) => setCurrent((o) => ({ ...o, options: { ...o.options, showHair: v } }))} label="Haare" />
            {profile.appearance.hasBeard && (
              <Toggle checked={current.options.showBeard} onChange={(v) => setCurrent((o) => ({ ...o, options: { ...o.options, showBeard: v } }))} label="Bart" />
            )}
          </div>
          {!profile.appearance.skinTone && current.options.showSkin && (
            <p className="text-xs text-muted">Tipp: Hinterlege Haut-, Haar- und Bartfarbe im Profil, um gesichtsnahe Farben realistischer zu beurteilen.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {outfitB ? (
              <>
                <Segmented label="Bearbeitetes Outfit" value={side} onChange={setSide} options={[{ value: 'A', label: 'Outfit A bearbeiten' }, { value: 'B', label: 'Outfit B bearbeiten' }]} />
                <Button variant="ghost" onClick={() => { setOutfitB(null); setSide('A'); }}>
                  <X className="h-4 w-4" /> Vergleich beenden
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setOutfitB({ ...structuredClone(outfitA), id: createId('out'), name: `${outfitA.name} – Variante`, favorite: false });
                  setSide('B');
                }}
              >
                <ArrowLeftRight className="h-4 w-4" /> Zwei Outfits vergleichen
              </Button>
            )}
          </div>

          {/* Palette */}
          <section aria-labelledby="pal-h" className="rounded-2xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="pal-h" className="font-semibold">
                Farbpalette des Outfits
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  if (await copyText(analysis.palette.map((p) => `${p.name} ${p.hex}`).join('\n'))) toast.show('Farbcodes kopiert.');
                }}
              >
                <Copy className="h-4 w-4" /> Alle kopieren
              </Button>
            </div>
            <ColorStrip colors={analysis.palette} height="h-5" className="mb-3" />
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {analysis.palette.map((p) => (
                <li key={p.hex} className="flex items-center gap-2">
                  <span className="h-8 w-8 shrink-0 rounded-lg border border-black/10" style={{ background: p.hex }} aria-hidden />
                  <button
                    type="button"
                    className="min-w-0 text-left"
                    onClick={async () => (await copyText(p.hex)) && toast.show(`${p.hex} kopiert.`)}
                    title="HEX-Code kopieren"
                  >
                    <span className="block truncate text-xs font-medium">{p.name}</span>
                    <span className="block font-mono text-[11px] text-muted">
                      {p.hex} · {Math.round(p.share * 100)} %
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Seitenleiste */}
        <div className="min-w-0">
          <Segmented
            className="mb-4"
            label="Bereich"
            value={panel}
            onChange={setPanel}
            options={[
              { value: 'parts', label: 'Teile' },
              { value: 'analysis', label: 'Analyse' },
              { value: 'examples', label: 'Beispiele' },
              { value: 'saved', label: `Gespeichert (${outfits.length})` },
            ]}
          />

          {panel === 'parts' && (
            <ul className="space-y-2">
              {SLOT_UI_ORDER.map((slot) => {
                const v = resolved[slot];
                const g = v?.garmentId ? garments.find((x) => x.id === v.garmentId) : undefined;
                return (
                  <li key={slot} className={cx('rounded-2xl border bg-surface p-2', v ? 'border-line' : 'border-dashed border-line')}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stage p-1">
                        {v ? (
                          <GarmentIllustration subcategory={v.subcategory} colors={v.colors} pattern={v.pattern} attributes={v.attributes} catalog={catalog} className={cx('h-full w-full', v.hidden && 'opacity-30')} />
                        ) : (
                          <span className="text-lg text-muted" aria-hidden>
                            +
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{SLOT_LABEL[slot]}</p>
                        <p className="truncate text-sm">
                          {v ? (g ? g.name : `${catalog.subcategories.get(v.subcategory)?.label ?? ''} · ${v.colors.map((c) => c.name ?? nameColor(c.hex).name).join(' / ')}`) : 'leer'}
                        </p>
                        {g && g.ownership !== 'owned' && <Badge tone="info">{t.ownership[g.ownership]}</Badge>}
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <Button size="icon" variant="ghost" aria-label={`${SLOT_LABEL[slot]} aus dem Kleiderschrank wählen`} title="Aus dem Kleiderschrank" onClick={() => setPicker({ slot, mode: 'wardrobe' })}>
                          <Shirt className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label={`${SLOT_LABEL[slot]}: Farbe frei wählen`} title="Freie Farbe" onClick={() => setPicker({ slot, mode: 'color' })}>
                          <PaletteIcon className="h-4 w-4" />
                        </Button>
                        {v && (
                          <>
                            <Button size="icon" variant="ghost" aria-label={v.hidden ? 'Einblenden' : 'Ausblenden'} aria-pressed={!!v.hidden} onClick={() => setSlot(slot, { ...v, hidden: !v.hidden })}>
                              {v.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button size="icon" variant="ghost" aria-label={`${SLOT_LABEL[slot]} entfernen`} onClick={() => setSlot(slot, undefined)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {panel === 'analysis' && (
            <div className="space-y-3">
              <p className="text-sm text-muted">Mehrere Blickwinkel statt einer Gesamtnote. Persönlicher Geschmack hat immer Vorrang.</p>
              {analysis.dimensions.map((d) => (
                <div key={d.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{d.label}</p>
                    <Badge tone={d.tone === 'positive' ? 'positive' : d.tone === 'attention' ? 'attention' : 'neutral'}>
                      {d.tone === 'positive' ? '✓ ' : d.tone === 'attention' ? '! ' : ''}
                      {d.value}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted">{d.text}</p>
                </div>
              ))}
            </div>
          )}

          {panel === 'examples' && (
            <div className="space-y-4">
              <p className="text-sm text-muted">Kuratierte Ausgangspunkte – keine festen Regeln. Ein Klick lädt das Beispiel als Farbexperiment.</p>
              {(['harmony', 'tee-pairing'] as const).map((grp) => (
                <div key={grp}>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{grp === 'harmony' ? 'Farbharmonien' : 'Passende Farben für die T-Shirts'}</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {CURATED_EXAMPLES.filter((e) => e.group === grp).map((e) => (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => setCurrent((o) => ({ ...o, name: e.title, sourceExampleId: e.id, slots: exampleToSlots(e.id) }))}
                          className="w-full rounded-xl border border-line bg-surface p-2 text-left hover:bg-surface-2"
                        >
                          <ColorStrip colors={e.colors} height="h-6" />
                          <span className="mt-1.5 block text-xs font-medium">{e.title}</span>
                          {e.harmony && <span className="block text-[11px] text-muted">{HARMONY_LABEL[e.harmony]}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {panel === 'saved' && (
            <div className="space-y-2">
              {outfits.length === 0 && <p className="text-sm text-muted">Noch keine gespeicherten Outfits. Stelle ein Outfit zusammen und klicke auf „Speichern“.</p>}
              <div className="flex justify-end">
                {outfits.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => downloadJson({ format: 'chromawardrobe-outfits', exportedAt: nowIso(), outfits }, 'chromawardrobe-outfits.json')}>
                    <Download className="h-4 w-4" /> Outfits exportieren
                  </Button>
                )}
              </div>
              {[...outfits]
                .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt))
                .map((o) => {
                  const res = resolveSlots(o.slots, garments);
                  const colors = Object.values(res).flatMap((v) => (v && !v.hidden ? v.colors.slice(0, 1) : []));
                  return (
                    <div key={o.id} className={cx('rounded-2xl border bg-surface p-3', o.id === current.id ? 'border-ink' : 'border-line')}>
                      <div className="flex items-start gap-2">
                        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setCurrent(() => structuredClone(o))}>
                          <span className="flex items-center gap-1.5 text-sm font-medium">
                            {o.favorite && <Star className="h-3.5 w-3.5 fill-current" aria-label="Favorit" />}
                            <span className="truncate">{o.name}</span>
                          </span>
                          <span className="text-xs text-muted">{o.kind === 'wardrobe' ? 'Kleiderschrank-Outfit' : 'Farbexperiment'}</span>
                          <ColorStrip colors={colors} className="mt-2" height="h-4" />
                        </button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`${o.name} löschen`}
                          onClick={async () => {
                            await store.outfits.delete(o.id);
                            toast.show(`„${o.name}“ gelöscht.`, { onAction: () => void store.outfits.put(o) });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Auswahl aus dem Kleiderschrank */}
      <Modal open={picker?.mode === 'wardrobe'} onClose={() => setPicker(null)} title={picker ? `${SLOT_LABEL[picker.slot]} aus dem Kleiderschrank` : ''} size="lg">
        {pickerGarments.length === 0 ? (
          <p className="text-sm text-muted">
            Für diesen Bereich ist noch nichts im Kleiderschrank. Wähle stattdessen eine freie Farbe oder füge ein Kleidungsstück hinzu.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pickerGarments
              .sort((a, b) => Number(a.ownership !== 'owned') - Number(b.ownership !== 'owned'))
              .map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSlot(picker!.slot, slotFromGarment(g));
                      setPicker(null);
                    }}
                    className="flex w-full flex-col rounded-2xl border border-line bg-surface p-2 text-left hover:bg-surface-2"
                  >
                    <span className="mb-2 flex aspect-square items-center justify-center rounded-xl bg-stage p-2">
                      <GarmentIllustration subcategory={g.subcategory} colors={g.colors} pattern={g.pattern} attributes={g.attributes} catalog={catalog} className="h-full w-full" />
                    </span>
                    <span className="line-clamp-2 text-xs font-medium">{g.name}</span>
                    {g.ownership !== 'owned' && (
                      <Badge tone="info" className="mt-1 self-start">
                        {t.ownership[g.ownership]} – virtuell anprobieren
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </Modal>

      {/* Freie Farbe */}
      {picker?.mode === 'color' && (
        <FreeColorModal
          slot={picker.slot}
          value={resolved[picker.slot]}
          groups={groups}
          onClose={() => setPicker(null)}
          onApply={(v) => {
            setSlot(picker.slot, v);
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}

function FreeColorModal({
  slot,
  value,
  groups,
  onClose,
  onApply,
}: {
  slot: OutfitSlot;
  value?: OutfitSlotValue;
  groups: ReturnType<typeof buildPaletteGroups>;
  onClose: () => void;
  onApply: (v: OutfitSlotValue) => void;
}) {
  const { catalog } = useAppData();
  const subs = subcategoriesForSlot(slot, catalog);
  const [sub, setSub] = useState(value?.subcategory ?? DEFAULT_SUB_FOR_SLOT[slot]);
  const [colors, setColors] = useState<GarmentColor[]>(value?.colors ?? [garmentColor('#89674F')]);
  const [pattern, setPattern] = useState<PatternType>(value?.pattern.type ?? 'solid');
  const [active, setActive] = useState(0);
  return (
    <Modal
      open
      onClose={onClose}
      title={`${SLOT_LABEL[slot]}: Farbe wählen`}
      description="Freie Farbe – ideal zum Experimentieren oder für geplante Käufe."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant="primary" onClick={() => onApply({ subcategory: sub, colors, pattern: { type: pattern }, attributes: defaultAttributes(sub, catalog) })}>
            <Check className="h-4 w-4" /> Übernehmen
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        <div className="space-y-3">
          <div className="flex aspect-square items-center justify-center rounded-2xl bg-stage p-3">
            <GarmentIllustration subcategory={sub} colors={colors} pattern={{ type: pattern }} attributes={defaultAttributes(sub, catalog)} catalog={catalog} className="h-full w-full" />
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Art</span>
            <select className="h-10 w-full rounded-xl border border-line bg-surface px-2" value={sub} onChange={(e) => setSub(e.target.value)}>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-1">
            {colors.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={active === i}
                aria-label={`Farbe ${i + 1} bearbeiten`}
                className={cx('h-8 w-8 rounded-lg border-2', active === i ? 'border-ink' : 'border-transparent')}
                style={{ background: c.hex }}
              />
            ))}
            {colors.length < 3 && (
              <button
                type="button"
                className="h-8 rounded-lg border border-dashed border-line px-2 text-xs"
                onClick={() => {
                  setColors([...colors.map((c) => ({ ...c, share: c.share * 0.65 })), garmentColor('#E5D8BF', 0.35, 'secondary')]);
                  setActive(colors.length);
                  if (pattern === 'solid') setPattern('check');
                }}
              >
                + Farbe
              </button>
            )}
            {colors.length > 1 && (
              <button
                type="button"
                className="h-8 rounded-lg px-2 text-xs text-muted underline"
                onClick={() => {
                  setColors([{ ...colors[0], share: 1 }]);
                  setActive(0);
                  setPattern('solid');
                }}
              >
                einfarbig
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {PATTERNS.map((p) => (
              <Chip key={p} active={pattern === p} onClick={() => setPattern(p)} className="h-7 px-2 text-xs">
                {t.pattern[p]}
              </Chip>
            ))}
          </div>
        </div>
        <ColorChooser value={colors[active].hex} groups={groups} idPrefix="studio" onChange={(hex, name) => setColors(colors.map((c, i) => (i === active ? { ...c, hex, name } : c)))} />
      </div>
    </Modal>
  );
}
