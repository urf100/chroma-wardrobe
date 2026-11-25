import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, Download, ImagePlus, Plus, Trash2, UserRound, Check } from 'lucide-react';
import type { ColorSwatch, ContrastLevel, SeasonId, StyleDirection, StyleTag, Undertone, UserProfile } from '@/domain/types';
import { useAppData } from '@/app/AppData';
import { Avatar } from '@/app/ProfileSwitcher';
import { Badge, Button, Callout, Card, Chip, EmptyState, Field, LinkButton, PageHeader, Segmented, SectionTitle, TextInput, Toggle } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { AppearancePicker, SavingText } from '@/components/forms';
import { ColorChooser } from '@/components/color/ColorPicker';
import { Swatch } from '@/components/color/Swatch';
import { BEARD_COLORS, EYE_COLORS, HAIR_COLORS, SKIN_TONES } from '@/domain/profile/appearancePresets';
import { SEASONAL_12, getSeason, FAMILY_LABEL, FAMILY_ORDER } from '@/domain/seasons';
import { store } from '@/data/store';
import { addSampleProfile, createNewProfile, deleteProfile, downscaleImage, duplicateProfileDeep, saveImage, setActiveProfile } from '@/data/services';
import { exportProfile, backupFileName } from '@/data/backup/backup';
import { downloadJson } from '@/pages/studio/exportImage';
import { buildPaletteGroups } from '@/app/paletteGroups';
import { nameColor } from '@/domain/color';
import { t } from '@/i18n';

const STYLES: StyleTag[] = ['natural', 'timeless', 'modern', 'casual', 'minimal', 'classic', 'elegant', 'sporty', 'business-casual', 'creative', 'outdoor', 'streetwear'];

export default function ProfilePage() {
  const { profiles, profile, updateProfile, season, garments } = useAppData();
  const [params, setParams] = useSearchParams();
  const [newOpen, setNewOpen] = useState(params.get('neu') === '1');
  const [newName, setNewName] = useState('');
  const [toDelete, setToDelete] = useState<UserProfile | null>(null);
  const [colorModal, setColorModal] = useState<'favorite' | 'disliked' | null>(null);
  const [pickHex, setPickHex] = useState('#89674F');
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (params.get('neu') === '1') setNewOpen(true);
  }, [params]);

  const closeNew = () => {
    setNewOpen(false);
    setNewName('');
    if (params.has('neu')) {
      params.delete('neu');
      setParams(params);
    }
  };

  const ap = profile?.appearance;
  const setAppearance = (patch: Partial<UserProfile['appearance']>) => updateProfile((p) => ({ ...p, appearance: { ...p.appearance, ...patch } }));
  const setPrefs = (patch: Partial<UserProfile['preferences']>) => updateProfile((p) => ({ ...p, preferences: { ...p.preferences, ...patch } }));

  return (
    <div>
      <PageHeader
        title={t.nav.profile}
        description="Mehrere lokale Profile – z. B. für dich, Partner oder Familie. Jedes Profil hat einen eigenen Kleiderschrank, eigene Outfits und Farben."
        actions={
          <Button variant="primary" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> Neues Profil
          </Button>
        }
      />

      {/* Profilliste */}
      <section aria-labelledby="profiles-h" className="mb-10">
        <SectionTitle id="profiles-h" hint="Lokale Profile sind keine abgesicherten Benutzerkonten: Jeder mit Zugriff auf diesen Browser kann sie sehen.">
          Profile auf diesem Gerät
        </SectionTitle>
        {profiles.length === 0 ? (
          <EmptyState
            icon={<UserRound className="h-8 w-8" />}
            title="Noch kein Profil"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="primary" onClick={() => setNewOpen(true)}>
                  Profil anlegen
                </Button>
                <Button variant="outline" onClick={async () => setActiveProfile(store, (await addSampleProfile(store, 'starter')).id)}>
                  Startprofil laden
                </Button>
              </div>
            }
          >
            Lege ein Profil an. Einen Farbtyp musst du dafür nicht kennen.
          </EmptyState>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => {
              const active = p.id === profile?.id;
              return (
                <li key={p.id}>
                  <Card className={active ? 'border-ink p-4' : 'p-4'}>
                    <div className="flex items-center gap-3">
                      <Avatar profile={p} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{p.name}</p>
                        <p className="text-sm text-muted">{getSeason(p.colorType.seasonId)?.nameDe ?? 'Farbtyp offen'}</p>
                      </div>
                      {active && <Badge tone="positive">Aktiv</Badge>}
                    </div>
                    {p.sample && (
                      <Badge tone="sample" className="mt-2">
                        {p.sample === 'starter' ? 'Startprofil (Beispieldaten)' : 'Demo-Profil'}
                      </Badge>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {!active && (
                        <Button size="sm" variant="primary" onClick={() => setActiveProfile(store, p.id)}>
                          <Check className="h-4 w-4" /> Wechseln
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await duplicateProfileDeep(store, p.id);
                          toast.show('Profil inklusive Kleiderschrank dupliziert.');
                        }}
                      >
                        <Copy className="h-4 w-4" /> Duplizieren
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => downloadJson(await exportProfile(store, p.id), backupFileName('profile', p.name))}>
                        <Download className="h-4 w-4" /> Export
                      </Button>
                      <Button size="sm" variant="ghost" className="text-danger" onClick={() => setToDelete(p)}>
                        <Trash2 className="h-4 w-4" /> Löschen
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {profile && ap && (
        <div className="space-y-10">
          <section aria-labelledby="basic-h">
            <SectionTitle id="basic-h">Profil „{profile.name}“ bearbeiten</SectionTitle>
            <Card className="grid gap-5 p-5 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-2">
                <Avatar profile={profile} size={88} />
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs hover:bg-surface-2">
                  <ImagePlus className="h-3.5 w-3.5" aria-hidden /> Bild
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const id = await saveImage(store, profile.id, await downscaleImage(f, 400), 'avatar');
                      if (profile.avatarImageId) await store.images.delete(profile.avatarImageId);
                      await updateProfile((p) => ({ ...p, avatarImageId: id }));
                    }}
                  />
                </label>
                {profile.avatarImageId && (
                  <button
                    type="button"
                    className="text-xs text-muted underline"
                    onClick={async () => {
                      await store.images.delete(profile.avatarImageId!);
                      await updateProfile((p) => ({ ...p, avatarImageId: undefined }));
                    }}
                  >
                    Bild löschen
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name oder Spitzname" htmlFor="p-name">
                  <SavingText id="p-name" value={profile.name} onSave={(v) => v.trim() && updateProfile((p) => ({ ...p, name: v.trim() }))} />
                </Field>
                <Field label="Stilrichtung" htmlFor="p-dir">
                  <select
                    id="p-dir"
                    className="h-10 rounded-xl border border-line bg-surface px-3"
                    value={profile.preferences.styleDirection ?? ''}
                    onChange={(e) => setPrefs({ styleDirection: (e.target.value || undefined) as StyleDirection | undefined })}
                  >
                    <option value="">Keine Angabe</option>
                    {(['masculine', 'feminine', 'neutral', 'mixed'] as const).map((d) => (
                      <option key={d} value={d}>
                        {t.styleDirection[d]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Ziel der Farbberatung" htmlFor="p-goals" className="sm:col-span-2" hint="Was möchtest du erreichen? Z. B. „mutiger mit Farben kombinieren“.">
                  <SavingText id="p-goals" multiline value={profile.preferences.goals ?? ''} onSave={(v) => setPrefs({ goals: v || undefined })} />
                </Field>
              </div>
            </Card>
          </section>

          <section aria-labelledby="look-h">
            <SectionTitle id="look-h" hint="Diese Angaben helfen bei der Farbtyp-Bestimmung und färben die Figur im Outfit-Studio. Alles ist optional.">
              Erscheinungsbild
            </SectionTitle>
            <Card className="space-y-7 p-5">
              <AppearancePicker label="Hautfarbe" hint="Wähle den Ton, der deiner Haut im Gesicht bei Tageslicht am nächsten kommt." options={SKIN_TONES} value={ap.skinTone} onChange={(v) => setAppearance({ skinTone: v })} />
              <fieldset>
                <legend className="text-sm font-medium">Hautunterton</legend>
                <p className="mb-2 text-xs text-muted">
                  Der Unterton ist der feine Farbschimmer unter der Hautoberfläche – unabhängig davon, ob die Haut hell oder dunkel ist. Warm wirkt golden
                  oder pfirsichfarben, kühl eher rosig oder bläulich, oliv leicht grünlich. Er ist schwer selbst zu bestimmen – „noch unbekannt“ ist völlig
                  in Ordnung.
                </p>
                <Segmented<Undertone>
                  label="Hautunterton"
                  value={ap.skinUndertone}
                  onChange={(v) => setAppearance({ skinUndertone: v })}
                  options={(['warm', 'neutral', 'cool', 'olive', 'unknown'] as const).map((u) => ({ value: u, label: t.undertone[u] }))}
                />
              </fieldset>
              <AppearancePicker label="Aktuelle Haarfarbe" options={HAIR_COLORS} value={ap.hairColor} onChange={(v) => setAppearance({ hairColor: v })} />
              <Toggle checked={!!ap.hairIsDyed} onChange={(v) => setAppearance({ hairIsDyed: v })} label="Haare sind gefärbt" description="Dann zählt für die Farbtyp-Bestimmung vor allem die natürliche Haarfarbe." />
              <AppearancePicker label="Natürliche Haarfarbe" hint="Die Farbe am Ansatz bzw. ohne Färbung." options={HAIR_COLORS} value={ap.naturalHairColor} onChange={(v) => setAppearance({ naturalHairColor: v })} />
              <AppearancePicker label="Augenfarbe" options={EYE_COLORS} value={ap.eyeColor} onChange={(v) => setAppearance({ eyeColor: v })} />
              <Toggle checked={ap.hasBeard} onChange={(v) => setAppearance({ hasBeard: v })} label="Bart vorhanden" />
              {ap.hasBeard && <AppearancePicker label="Bartfarbe" options={BEARD_COLORS} value={ap.beardColor} onChange={(v) => setAppearance({ beardColor: v })} />}
              <fieldset>
                <legend className="text-sm font-medium">Persönlicher Kontrast</legend>
                <p className="mb-2 text-xs text-muted">
                  Wie stark unterscheiden sich Haut, Haare und Augen in der Helligkeit? Dunkle Haare zu heller Haut = hoher Kontrast. Ähnlich helle Töne =
                  geringer Kontrast.
                </p>
                <Segmented<ContrastLevel>
                  label="Persönlicher Kontrast"
                  value={ap.contrast}
                  onChange={(v) => setAppearance({ contrast: v })}
                  options={(['low', 'medium', 'high', 'unknown'] as const).map((c) => ({ value: c, label: t.contrast[c] }))}
                />
              </fieldset>
            </Card>
          </section>

          <section aria-labelledby="type-h">
            <SectionTitle id="type-h" hint="Du kannst die App auch ganz ohne Farbtyp nutzen.">
              Farbtyp
            </SectionTitle>
            <Card className="space-y-4 p-5">
              {season ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex overflow-hidden rounded-lg">
                    {season.palette.accent.slice(0, 6).map((s) => (
                      <span key={s.hex} className="h-8 w-6" style={{ background: s.hex }} />
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold">{season.nameDe}</p>
                    <p className="text-xs text-muted">
                      {season.nameEn} · {profile.colorType.source === 'manual' ? 'manuell gewählt' : profile.colorType.source === 'questionnaire' ? 'per Fragebogen' : ''}
                    </p>
                  </div>
                  <LinkButton to={`/farbtyp/${season.id}`} size="sm" variant="outline">
                    Details
                  </LinkButton>
                  <Button size="sm" variant="ghost" onClick={() => updateProfile((p) => ({ ...p, colorType: { ...p.colorType, seasonId: null, source: 'unset' } }))}>
                    Bewusst offenlassen
                  </Button>
                </div>
              ) : (
                <Callout title="Noch kein Farbtyp festgelegt">
                  Wähle unten direkt einen Farbtyp, erkunde die Typen in der <Link to="/farbtyp" className="underline">Farbtyp-Analyse</Link> oder lass ihn bewusst offen.
                </Callout>
              )}
              <Field label="Farbtyp manuell wählen" htmlFor="p-season">
                <select
                  id="p-season"
                  className="h-10 max-w-sm rounded-xl border border-line bg-surface px-3"
                  value={profile.colorType.seasonId ?? ''}
                  onChange={(e) =>
                    updateProfile((p) => ({
                      ...p,
                      colorType: { ...p.colorType, seasonId: (e.target.value || null) as SeasonId | null, source: e.target.value ? 'manual' : 'unset', decidedAt: new Date().toISOString() },
                    }))
                  }
                >
                  <option value="">Offen lassen</option>
                  {FAMILY_ORDER.map((f) => (
                    <optgroup key={f} label={FAMILY_LABEL[f]}>
                      {SEASONAL_12.seasons
                        .filter((s) => s.family === f)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nameDe} ({s.nameEn})
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <div>
                <p className="mb-2 text-sm font-medium">Alternative mögliche Farbtypen</p>
                <div className="flex flex-wrap gap-2">
                  {SEASONAL_12.seasons
                    .filter((s) => s.id !== profile.colorType.seasonId)
                    .map((s) => {
                      const on = profile.colorType.alternativeSeasonIds.includes(s.id);
                      return (
                        <Chip
                          key={s.id}
                          active={on}
                          onClick={() =>
                            updateProfile((p) => ({
                              ...p,
                              colorType: {
                                ...p.colorType,
                                alternativeSeasonIds: on ? p.colorType.alternativeSeasonIds.filter((x) => x !== s.id) : [...p.colorType.alternativeSeasonIds, s.id],
                              },
                            }))
                          }
                        >
                          {s.nameDe}
                        </Chip>
                      );
                    })}
                </div>
              </div>
              <Field label="Untertyp / eigene Notiz zum Farbtyp" htmlFor="p-sub">
                <SavingText id="p-sub" value={profile.colorType.subtype ?? ''} placeholder="z. B. „Warmer Herbst mit Tendenz zu Gedecktem Herbst“" onSave={(v) => updateProfile((p) => ({ ...p, colorType: { ...p.colorType, subtype: v || undefined } }))} />
              </Field>
            </Card>
          </section>

          <section aria-labelledby="pref-h">
            <SectionTitle id="pref-h" hint="Deine Vorlieben haben in allen Empfehlungen Vorrang vor theoretischen Regeln.">
              Vorlieben
            </SectionTitle>
            <Card className="space-y-5 p-5">
              <div>
                <p className="mb-2 text-sm font-medium">Stil</p>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => {
                    const on = profile.preferences.styles.includes(s);
                    return (
                      <Chip key={s} active={on} onClick={() => setPrefs({ styles: on ? profile.preferences.styles.filter((x) => x !== s) : [...profile.preferences.styles, s] })}>
                        {t.style[s]}
                      </Chip>
                    );
                  })}
                </div>
              </div>
              <Field label="Stil in eigenen Worten" htmlFor="p-style">
                <SavingText id="p-style" multiline value={profile.preferences.styleNote ?? ''} onSave={(v) => setPrefs({ styleNote: v || undefined })} />
              </Field>
              {(['favorite', 'disliked'] as const).map((kind) => {
                const list: ColorSwatch[] = kind === 'favorite' ? profile.preferences.favoriteColors : profile.preferences.dislikedColors;
                return (
                  <div key={kind}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium">{kind === 'favorite' ? 'Bevorzugte Farben' : 'Weniger bevorzugte Farben'}</p>
                      <Button size="sm" variant="outline" onClick={() => setColorModal(kind)}>
                        <Plus className="h-4 w-4" /> Farbe
                      </Button>
                    </div>
                    {list.length === 0 ? (
                      <p className="text-sm text-muted">Noch keine.</p>
                    ) : (
                      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                        {list.map((c, i) => (
                          <li key={`${c.hex}-${i}`} className="relative">
                            <Swatch hex={c.hex} name={c.name} />
                            <button
                              type="button"
                              aria-label={`${c.name} entfernen`}
                              className="absolute -top-1.5 -right-1.5 rounded-full border border-line bg-surface p-0.5"
                              onClick={() => setPrefs(kind === 'favorite' ? { favoriteColors: list.filter((_, j) => j !== i) } : { dislikedColors: list.filter((_, j) => j !== i) })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
              <Field label="Notizen" htmlFor="p-notes">
                <SavingText id="p-notes" multiline value={profile.notes ?? ''} onSave={(v) => updateProfile((p) => ({ ...p, notes: v || undefined }))} />
              </Field>
            </Card>
          </section>
          <p className="text-sm text-muted">
            Dieses Profil enthält {garments.length} Kleidungsstücke. Änderungen werden automatisch lokal gespeichert.
          </p>
        </div>
      )}

      {/* Neues Profil */}
      <Modal
        open={newOpen}
        onClose={closeNew}
        title="Neues Profil anlegen"
        description="Ein Farbtyp ist nicht nötig – du kannst ihn später bestimmen oder offenlassen."
        footer={
          <>
            <Button variant="ghost" onClick={closeNew}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              disabled={!newName.trim()}
              onClick={async () => {
                await createNewProfile(store, newName);
                closeNew();
                toast.show('Profil angelegt und aktiviert.');
                navigate('/profil');
              }}
            >
              Anlegen
            </Button>
          </>
        }
      >
        <Field label="Name oder Spitzname" htmlFor="new-name">
          <TextInput id="new-name" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={80} />
        </Field>
        <div className="mt-4 border-t border-line pt-4 text-sm">
          <p className="mb-2 text-muted">Oder ein Beispielprofil hinzufügen:</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={async () => { await setActiveProfile(store, (await addSampleProfile(store, 'starter')).id); closeNew(); }}>
              Startprofil · Warmer Herbst
            </Button>
            <Button size="sm" variant="outline" onClick={async () => { await setActiveProfile(store, (await addSampleProfile(store, 'demo')).id); closeNew(); }}>
              Demo · Kühler Sommer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Löschen bestätigen */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Profil löschen?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                const p = toDelete!;
                const backup = await exportProfile(store, p.id);
                await deleteProfile(store, p.id);
                setToDelete(null);
                toast.show(`Profil „${p.name}“ gelöscht.`, {
                  onAction: async () => {
                    const { importBackup } = await import('@/data/backup/backup');
                    await importBackup(store, backup, 'merge');
                  },
                });
              }}
            >
              Endgültig löschen
            </Button>
          </>
        }
      >
        <p className="text-sm">
          „{toDelete?.name}“ wird mit Kleiderschrank, Outfits und Bildern gelöscht. Tipp: Vorher über „Export“ sichern.
        </p>
      </Modal>

      {/* Farbe hinzufügen */}
      <Modal
        open={!!colorModal}
        onClose={() => setColorModal(null)}
        title={colorModal === 'favorite' ? 'Bevorzugte Farbe hinzufügen' : 'Weniger bevorzugte Farbe hinzufügen'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setColorModal(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const sw = { hex: pickHex, name: nameColor(pickHex).name };
                setPrefs(colorModal === 'favorite' ? { favoriteColors: [...(profile?.preferences.favoriteColors ?? []), sw] } : { dislikedColors: [...(profile?.preferences.dislikedColors ?? []), sw] });
                setColorModal(null);
              }}
            >
              Hinzufügen
            </Button>
          </>
        }
      >
        <ColorChooser value={pickHex} onChange={(h) => setPickHex(h)} groups={buildPaletteGroups(profile, season)} idPrefix="pref" />
      </Modal>
    </div>
  );
}
