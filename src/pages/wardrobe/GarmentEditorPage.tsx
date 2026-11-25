/**
 * Geführter Workflow zum Hinzufügen und Bearbeiten eines Kleidungsstücks:
 * Kategorie → Art (Silhouetten) → Farben & Muster → Details → Vorschau & Speichern → passende Teile.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, ImagePlus, Layers, Plus, Trash2 } from 'lucide-react';
import type { Garment, GarmentColor, GarmentFit, OwnershipStatus, PatternType, PurchaseStatus, StyleTag, WearSeason } from '@/domain/types';
import { useAppData } from '@/app/AppData';
import { buildPaletteGroups } from '@/app/paletteGroups';
import { createGarment, garmentColor, normalizeShares } from '@/domain/profile/factory';
import { defaultAttributes, defaultPattern, subcategoryLabel } from '@/domain/garments/catalog';
import { nameColor, normalizeHex } from '@/domain/color';
import { GarmentIllustration } from '@/illustrations/Figure';
import { ColorChooser } from '@/components/color/ColorPicker';
import { ColorStrip } from '@/components/color/Swatch';
import { Badge, Button, Callout, Chip, Field, LinkButton, PageHeader, Select, TextArea, TextInput, Toggle, cx } from '@/components/ui/primitives';
import { MatchList } from '@/components/MatchList';
import { store } from '@/data/store';
import { downscaleImage, saveImage } from '@/data/services';
import { useImageUrl } from '@/data/hooks';
import { useToast } from '@/components/ui/Toast';
import { nowIso } from '@/domain/id';
import { t } from '@/i18n';
import { SEASON_FIT_LABEL, seasonFit } from '@/domain/seasons/fit';

const STEPS = ['Kategorie', 'Art', 'Farben & Muster', 'Details', 'Vorschau'] as const;
const PATTERNS: PatternType[] = ['solid', 'check', 'stripes', 'melange', 'houndstooth', 'herringbone', 'camouflage', 'colorblock', 'print', 'custom'];
const WEAR: WearSeason[] = ['spring', 'summer', 'autumn', 'winter'];
const STYLES: StyleTag[] = ['natural', 'timeless', 'modern', 'casual', 'minimal', 'classic', 'elegant', 'sporty', 'business-casual', 'creative', 'outdoor', 'streetwear'];
const OWNERSHIP: OwnershipStatus[] = ['owned', 'planned', 'wishlist', 'archived', 'sold'];

export default function GarmentEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { profile, catalog, season, garments } = useAppData();
  const existing = id ? garments.find((g) => g.id === id) : undefined;
  const isNew = !id;

  const [draft, setDraft] = useState<Garment | null>(null);
  const [step, setStep] = useState(0);
  const [activeColor, setActiveColor] = useState(0);
  const [nameTouched, setNameTouched] = useState(false);
  const [saved, setSaved] = useState<Garment | null>(null);

  // Entwurf initialisieren
  useEffect(() => {
    if (draft || !profile) return;
    if (existing) {
      setDraft(structuredClone(existing));
      setNameTouched(true);
      setStep(2);
      return;
    }
    if (id) return; // wartet auf Daten
    const hex = params.get('hex');
    const status = params.get('status') as OwnershipStatus | null;
    const g = createGarment(profile.id, 'tshirt', [garmentColor(hex && /^#?[0-9a-f]{6}$/i.test(hex) ? normalizeHex(hex) : '#89674F')], {
      ownership: status && OWNERSHIP.includes(status) ? status : 'owned',
    });
    setDraft(g);
  }, [profile, existing, id, draft, params]);

  const photoUrl = useImageUrl(draft?.photoImageId);
  const groups = useMemo(() => buildPaletteGroups(profile, season), [profile, season]);

  if (!profile) return null;
  if (id && !existing && !draft) return <p className="text-muted">Kleidungsstück wird geladen … (oder existiert nicht mehr)</p>;
  if (!draft) return null;

  const sub = catalog.subcategories.get(draft.subcategory);
  const category = catalog.categories.find((c) => c.id === draft.category);
  const autoName = `${sub?.label ?? 'Teil'} ${draft.colors[0]?.name ?? nameColor(draft.colors[0].hex).name}`;
  const update = (patch: Partial<Garment>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const updateColors = (colors: GarmentColor[]) => {
    const next = normalizeShares(colors);
    setDraft((d) => (d ? { ...d, colors: next, name: nameTouched ? d.name : `${sub?.label ?? ''} ${next[0].name ?? nameColor(next[0].hex).name}`.trim() } : d));
  };
  const chooseSub = (subId: string) => {
    const s = catalog.subcategories.get(subId)!;
    setDraft((d) =>
      d
        ? {
            ...d,
            category: s.categoryId,
            subcategory: subId,
            attributes: defaultAttributes(subId, catalog),
            pattern: d.pattern.type === 'solid' ? { type: defaultPattern(subId, catalog) } : d.pattern,
            name: nameTouched ? d.name : `${s.label} ${d.colors[0].name ?? nameColor(d.colors[0].hex).name}`,
          }
        : d,
    );
    setStep(2);
  };

  const save = async () => {
    const g: Garment = { ...draft, name: draft.name.trim() || autoName, updatedAt: nowIso() };
    await store.garments.put(g);
    toast.show(isNew ? 'Kleidungsstück gespeichert.' : 'Änderungen gespeichert.');
    if (isNew) setSaved(g);
    else navigate(`/kleiderschrank?teil=${g.id}`);
  };

  /* ---------- Gespeichert: Vorschläge ---------- */
  if (saved) {
    return (
      <div className="cw-fade-in">
        <PageHeader eyebrow="Gespeichert" title={saved.name} description="Diese vorhandenen Teile passen besonders gut dazu:" />
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="flex aspect-square items-center justify-center rounded-3xl bg-stage p-6">
            <GarmentIllustration subcategory={saved.subcategory} colors={saved.colors} pattern={saved.pattern} attributes={saved.attributes} catalog={catalog} className="h-full w-full" />
          </div>
          <div className="space-y-5">
            <MatchList anchor={saved} candidates={garments.filter((g) => g.id !== saved.id)} perRole={3} />
            <div className="flex flex-wrap gap-2">
              <LinkButton to={`/studio?garment=${saved.id}`} variant="primary">
                <Layers className="h-4 w-4" /> Im Outfit-Studio kombinieren
              </LinkButton>
              <Button
                variant="outline"
                onClick={() => {
                  setSaved(null);
                  setDraft(null);
                  setStep(0);
                  setNameTouched(false);
                }}
              >
                <Plus className="h-4 w-4" /> Weiteres Teil hinzufügen
              </Button>
              <LinkButton to="/kleiderschrank" variant="ghost">
                Zum Kleiderschrank
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fit = season ? seasonFit(draft.colors[0].hex, season) : null;
  const preview = (
    <div className="space-y-3">
      <div className="flex aspect-square items-center justify-center rounded-3xl bg-stage p-6">
        <GarmentIllustration subcategory={draft.subcategory} colors={draft.colors} pattern={draft.pattern} attributes={draft.attributes} catalog={catalog} className="h-full w-full" />
      </div>
      <div>
        <p className="font-semibold">{draft.name || autoName}</p>
        <p className="text-sm text-muted">
          {sub?.label} · {t.pattern[draft.pattern.type]}
        </p>
        <ColorStrip className="mt-2" height="h-4" colors={draft.colors} />
        {fit && (
          <p className="mt-2 text-xs text-muted">
            {season!.nameDe}: <strong>{SEASON_FIT_LABEL[fit.level]}</strong> – {fit.reasons[0]}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader eyebrow={t.nav.wardrobe} title={isNew ? 'Kleidungsstück hinzufügen' : 'Kleidungsstück bearbeiten'} />

      <ol className="mb-6 flex flex-wrap gap-2" aria-label="Schritte">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => (i <= 1 || draft.subcategory ? setStep(i) : undefined)}
              aria-current={step === i ? 'step' : undefined}
              className={cx(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm',
                step === i ? 'bg-ink text-canvas' : i < step ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface-2',
              )}
            >
              <span className={cx('flex h-5 w-5 items-center justify-center rounded-full text-[11px]', step === i ? 'bg-canvas text-ink' : 'bg-line')}>{i < step ? <Check className="h-3 w-3" /> : i + 1}</span>
              {s}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 lg:order-1">
          {/* Schritt 1: Kategorie */}
          {step === 0 && (
            <section aria-labelledby="s-cat">
              <h2 id="s-cat" className="mb-4 text-lg font-semibold">
                Was möchtest du hinzufügen?
              </h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {catalog.categories.map((c) => {
                  const first = c.subcategories[0];
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          update({ category: c.id });
                          setStep(1);
                        }}
                        className={cx('flex w-full flex-col items-center rounded-2xl border p-4 text-center hover:bg-surface-2', draft.category === c.id ? 'border-ink' : 'border-line bg-surface')}
                      >
                        <span className="mb-2 flex h-24 w-24 items-center justify-center">
                          {first && <GarmentIllustration subcategory={first.id} colors={draft.colors} pattern={{ type: 'solid' }} catalog={catalog} className="h-full w-full" />}
                        </span>
                        <span className="font-medium">{c.label}</span>
                        <span className="text-xs text-muted">{c.description}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Schritt 2: Art mit Silhouetten */}
          {step === 1 && (
            <section aria-labelledby="s-sub">
              <h2 id="s-sub" className="mb-1 text-lg font-semibold">
                Welche Art von {category?.label ?? 'Kleidungsstück'}?
              </h2>
              <p className="mb-4 text-sm text-muted">Wähle die Silhouette, die deinem Teil am nächsten kommt.</p>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {(category?.subcategories ?? []).map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => chooseSub(s.id)}
                      className={cx('flex w-full flex-col items-center rounded-2xl border p-3 hover:bg-surface-2', draft.subcategory === s.id ? 'border-ink ring-1 ring-ink' : 'border-line bg-surface')}
                    >
                      <span className="mb-2 flex h-28 w-full items-center justify-center rounded-xl bg-stage p-2">
                        <GarmentIllustration subcategory={s.id} colors={draft.colors} pattern={{ type: s.defaultPattern ?? 'solid' }} attributes={defaultAttributes(s.id, catalog)} catalog={catalog} className="h-full w-full" />
                      </span>
                      <span className="text-sm font-medium">{s.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Schritt 3: Farben & Muster */}
          {step === 2 && (
            <section aria-labelledby="s-col" className="space-y-6">
              <div>
                <h2 id="s-col" className="mb-1 text-lg font-semibold">
                  Welche Farbe hat dein {subcategoryLabel(draft.subcategory, catalog)}?
                </h2>
                <p className="text-sm text-muted">
                  Wähle so, wie du es am liebsten machst: aus einer Palette, im Farbfeld, per HEX-Code oder per Foto. Du musst keine HEX-Codes kennen.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Farben des Kleidungsstücks</p>
                <ul className="space-y-2">
                  {draft.colors.map((c, i) => (
                    <li key={i} className={cx('flex flex-wrap items-center gap-3 rounded-xl border p-2', activeColor === i ? 'border-ink' : 'border-line')}>
                      <button type="button" onClick={() => setActiveColor(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-pressed={activeColor === i}>
                        <span className="h-9 w-9 shrink-0 rounded-lg border border-black/10" style={{ background: c.hex }} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {i === 0 ? 'Hauptfarbe' : i === 1 ? 'Sekundärfarbe' : 'Akzentfarbe'}: {c.name ?? nameColor(c.hex).name}
                          </span>
                          <span className="block font-mono text-xs text-muted">{c.hex}</span>
                        </span>
                      </button>
                      {draft.colors.length > 1 && (
                        <label className="flex items-center gap-2 text-xs text-muted">
                          Anteil
                          <input
                            type="range"
                            min={5}
                            max={95}
                            value={Math.round(c.share * 100)}
                            onChange={(e) => {
                              const v = Number(e.target.value) / 100;
                              const rest = draft.colors.filter((_, j) => j !== i);
                              const restSum = rest.reduce((s, x) => s + x.share, 0) || 1;
                              updateColors(draft.colors.map((x, j) => (j === i ? { ...x, share: v } : { ...x, share: (x.share / restSum) * (1 - v) })));
                            }}
                            aria-label={`Geschätzter Anteil ${c.name ?? nameColor(c.hex).name}`}
                          />
                          <span className="w-9 text-right">{Math.round(c.share * 100)} %</span>
                        </label>
                      )}
                      {i > 0 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Farbe entfernen"
                          onClick={() => {
                            updateColors(draft.colors.filter((_, j) => j !== i));
                            setActiveColor(0);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
                {draft.colors.length < 4 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = [...draft.colors.map((c) => ({ ...c, share: c.share * 0.7 })), garmentColor(draft.colors.length === 1 ? '#E5D8BF' : '#3D777E', 0.3, draft.colors.length === 1 ? 'secondary' : 'accent')];
                      updateColors(next);
                      setActiveColor(next.length - 1);
                      if (draft.pattern.type === 'solid') update({ pattern: { type: 'stripes' } });
                    }}
                  >
                    <Plus className="h-4 w-4" /> Weitere Farbe (mehrfarbig)
                  </Button>
                )}
              </div>

              <ColorChooser
                value={draft.colors[activeColor].hex}
                groups={groups}
                idPrefix="garment"
                onChange={(hex, name) =>
                  updateColors(draft.colors.map((c, i) => (i === activeColor ? { ...c, hex, name: name ?? undefined } : c)))
                }
              />

              <Field label="Eigener Farbname (optional)" htmlFor="colorname" hint="Z. B. der Name aus dem Onlineshop. Leer lassen für den automatischen Namen.">
                <TextInput
                  id="colorname"
                  value={draft.colors[activeColor].name ?? ''}
                  placeholder={nameColor(draft.colors[activeColor].hex).name}
                  onChange={(e) => updateColors(draft.colors.map((c, i) => (i === activeColor ? { ...c, name: e.target.value || undefined } : c)))}
                />
              </Field>

              <div>
                <p className="mb-2 text-sm font-medium">Muster</p>
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {PATTERNS.map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        onClick={() => update({ pattern: { ...draft.pattern, type: p } })}
                        aria-pressed={draft.pattern.type === p}
                        className={cx('flex w-full flex-col items-center rounded-xl border p-2 text-xs', draft.pattern.type === p ? 'border-ink ring-1 ring-ink' : 'border-line')}
                      >
                        <span className="mb-1 h-12 w-12">
                          <GarmentIllustration
                            subcategory="tshirt"
                            colors={draft.colors.length > 1 ? draft.colors : [draft.colors[0], garmentColor('#E5D8BF', 0.35, 'secondary')]}
                            pattern={{ type: p }}
                            className="h-full w-full"
                          />
                        </span>
                        {t.pattern[p]}
                      </button>
                    </li>
                  ))}
                </ul>
                {draft.pattern.type !== 'solid' && draft.colors.length < 2 && (
                  <p className="mt-2 text-xs text-muted">Tipp: Füge eine zweite Farbe hinzu, damit das Muster in den richtigen Farben erscheint.</p>
                )}
                {draft.pattern.type === 'custom' && (
                  <TextInput className="mt-2" placeholder="Muster beschreiben" value={draft.pattern.description ?? ''} onChange={(e) => update({ pattern: { type: 'custom', description: e.target.value } })} aria-label="Musterbeschreibung" />
                )}
              </div>
              <Toggle
                checked={!!draft.colorIsApproximation}
                onChange={(v) => update({ colorIsApproximation: v })}
                label="Farbe ist eine Schätzung"
                description="Markiert, dass der Farbwert nicht verifiziert ist (z. B. vom Bildschirm abgelesen)."
              />
            </section>
          )}

          {/* Schritt 4: Details */}
          {step === 3 && (
            <section aria-labelledby="s-det" className="space-y-5">
              <h2 id="s-det" className="text-lg font-semibold">
                Details – alles optional
              </h2>
              {(sub?.attributes ?? []).length > 0 && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {sub!.attributes!.map((a) => (
                    <Field key={a.key} label={a.label} htmlFor={`attr-${a.key}`}>
                      <Select id={`attr-${a.key}`} value={draft.attributes[a.key] ?? a.defaultValue} onChange={(e) => update({ attributes: { ...draft.attributes, [a.key]: e.target.value } })}>
                        {a.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  ))}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="g-name">
                  <TextInput
                    id="g-name"
                    value={draft.name}
                    placeholder={autoName}
                    onChange={(e) => {
                      setNameTouched(true);
                      update({ name: e.target.value });
                    }}
                  />
                </Field>
                <Field label="Status" htmlFor="g-own">
                  <Select id="g-own" value={draft.ownership} onChange={(e) => update({ ownership: e.target.value as OwnershipStatus })}>
                    {OWNERSHIP.map((o) => (
                      <option key={o} value={o}>
                        {t.ownership[o]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Marke" htmlFor="g-brand">
                  <TextInput id="g-brand" value={draft.brand ?? ''} onChange={(e) => update({ brand: e.target.value || undefined })} />
                </Field>
                <Field label="Modell" htmlFor="g-model">
                  <TextInput id="g-model" value={draft.model ?? ''} onChange={(e) => update({ model: e.target.value || undefined })} />
                </Field>
                <Field label="Material" htmlFor="g-mat">
                  <TextInput id="g-mat" value={draft.material ?? ''} placeholder="z. B. Baumwolle, Wolle, Leder" onChange={(e) => update({ material: e.target.value || undefined })} />
                </Field>
                <Field label="Textur" htmlFor="g-tex">
                  <TextInput id="g-tex" value={draft.texture ?? ''} placeholder="z. B. glatt, gerippt, Cord, Strick" onChange={(e) => update({ texture: e.target.value || undefined })} />
                </Field>
                <Field label="Passform" htmlFor="g-fit">
                  <Select id="g-fit" value={draft.fit ?? ''} onChange={(e) => update({ fit: (e.target.value || undefined) as GarmentFit | undefined })}>
                    <option value="">Keine Angabe</option>
                    {(['slim', 'regular', 'relaxed', 'oversized'] as const).map((f) => (
                      <option key={f} value={f}>
                        {t.fit[f]}
                      </option>
                    ))}
                  </Select>
                </Field>
                {(draft.ownership === 'planned' || draft.ownership === 'wishlist') && (
                  <Field label="Kaufstatus" htmlFor="g-purch">
                    <Select id="g-purch" value={draft.purchaseStatus ?? 'not-purchased'} onChange={(e) => update({ purchaseStatus: e.target.value as PurchaseStatus })}>
                      {(['not-purchased', 'ordered', 'purchased', 'returned'] as const).map((p) => (
                        <option key={p} value={p}>
                          {t.purchase[p]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Jahreszeiten</p>
                <div className="flex flex-wrap gap-2">
                  {WEAR.map((w) => (
                    <Chip key={w} active={draft.seasons.includes(w)} onClick={() => update({ seasons: draft.seasons.includes(w) ? draft.seasons.filter((x) => x !== w) : [...draft.seasons, w] })}>
                      {t.wearSeason[w]}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Stil</p>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <Chip key={s} active={draft.styles.includes(s)} onClick={() => update({ styles: draft.styles.includes(s) ? draft.styles.filter((x) => x !== s) : [...draft.styles, s] })}>
                      {t.style[s]}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Produktlink" htmlFor="g-url" hint="Nur http(s)-Links. Der Link wird nicht automatisch aufgerufen.">
                  <TextInput
                    id="g-url"
                    type="url"
                    value={draft.productUrl ?? ''}
                    placeholder="https://…"
                    onChange={(e) => update({ productUrl: e.target.value || undefined })}
                    aria-invalid={!!draft.productUrl && !/^https?:\/\//i.test(draft.productUrl)}
                  />
                </Field>
                <Field label="Produktfoto (optional)" hint="Wird nur lokal gespeichert.">
                  <div className="flex items-center gap-3">
                    {photoUrl && <img src={photoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line px-4 text-sm hover:bg-surface-2">
                      <ImagePlus className="h-4 w-4" aria-hidden /> {photoUrl ? 'Ersetzen' : 'Foto wählen'}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const blob = await downscaleImage(f);
                          if (draft.photoImageId) await store.images.delete(draft.photoImageId);
                          update({ photoImageId: await saveImage(store, profile.id, blob, 'garment') });
                        }}
                      />
                    </label>
                    {photoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (draft.photoImageId) await store.images.delete(draft.photoImageId);
                          update({ photoImageId: undefined });
                        }}
                      >
                        Foto löschen
                      </Button>
                    )}
                  </div>
                </Field>
              </div>
              <Field label="Notizen" htmlFor="g-notes">
                <TextArea id="g-notes" value={draft.notes ?? ''} onChange={(e) => update({ notes: e.target.value || undefined })} />
              </Field>
              <Toggle checked={draft.favorite} onChange={(v) => update({ favorite: v })} label="Lieblingsstück" />
            </section>
          )}

          {/* Schritt 5: Vorschau */}
          {step === 4 && (
            <section aria-labelledby="s-prev" className="space-y-4">
              <h2 id="s-prev" className="text-lg font-semibold">
                Alles richtig?
              </h2>
              <div className="lg:hidden">{preview}</div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted">Art</dt>
                  <dd>{sub?.label}</dd>
                </div>
                <div>
                  <dt className="text-muted">Status</dt>
                  <dd>
                    <Badge tone={draft.ownership === 'owned' ? 'positive' : 'info'}>{t.ownership[draft.ownership]}</Badge>
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted">Farben</dt>
                  <dd>{draft.colors.map((c) => `${c.name ?? nameColor(c.hex).name} (${c.hex}, ${Math.round(c.share * 100)} %)`).join(' · ')}</dd>
                </div>
              </dl>
              {!draft.productUrl || /^https?:\/\//i.test(draft.productUrl) ? null : <Callout tone="attention">Der Produktlink muss mit http:// oder https:// beginnen.</Callout>}
            </section>
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}>
              <ChevronLeft className="h-4 w-4" /> {step === 0 ? t.common.cancel : t.common.back}
            </Button>
            <div className="flex gap-2">
              {step >= 2 && step < 4 && (
                <Button variant="outline" onClick={save}>
                  Jetzt speichern
                </Button>
              )}
              {step < 4 ? (
                <Button variant="primary" onClick={() => setStep(step + 1)} disabled={step === 1 && !draft.subcategory}>
                  {t.common.next} <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="primary" onClick={save} disabled={!!draft.productUrl && !/^https?:\/\//i.test(draft.productUrl)}>
                  <Check className="h-4 w-4" /> Im Kleiderschrank speichern
                </Button>
              )}
            </div>
          </div>
        </div>
        <aside className="order-first lg:sticky lg:top-8 lg:order-2 lg:self-start" aria-label="Vorschau">
          <div className={cx(step === 4 && 'hidden lg:block', step < 2 && 'hidden lg:block')}>{preview}</div>
        </aside>
      </div>
    </div>
  );
}
