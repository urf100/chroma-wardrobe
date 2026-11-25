import { Link, useParams } from 'react-router-dom';
import { Check, Layers } from 'lucide-react';
import { useAppData } from '@/app/AppData';
import { Badge, Button, Card, Callout, EmptyState, LinkButton, PageHeader, SectionTitle } from '@/components/ui/primitives';
import { SeasonScales } from '@/components/season';
import { Swatch } from '@/components/color/Swatch';
import { DIMENSION_LABEL, FAMILY_LABEL, PALETTE_GROUPS, getSeason } from '@/domain/seasons';
import { useToast } from '@/components/ui/Toast';

export default function SeasonDetailPage() {
  const { seasonId } = useParams();
  const season = getSeason(seasonId as never);
  const { profile, updateProfile } = useAppData();
  const toast = useToast();
  if (!season) return <EmptyState title="Farbtyp nicht gefunden" action={<LinkButton to="/farbtyp">Alle Farbtypen</LinkButton>} />;
  const isMine = profile?.colorType.seasonId === season.id;
  const isAlt = profile?.colorType.alternativeSeasonIds.includes(season.id);

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link to="/farbtyp" className="text-muted underline">
          Alle Farbtypen
        </Link>
      </p>
      <PageHeader
        eyebrow={`${FAMILY_LABEL[season.family]} · ${season.nameEn}`}
        title={season.nameDe}
        description={season.summary}
        actions={
          profile && (
            <>
              <Button
                variant={isMine ? 'secondary' : 'primary'}
                disabled={isMine}
                onClick={async () => {
                  await updateProfile((p) => ({
                    ...p,
                    colorType: { ...p.colorType, seasonId: season.id, source: 'manual', decidedAt: new Date().toISOString(), alternativeSeasonIds: p.colorType.alternativeSeasonIds.filter((x) => x !== season.id) },
                  }));
                  toast.show(`${season.nameDe} als Farbtyp festgelegt.`);
                }}
              >
                <Check className="h-4 w-4" /> {isMine ? 'Dein Farbtyp' : 'Als meinen Farbtyp festlegen'}
              </Button>
              {!isMine && (
                <Button
                  variant="outline"
                  onClick={() =>
                    updateProfile((p) => ({
                      ...p,
                      colorType: {
                        ...p.colorType,
                        alternativeSeasonIds: isAlt ? p.colorType.alternativeSeasonIds.filter((x) => x !== season.id) : [...p.colorType.alternativeSeasonIds, season.id],
                      },
                    }))
                  }
                >
                  {isAlt ? 'Nicht mehr als Alternative' : 'Als Alternative merken'}
                </Button>
              )}
            </>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <Card className="p-5">
            <p className="leading-relaxed">{season.characteristics}</p>
            <p className="mt-3 text-sm text-muted">
              Hauptmerkmal: <strong>{DIMENSION_LABEL[season.primary]}</strong> · Nebenmerkmal: <strong>{DIMENSION_LABEL[season.secondary]}</strong>
            </p>
          </Card>

          {PALETTE_GROUPS.map((g) => (
            <section key={g.key} aria-labelledby={`g-${g.key}`}>
              <SectionTitle id={`g-${g.key}`} hint={g.hint}>
                {g.label}
              </SectionTitle>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {season.palette[g.key].map((s) => (
                  <li key={s.hex + s.name}>
                    <Swatch hex={s.hex} name={s.name} note={s.note} copyable />
                  </li>
                ))}
              </ul>
              {g.key === 'metals' && <p className="mt-2 text-sm text-muted">{season.metalsText}</p>}
              {g.key === 'avoid' && <p className="mt-2 text-sm text-muted">{season.avoidText}</p>}
            </section>
          ))}

          <section aria-labelledby="ex-h">
            <SectionTitle id="ex-h">Beispieloutfits</SectionTitle>
            <div className="grid gap-3 md:grid-cols-3">
              {season.exampleOutfits.map((o) => (
                <Card key={o.title} className="overflow-hidden">
                  <div className="flex h-14" aria-hidden>
                    {o.colors.map((c) => (
                      <span key={c.hex} className="flex-1" style={{ background: c.hex }} />
                    ))}
                  </div>
                  <div className="p-3">
                    <p className="font-medium">{o.title}</p>
                    <p className="text-sm text-muted">{o.description}</p>
                    <p className="mt-1 text-xs text-muted">{o.colors.map((c) => c.name).join(' · ')}</p>
                    <LinkButton to={`/studio?colors=${o.colors.map((c) => c.hex.slice(1)).join(',')}`} size="sm" variant="ghost" className="mt-2 -ml-3">
                      <Layers className="h-4 w-4" /> Im Studio ausprobieren
                    </LinkButton>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <Card className="p-5">
            <p className="mb-3 font-semibold">Charakteristik</p>
            <SeasonScales season={season} columns={1} />
          </Card>
          <Card className="p-5">
            <p className="mb-2 font-semibold">Typische Merkmale</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              {season.typicalFeatures.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Merkmale sind Tendenzen. Einzelne Merkmale bestimmen nie allein den Farbtyp – Menschen aller Hauttöne kommen in jedem Typ vor.</p>
          </Card>
          <Card className="p-5">
            <p className="mb-2 font-semibold">Abgrenzung zu verwandten Typen</p>
            <ul className="space-y-2 text-sm">
              {season.neighbors.map((n) => (
                <li key={n.seasonId}>
                  <Link to={`/farbtyp/${n.seasonId}`} className="font-medium underline">
                    {getSeason(n.seasonId)?.nameDe}
                  </Link>
                  <span className="text-muted"> – {n.difference}</span>
                </li>
              ))}
            </ul>
          </Card>
          {isAlt && <Badge tone="info">Als Alternative gemerkt</Badge>}
          <Callout>Die Paletten sind kuratierte Orientierungen. Bildschirme stellen Farben unterschiedlich dar.</Callout>
        </aside>
      </div>
    </div>
  );
}
