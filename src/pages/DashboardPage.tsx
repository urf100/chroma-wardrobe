import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, GraduationCap, Layers, Plus, ScanLine, Sparkles } from 'lucide-react';
import { useAppData } from '@/app/AppData';
import { Badge, Callout, Card, LinkButton, PageHeader, SectionTitle } from '@/components/ui/primitives';
import { ColorStrip } from '@/components/color/Swatch';
import { OutfitFigure } from '@/illustrations/Figure';
import { garmentColor } from '@/domain/profile/factory';
import { colorProfile } from '@/domain/color';
import { useSetting } from '@/data/hooks';
import { SETTINGS } from '@/data/store';
import { TEE_PAIRINGS } from '@/domain/examples/curated';
import { deltaE2000 } from '@/domain/color';

function Distribution({ label, parts }: { label: string; parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div>
      <p className="mb-1 text-xs font-medium">{label}</p>
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        {parts.map((p) => (
          <span key={p.label} style={{ flex: p.value, background: p.color }} />
        ))}
      </div>
      <p className="mt-1 text-[11px] text-muted">{parts.map((p) => `${p.label} ${Math.round((p.value / total) * 100)} %`).join(' · ')}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { profile, season, garments, outfits } = useAppData();
  const lastBackup = useSetting<string>(SETTINGS.lastBackupAt);
  const owned = garments.filter((g) => g.ownership === 'owned');
  const planned = garments.filter((g) => g.ownership === 'planned' || g.ownership === 'wishlist');

  const stats = useMemo(() => {
    const ps = owned.map((g) => colorProfile(g.colors[0].hex));
    return {
      light: ps.filter((p) => p.L >= 0.6).length,
      dark: ps.filter((p) => p.L < 0.6).length,
      neutral: ps.filter((p) => p.neutrality !== 'color').length,
      color: ps.filter((p) => p.neutrality === 'color').length,
      warm: ps.filter((p) => p.temperatureScore > 0.12).length,
      cool: ps.filter((p) => p.temperatureScore < -0.12).length,
      neutralTemp: ps.filter((p) => Math.abs(p.temperatureScore) <= 0.12).length,
    };
  }, [owned]);

  // Farbige T-Shirts aus dem Bestand mit kuratierten Partnern
  const teeIdeas = useMemo(
    () =>
      TEE_PAIRINGS.map((p) => ({ p, tee: owned.find((g) => deltaE2000(g.colors[0].hex, p.tee.hex) < 3) }))
        .filter((x) => x.tee)
        .slice(0, 3),
    [owned],
  );

  const backupDays = lastBackup ? Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000) : null;

  if (!profile)
    return (
      <div>
        <PageHeader title="Willkommen bei ChromaWardrobe" description="Lege ein Profil an, um loszulegen." />
        <LinkButton to="/profil?neu=1" variant="primary">
          Profil anlegen
        </LinkButton>
      </div>
    );

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-muted uppercase">Übersicht</p>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">{profile.sample ? 'Willkommen.' : `Hallo, ${profile.name}.`}</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
            Entdecke, welche Farben zu dir passen, kombiniere deine Kleidung neu und triff bewusstere Kaufentscheidungen. Alle Daten bleiben auf diesem
            Gerät.
          </p>
          {profile.sample && (
            <Badge tone="sample" className="mt-3">
              {profile.sample === 'starter' ? 'Startprofil mit Beispieldaten – frei bearbeitbar' : 'Demo-Profil'}
            </Badge>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <LinkButton to="/kleiderschrank/neu" variant="primary">
              <Plus className="h-4 w-4" /> Kleidungsstück hinzufügen
            </LinkButton>
            <LinkButton to="/studio" variant="outline">
              <Layers className="h-4 w-4" /> Outfit-Studio
            </LinkButton>
            <LinkButton to="/scanner" variant="ghost">
              <ScanLine className="h-4 w-4" /> Farbe scannen
            </LinkButton>
          </div>
        </div>
        <div className="hidden justify-center rounded-3xl bg-stage p-4 lg:flex">
          <OutfitFigure
            slots={{
              base: { subcategory: 'oversized-tee', colors: [garmentColor('#35483C')], pattern: { type: 'solid' } },
              outer: { subcategory: 'leather-jacket', colors: [garmentColor('#3D2920')], pattern: { type: 'solid' } },
              bottom: { subcategory: 'chino', colors: [garmentColor('#CBB99C')], pattern: { type: 'solid' } },
              shoes: { subcategory: 'chelsea', colors: [garmentColor('#4F382E')], pattern: { type: 'solid' } },
            }}
            options={{ jacketOpen: true, showSkin: true, showHair: true, showBeard: true }}
            appearance={{ skin: profile.appearance.skinTone?.hex, hair: profile.appearance.hairColor?.hex, beard: profile.appearance.beardColor?.hex, hasBeard: profile.appearance.hasBeard }}
            className="h-72 w-auto"
            title="Beispieloutfit: Dunkelgrün, Sandbeige, Dunkelbraun"
          />
        </div>
      </section>

      {(backupDays === null || backupDays > 30) && (owned.length > 0 || outfits.length > 0) && (
        <Callout tone="attention" title={backupDays === null ? 'Noch kein Backup' : `Letztes Backup vor ${backupDays} Tagen`}>
          Browserdaten können verloren gehen, wenn der Speicher geleert wird.{' '}
          <Link to="/einstellungen" className="inline-flex items-center gap-1 font-medium text-ink underline">
            <Download className="h-3.5 w-3.5" /> Jetzt sichern
          </Link>
        </Callout>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Farbtyp</p>
          {season ? (
            <>
              <p className="mt-1 font-display text-2xl">{season.nameDe}</p>
              <ColorStrip colors={[...season.palette.base.slice(0, 3), ...season.palette.accent.slice(0, 5)]} height="h-4" className="mt-3" />
              <LinkButton to="/palette" size="sm" variant="ghost" className="mt-3 -ml-3">
                Meine Palette <ArrowRight className="h-4 w-4" />
              </LinkButton>
            </>
          ) : (
            <>
              <p className="mt-1 font-display text-2xl">Noch offen</p>
              <p className="text-sm text-muted">Du kannst die App auch ohne Farbtyp nutzen.</p>
              <LinkButton to="/farbtyp" size="sm" variant="ghost" className="mt-2 -ml-3">
                <Sparkles className="h-4 w-4" /> Farbtypen erkunden
              </LinkButton>
            </>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Kleiderschrank</p>
          <p className="mt-1 font-display text-2xl">{owned.length} Teile</p>
          <p className="text-sm text-muted">
            {planned.length} geplant / auf der Wunschliste · {outfits.length} gespeicherte Outfits
          </p>
          <LinkButton to="/kleiderschrank" size="sm" variant="ghost" className="mt-2 -ml-3">
            Öffnen <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </Card>
        <Card className="space-y-3 p-5">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Farbverteilung</p>
          {owned.length === 0 ? (
            <p className="text-sm text-muted">Sobald du Kleidung erfasst hast, siehst du hier die Verteilung.</p>
          ) : (
            <>
              <Distribution label="Hell / dunkel" parts={[{ label: 'hell', value: stats.light, color: '#E2DCCF' }, { label: 'dunkel', value: stats.dark, color: '#3B3A38' }]} />
              <Distribution label="Neutral / farbig" parts={[{ label: 'neutral', value: stats.neutral, color: '#B9B2A6' }, { label: 'farbig', value: stats.color, color: '#A65C3D' }]} />
              <Distribution
                label="Warm / kühl"
                parts={[
                  { label: 'warm', value: stats.warm, color: '#C98A4A' },
                  { label: 'neutral', value: stats.neutralTemp, color: '#B5B1A9' },
                  { label: 'kühl', value: stats.cool, color: '#6E8FB8' },
                ]}
              />
            </>
          )}
        </Card>
      </section>

      {profile.preferences.goals && (
        <section aria-labelledby="goal-h">
          <SectionTitle id="goal-h">Dein Ziel</SectionTitle>
          <Card className="p-5">
            <p className="text-[15px] leading-relaxed">{profile.preferences.goals}</p>
          </Card>
        </section>
      )}

      {teeIdeas.length > 0 && (
        <section aria-labelledby="tee-h">
          <SectionTitle id="tee-h" hint="Statt wieder zum weißen T-Shirt zu greifen: Diese Kombinationen funktionieren unkompliziert.">
            Farbige T-Shirts, leicht gemacht
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            {teeIdeas.map(({ p, tee }) => (
              <Card key={p.tee.hex} className="overflow-hidden">
                <div className="flex justify-center gap-2 bg-stage p-3">
                  {p.pairs.slice(0, 2).map((pair) => (
                    <OutfitFigure
                      key={pair.hex}
                      slots={{
                        base: { subcategory: tee!.subcategory, colors: tee!.colors, pattern: tee!.pattern },
                        bottom: { subcategory: 'chino', colors: [garmentColor(pair.hex)], pattern: { type: 'solid' } },
                        shoes: { subcategory: 'sneaker', colors: [garmentColor('#F1EEE7')], pattern: { type: 'solid' } },
                      }}
                      options={{ jacketOpen: true, showSkin: true, showHair: true, showBeard: true }}
                      appearance={{ skin: profile.appearance.skinTone?.hex, hair: profile.appearance.hairColor?.hex, beard: profile.appearance.beardColor?.hex, hasBeard: profile.appearance.hasBeard }}
                      className="h-48 w-auto"
                      title={`${p.tee.name} mit ${pair.name}`}
                    />
                  ))}
                </div>
                <div className="p-4">
                  <p className="font-semibold">{tee!.name}</p>
                  <p className="text-sm text-muted">Passt zu: {p.pairs.map((x) => x.name).join(', ')}</p>
                  <LinkButton to={`/empfehlungen?teil=${tee!.id}`} size="sm" variant="ghost" className="mt-2 -ml-3">
                    Outfits aus meinem Schrank <ArrowRight className="h-4 w-4" />
                  </LinkButton>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="learn-h">
        <SectionTitle id="learn-h">Weiter lernen</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['grau-braun', 'Warum Grau und Braun manchmal nicht harmonieren'],
            ['t-shirts', 'Farbige T-Shirts kombinieren'],
            ['warm-kuehl', 'Warme und kühle Farben'],
          ].map(([id, title]) => (
            <Link key={id} to={`/akademie/${id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:shadow-md">
              <GraduationCap className="h-5 w-5 shrink-0 text-muted" aria-hidden />
              <span className="text-sm font-medium">{title}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
