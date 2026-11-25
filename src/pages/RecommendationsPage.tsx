import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { Garment, OutfitSlot } from '@/domain/types';
import { useAppData } from '@/app/AppData';
import { Badge, Callout, Card, EmptyState, LinkButton, PageHeader, SectionTitle, Select, Toggle, cx } from '@/components/ui/primitives';
import { GarmentCard } from '@/components/garments';
import { MatchList } from '@/components/MatchList';
import { ColorStrip } from '@/components/color/Swatch';
import { OutfitFigure } from '@/illustrations/Figure';
import { suggestOutfits, ROLE_LABEL, type GarmentRole, matchGarments } from '@/domain/recommendation/garmentMatching';
import { LEVEL_LABEL, pairColors, pairKey } from '@/domain/recommendation/pairing';
import { garmentColor } from '@/domain/profile/factory';
import { store } from '@/data/store';
import { t } from '@/i18n';
import { slotFromGarment } from '@/domain/garments/outfitSlots';

export default function RecommendationsPage() {
  const { garments, catalog, season, profile, feedback } = useAppData();
  const [params, setParams] = useSearchParams();
  const [includePlanned, setIncludePlanned] = useState(false);
  const [role, setRole] = useState<GarmentRole | 'all'>('all');
  const owned = garments.filter((g) => g.ownership === 'owned');
  const pool = garments.filter((g) => g.ownership === 'owned' || g.ownership === 'planned' || g.ownership === 'wishlist');
  const anchor = garments.find((g) => g.id === params.get('teil')) ?? null;
  const ctx = useMemo(
    () => ({
      season,
      favoriteColors: profile?.preferences.favoriteColors.map((c) => c.hex),
      dislikedColors: profile?.preferences.dislikedColors.map((c) => c.hex),
      feedback,
      catalog,
    }),
    [season, profile, feedback, catalog],
  );
  // Ohne erfasste Hosen: beste Experimentier-Hosenfarbe aus dem Profil vorschlagen (klar als Experiment gekennzeichnet)
  const trialBottoms = profile?.customSwatches.filter((c) => c.kind === 'trial-bottom') ?? [];
  const bestTrialBottom = (hexes: string[]) =>
    trialBottoms
      .map((c) => ({ c, pts: hexes.reduce((sum, h) => sum + pairColors(h, c.hex, { season }).points, 0) }))
      .sort((a, b) => b.pts - a.pts)[0]?.c;
  const suggestions = useMemo(() => (anchor ? suggestOutfits(anchor, garments, { ...ctx, includePlanned, limit: 6 }) : []), [anchor, garments, ctx, includePlanned]);

  // Vielseitigkeit: Anzahl gut kombinierbarer Partner je Teil
  const versatility = useMemo(() => {
    return owned
      .map((g) => {
        const m = matchGarments(g, owned, ctx);
        const good = Object.values(m).flat().filter((x) => x.evaluation.level === 'strong' || x.evaluation.level === 'good').length;
        return { g, good };
      })
      .sort((a, b) => b.good - a.good);
  }, [owned, ctx]);

  return (
    <div>
      <PageHeader
        title={t.nav.recommendations}
        description="Nachvollziehbare Vorschläge aus deinem tatsächlichen Kleiderschrank – mit Begründung statt undurchsichtiger Punktzahl. Markiere Vorschläge als hilfreich oder unpassend; dein Geschmack hat Vorrang."
      />

      <section aria-labelledby="pick-h" className="mb-8">
        <SectionTitle id="pick-h" hint="Wähle ein Teil, um passende Kombinationen zu sehen – z. B. ein farbiges T-Shirt, das du öfter tragen möchtest.">
          Ausgangsteil
        </SectionTitle>
        {pool.length === 0 ? (
          <EmptyState title="Noch keine Kleidungsstücke" action={<LinkButton to="/kleiderschrank/neu" variant="primary">Kleidungsstück hinzufügen</LinkButton>} />
        ) : (
          <ul className="flex snap-x gap-3 overflow-x-auto pb-2">
            {pool.map((g) => (
              <li key={g.id} className="w-32 shrink-0 snap-start">
                <GarmentCard garment={g} catalog={catalog} compact selected={anchor?.id === g.id} onOpen={() => setParams({ teil: g.id })} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {anchor ? (
        <div className="space-y-10">
          <section aria-labelledby="out-h">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <SectionTitle id="out-h" hint={`Vollständige Outfits rund um „${anchor.name}“.`}>
                Outfit-Vorschläge
              </SectionTitle>
              <Toggle checked={includePlanned} onChange={setIncludePlanned} label="Geplante Teile & Wünsche einbeziehen" />
            </div>
            {suggestions.length === 0 ? (
              <Callout>Für vollständige Outfits fehlen noch passende Teile (z. B. eine Hose). Aktiviere geplante Teile oder ergänze deinen Kleiderschrank.</Callout>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {suggestions.map((s) => {
                  const items = Object.values(s.slots)
                    .map((id) => garments.find((g) => g.id === id))
                    .filter((g): g is Garment => !!g);
                  const slots: Partial<Record<OutfitSlot, ReturnType<typeof slotFromGarment>>> = {};
                  for (const [k, id] of Object.entries(s.slots)) {
                    const g = garments.find((x) => x.id === id);
                    if (g) slots[k as OutfitSlot] = slotFromGarment(g);
                  }
                  const trial = !slots.bottom && !slots.onepiece ? bestTrialBottom(items.map((g) => g.colors[0].hex)) : undefined;
                  if (trial) slots.bottom = { subcategory: 'chino', colors: [garmentColor(trial.hex, 1, 'main', trial.name)], pattern: { type: 'solid' } };
                  const key = pairKey(...items.map((g) => g.id));
                  const verdict = feedback.get(key);
                  return (
                    <li key={s.id}>
                      <Card className="flex h-full flex-col overflow-hidden">
                        <div className="flex justify-center bg-stage p-3">
                          <OutfitFigure
                            slots={slots}
                            options={{ jacketOpen: true, showSkin: true, showHair: true, showBeard: true }}
                            appearance={{ skin: profile?.appearance.skinTone?.hex, hair: profile?.appearance.hairColor?.hex, beard: profile?.appearance.beardColor?.hex, hasBeard: profile?.appearance.hasBeard }}
                            catalog={catalog}
                            className="h-64 w-auto"
                            title={items.map((g) => g.name).join(', ')}
                          />
                        </div>
                        <div className="flex flex-1 flex-col gap-2 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={s.level === 'careful' ? 'attention' : 'positive'}>{LEVEL_LABEL[s.level]}</Badge>
                            {s.containsPlanned && <Badge tone="info">mit geplanten Teilen</Badge>}
                            {trial && <Badge tone="attention">Hose: Farbexperiment „{trial.name}“</Badge>}
                            {!trial && !slots.bottom && !slots.onepiece && <Badge tone="attention">noch keine passende Hose erfasst</Badge>}
                          </div>
                          <ColorStrip colors={s.palette.map((hex) => ({ hex }))} height="h-4" />
                          <ul className="text-sm text-muted">
                            {items.map((g) => (
                              <li key={g.id} className="truncate">
                                {g.name}
                                {g.ownership !== 'owned' && ` (${t.ownership[g.ownership]})`}
                              </li>
                            ))}
                          </ul>
                          <ul className="space-y-1 text-xs">
                            {s.reasons.slice(0, 4).map((r, i) => (
                              <li key={i} className={r.effect === 'negative' ? 'text-attention' : 'text-muted'}>
                                {r.effect === 'positive' ? '＋ ' : r.effect === 'negative' ? '– ' : '· '}
                                {r.text}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-auto flex items-center gap-1 pt-2">
                            <LinkButton to={`/studio?ids=${items.map((g) => g.id).join(',')}${trial ? `&bottom=${trial.hex.slice(1)}` : ''}&name=${encodeURIComponent(`Vorschlag mit ${anchor.name}`)}`} size="sm" variant="outline">
                              <Layers className="h-4 w-4" /> Im Studio öffnen
                            </LinkButton>
                            <button
                              type="button"
                              aria-label="Vorschlag hilfreich"
                              aria-pressed={verdict === 'helpful'}
                              className={cx('ml-auto rounded-full p-2 hover:bg-surface-2', verdict === 'helpful' ? 'text-positive' : 'text-muted')}
                              onClick={() => profile && store.feedback.set(profile.id, key, verdict === 'helpful' ? null : 'helpful')}
                            >
                              <ThumbsUp className={cx('h-4 w-4', verdict === 'helpful' && 'fill-current')} />
                            </button>
                            <button
                              type="button"
                              aria-label="Vorschlag unpassend"
                              aria-pressed={verdict === 'unfitting'}
                              className={cx('rounded-full p-2 hover:bg-surface-2', verdict === 'unfitting' ? 'text-danger' : 'text-muted')}
                              onClick={() => profile && store.feedback.set(profile.id, key, verdict === 'unfitting' ? null : 'unfitting')}
                            >
                              <ThumbsDown className={cx('h-4 w-4', verdict === 'unfitting' && 'fill-current')} />
                            </button>
                          </div>
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="rev-h">
            <SectionTitle id="rev-h">Umgekehrte Suche</SectionTitle>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[15px]">
              Welche meiner
              <Select aria-label="Kategorie" value={role} onChange={(e) => setRole(e.target.value as GarmentRole | 'all')} className="w-auto">
                <option value="all">Teile</option>
                {(Object.keys(ROLE_LABEL) as GarmentRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </Select>
              passen zu „{anchor.name}“?
            </div>
            <Card className="p-4">
              <MatchList anchor={anchor} candidates={garments} perRole={8} roles={role === 'all' ? undefined : [role]} includePlanned={includePlanned} />
            </Card>
          </section>
        </div>
      ) : (
        pool.length > 0 && <Callout>Wähle oben ein Kleidungsstück aus.</Callout>
      )}

      {owned.length > 2 && (
        <section aria-labelledby="vers-h" className="mt-10">
          <SectionTitle id="vers-h" hint="Anzahl der vorhandenen Teile, mit denen ein Teil gut oder sehr gut kombinierbar ist.">
            Vielseitigkeit deiner Teile
          </SectionTitle>
          <ul className="grid gap-2 sm:grid-cols-2">
            {versatility.map(({ g, good }) => (
              <li key={g.id}>
                <button type="button" onClick={() => setParams({ teil: g.id })} className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-2 text-left hover:bg-surface-2">
                  <ColorStrip colors={g.colors} className="w-10" height="h-6" />
                  <span className="min-w-0 flex-1 truncate text-sm">{g.name}</span>
                  <span className="text-sm text-muted">{good} gute Partner</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
