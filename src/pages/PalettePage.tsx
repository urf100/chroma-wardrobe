import { useState } from 'react';
import { Copy, Download, Heart, Layers, Plus, ThumbsDown, Trash2 } from 'lucide-react';
import type { CustomSwatchKind, HexColor } from '@/domain/types';
import { useAppData } from '@/app/AppData';
import { buildPaletteGroups } from '@/app/paletteGroups';
import { Button, Callout, Field, LinkButton, PageHeader, SectionTitle, Select, TextInput } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { ColorChooser } from '@/components/color/ColorPicker';
import { Swatch, copyText } from '@/components/color/Swatch';
import { useToast } from '@/components/ui/Toast';
import { PALETTE_GROUPS } from '@/domain/seasons';
import { nameColor } from '@/domain/color';
import { createId, nowIso } from '@/domain/id';
import { downloadBlob, downloadJson } from './studio/exportImage';
import { t } from '@/i18n';

const KINDS: CustomSwatchKind[] = ['personal', 'neutral-suggestion', 'trial-bottom', 'inspiration'];

export default function PalettePage() {
  const { profile, season, updateProfile } = useAppData();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [hex, setHex] = useState<HexColor>('#A65C3D');
  const [name, setName] = useState('');
  const [kind, setKind] = useState<CustomSwatchKind>('personal');
  if (!profile) return null;

  const favorites = profile.preferences.favoriteColors;
  const isFav = (h: string) => favorites.some((f) => f.hex === h);
  const toggleFav = (h: string, n: string) =>
    updateProfile((p) => ({
      ...p,
      preferences: { ...p.preferences, favoriteColors: isFav(h) ? p.preferences.favoriteColors.filter((f) => f.hex !== h) : [...p.preferences.favoriteColors, { hex: h, name: n }] },
    }));
  const dislike = (h: string, n: string) =>
    updateProfile((p) => ({ ...p, preferences: { ...p.preferences, dislikedColors: [...p.preferences.dislikedColors.filter((d) => d.hex !== h), { hex: h, name: n }] } }));

  const allColors = [
    ...(season ? PALETTE_GROUPS.filter((g) => g.key !== 'avoid').flatMap((g) => season.palette[g.key].map((s) => ({ ...s, group: g.label }))) : []),
    ...profile.customSwatches.map((s) => ({ hex: s.hex, name: s.name, group: t.swatchKind[s.kind] })),
  ];

  const exportCss = () => {
    const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const seen = new Set<string>();
    const lines = allColors
      .filter((c) => (seen.has(c.hex) ? false : (seen.add(c.hex), true)))
      .map((c) => `  --cw-${slug(c.name)}: ${c.hex}; /* ${c.group} */`);
    downloadBlob(new Blob([`:root {\n${lines.join('\n')}\n}\n`], { type: 'text/css' }), 'chromawardrobe-palette.css');
  };

  return (
    <div>
      <PageHeader
        eyebrow={profile.name}
        title={t.nav.palette}
        description="Die Palette deines Farbtyps plus deine eigenen Farben. Persönliche Anpassungen sind ausdrücklich erwünscht."
        actions={
          <>
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Eigene Farbe
            </Button>
            <Button variant="outline" onClick={() => downloadJson({ format: 'chromawardrobe-palette', profile: profile.name, season: season?.id ?? null, colors: allColors }, 'chromawardrobe-palette.json')}>
              <Download className="h-4 w-4" /> JSON
            </Button>
            <Button variant="outline" onClick={exportCss}>
              <Download className="h-4 w-4" /> CSS
            </Button>
            <Button
              variant="ghost"
              onClick={async () => (await copyText(allColors.map((c) => `${c.name}\t${c.hex}`).join('\n'))) && toast.show('Palette in die Zwischenablage kopiert.')}
            >
              <Copy className="h-4 w-4" /> Kopieren
            </Button>
          </>
        }
      />

      <div className="space-y-10">
        <section aria-labelledby="own-h">
          <SectionTitle id="own-h" hint="Inspirations- und Experimentierfarben sind keine Kleidungsstücke – sie bleiben getrennt vom Kleiderschrank.">
            Deine eigenen Farben
          </SectionTitle>
          {profile.customSwatches.length === 0 && <p className="text-sm text-muted">Noch keine eigenen Farben. Füge Farben hinzu, die du magst oder ausprobieren willst.</p>}
          <div className="space-y-6">
            {KINDS.map((k) => {
              const list = profile.customSwatches.filter((s) => s.kind === k);
              if (!list.length) return null;
              return (
                <div key={k}>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{t.swatchKind[k]}</p>
                  <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    {list.map((s) => (
                      <li key={s.id} className="group relative">
                        <Swatch hex={s.hex} name={s.name} note={s.note} copyable />
                        <div className="mt-1 flex gap-0.5">
                          <button type="button" className="rounded p-1 text-muted hover:bg-surface-2" aria-label={`${s.name} als Lieblingsfarbe`} aria-pressed={isFav(s.hex)} onClick={() => toggleFav(s.hex, s.name)}>
                            <Heart className={isFav(s.hex) ? 'h-3.5 w-3.5 fill-current text-ink' : 'h-3.5 w-3.5'} />
                          </button>
                          <button
                            type="button"
                            className="rounded p-1 text-muted hover:bg-surface-2"
                            aria-label={`${s.name} löschen`}
                            onClick={async () => {
                              await updateProfile((p) => ({ ...p, customSwatches: p.customSwatches.filter((x) => x.id !== s.id) }));
                              toast.show(`„${s.name}“ entfernt.`, { onAction: () => void updateProfile((p) => ({ ...p, customSwatches: [...p.customSwatches, s] })) });
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {season ? (
          <section aria-labelledby="season-h">
            <SectionTitle id="season-h" hint={`${season.summary} Herz = Lieblingsfarbe, Daumen = gefällt mir nicht (fließt in Empfehlungen ein).`}>
              Palette {season.nameDe}
            </SectionTitle>
            <div className="space-y-6">
              {PALETTE_GROUPS.map((g) => (
                <div key={g.key}>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{g.label}</p>
                  <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                    {season.palette[g.key].map((s) => (
                      <li key={s.hex + s.name}>
                        <Swatch hex={s.hex} name={s.name} note={s.note} copyable />
                        {g.key !== 'avoid' && g.key !== 'metals' && (
                          <div className="mt-1 flex gap-0.5">
                            <button type="button" className="rounded p-1 text-muted hover:bg-surface-2" aria-label={`${s.name} als Lieblingsfarbe`} aria-pressed={isFav(s.hex)} onClick={() => toggleFav(s.hex, s.name)}>
                              <Heart className={isFav(s.hex) ? 'h-3.5 w-3.5 fill-current text-ink' : 'h-3.5 w-3.5'} />
                            </button>
                            <button type="button" className="rounded p-1 text-muted hover:bg-surface-2" aria-label={`${s.name} gefällt mir nicht`} onClick={() => { void dislike(s.hex, s.name); toast.show(`„${s.name}“ als weniger bevorzugt gespeichert.`); }}>
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <LinkButton to={`/farbtyp/${season.id}`} variant="ghost" className="mt-4 -ml-3">
              <Layers className="h-4 w-4" /> Erklärungen zum Farbtyp
            </LinkButton>
          </section>
        ) : (
          <Callout title="Noch kein Farbtyp gewählt">
            Wähle einen Farbtyp im Profil oder in der Farbtyp-Analyse, um hier seine kuratierte Palette zu sehen. Deine eigenen Farben funktionieren auch ohne.
          </Callout>
        )}
      </div>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Eigene Farbe hinzufügen"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                const sw = { id: createId('sw'), hex, name: name.trim() || nameColor(hex).name, kind, createdAt: nowIso() };
                await updateProfile((p) => ({ ...p, customSwatches: [...p.customSwatches, sw] }));
                setAdding(false);
                setName('');
                toast.show('Farbe hinzugefügt.');
              }}
            >
              Hinzufügen
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <ColorChooser value={hex} onChange={(h, n) => { setHex(h); if (n) setName(n); }} groups={buildPaletteGroups(profile, season)} idPrefix="pal" defaultMethod="visual" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="sw-name">
              <TextInput id="sw-name" value={name} placeholder={nameColor(hex).name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Art" htmlFor="sw-kind">
              <Select id="sw-kind" value={kind} onChange={(e) => setKind(e.target.value as CustomSwatchKind)}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t.swatchKind[k]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
