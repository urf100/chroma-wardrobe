import { useMemo, useState } from 'react';
import { Check, Layers, Pencil, Plus } from 'lucide-react';
import type { Garment } from '@/domain/types';
import { useAppData } from '@/app/AppData';
import { Badge, Button, Callout, Card, EmptyState, LinkButton, PageHeader, SectionTitle, cx } from '@/components/ui/primitives';
import { GarmentThumb, useGarmentActions } from '@/components/garments';
import { matchGarments, roleOfSlot, suggestOutfits } from '@/domain/recommendation/garmentMatching';
import { SEASON_FIT_LABEL, seasonFit } from '@/domain/seasons/fit';
import { deltaE2000, describeDeltaE, nameColor } from '@/domain/color';
import { slotOf } from '@/domain/garments/catalog';
import { t } from '@/i18n';

interface Insight {
  g: Garment;
  fitLabel?: string;
  fitTone?: 'positive' | 'attention' | 'neutral';
  goodPartners: Garment[];
  outfits: number;
  similar: { g: Garment; de: number }[];
}

export default function WishlistPage() {
  const { garments, catalog, season, profile, feedback } = useAppData();
  const actions = useGarmentActions();
  const [compare, setCompare] = useState<string[]>([]);
  const wishes = garments.filter((g) => g.ownership === 'wishlist' || g.ownership === 'planned');
  const owned = garments.filter((g) => g.ownership === 'owned');

  const insights = useMemo<Insight[]>(() => {
    const ctx = { season, feedback, catalog, favoriteColors: profile?.preferences.favoriteColors.map((c) => c.hex), dislikedColors: profile?.preferences.dislikedColors.map((c) => c.hex) };
    return wishes.map((g) => {
      const fit = season ? seasonFit(g.colors[0].hex, season) : null;
      const m = matchGarments(g, owned, ctx);
      const goodPartners = Object.values(m)
        .flat()
        .filter((x) => x.evaluation.level === 'strong' || x.evaluation.level === 'good')
        .map((x) => x.garment);
      const role = roleOfSlot(slotOf(g.subcategory, catalog));
      const similar = owned
        .filter((o) => roleOfSlot(slotOf(o.subcategory, catalog)) === role)
        .map((o) => ({ g: o, de: deltaE2000(o.colors[0].hex, g.colors[0].hex) }))
        .filter((x) => x.de < 10)
        .sort((a, b) => a.de - b.de);
      return {
        g,
        fitLabel: fit ? SEASON_FIT_LABEL[fit.level] : undefined,
        fitTone: fit ? (fit.level === 'outside' ? 'attention' : fit.level === 'possible' ? 'neutral' : 'positive') : undefined,
        goodPartners,
        outfits: suggestOutfits(g, [...owned, g], { ...ctx, limit: 50 }).filter((o) => o.level !== 'careful').length,
        similar,
      };
    });
  }, [wishes, owned, season, feedback, catalog, profile]);

  const compared = insights.filter((i) => compare.includes(i.g.id));

  return (
    <div>
      <PageHeader
        title={t.nav.wishlist}
        description="Kaufideen virtuell ausprobieren, bevor du kaufst. Die Bewertung beruht auf nachvollziehbaren Informationen: Farbtyp, vorhandene Partner, ähnliche Teile und mögliche Outfits."
        actions={
          <LinkButton to="/kleiderschrank/neu?status=wishlist" variant="primary">
            <Plus className="h-4 w-4" /> Kaufidee hinzufügen
          </LinkButton>
        }
      />
      <Callout>Bevorzuge Ergänzungen, die viele neue Kombinationen ermöglichen – und verzichte auf Teile, die bereits Vorhandenes nur doppeln.</Callout>

      {wishes.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Keine Kaufideen" action={<LinkButton to="/kleiderschrank/neu?status=wishlist" variant="primary">Kaufidee hinzufügen</LinkButton>}>
            Füge ein Teil mit Status „Wunschliste“ oder „Geplante Anschaffung“ hinzu – per Farbe, Produktfoto oder Farbscanner.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {insights.map(({ g, fitLabel, fitTone, goodPartners, outfits, similar }) => (
            <li key={g.id}>
              <Card className={cx('h-full p-4', compare.includes(g.id) && 'border-ink')}>
                <div className="flex gap-4">
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-stage p-2">
                    <GarmentThumb decorative garment={g} catalog={catalog} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{g.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge tone="info">{t.ownership[g.ownership]}</Badge>
                      {g.wishlist?.priority && <Badge>Priorität {g.wishlist.priority}</Badge>}
                      {fitLabel && <Badge tone={fitTone}>{season!.nameDe}: {fitLabel}</Badge>}
                    </div>
                    {g.wishlist?.reason && <p className="mt-2 text-sm text-muted">{g.wishlist.reason}</p>}
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-surface-2 p-2">
                    <dt className="text-[11px] text-muted">Gute Partner</dt>
                    <dd className="text-lg font-semibold">{goodPartners.length}</dd>
                  </div>
                  <div className="rounded-xl bg-surface-2 p-2">
                    <dt className="text-[11px] text-muted">Mögliche Outfits</dt>
                    <dd className="text-lg font-semibold">{outfits}</dd>
                  </div>
                  <div className="rounded-xl bg-surface-2 p-2">
                    <dt className="text-[11px] text-muted">Ähnlich vorhanden</dt>
                    <dd className="text-lg font-semibold">{similar.length}</dd>
                  </div>
                </dl>
                {similar.length > 0 && (
                  <p className="mt-2 text-sm text-attention">
                    Ähnlich: {similar.slice(0, 2).map((s) => `${s.g.name} (${describeDeltaE(s.de)})`).join(', ')} – prüfe, ob das neue Teil wirklich etwas ergänzt.
                  </p>
                )}
                {goodPartners.length > 0 && (
                  <p className="mt-2 text-sm text-muted">Passt zu: {goodPartners.slice(0, 4).map((p) => p.name).join(', ')}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-1">
                  <LinkButton to={`/studio?garment=${g.id}`} size="sm" variant="outline">
                    <Layers className="h-4 w-4" /> Virtuell anprobieren
                  </LinkButton>
                  <LinkButton to={`/empfehlungen?teil=${g.id}`} size="sm" variant="ghost">
                    Kombinationen
                  </LinkButton>
                  <LinkButton to={`/kleiderschrank/${g.id}`} size="sm" variant="ghost" aria-label="Bearbeiten">
                    <Pencil className="h-4 w-4" />
                  </LinkButton>
                  <Button size="sm" variant="ghost" onClick={() => actions.setOwnership(g, 'owned')}>
                    <Check className="h-4 w-4" /> Gekauft
                  </Button>
                  <label className="ml-auto flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={compare.includes(g.id)}
                      onChange={(e) => setCompare((c) => (e.target.checked ? [...c, g.id].slice(-3) : c.filter((x) => x !== g.id)))}
                    />
                    Vergleichen
                  </label>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {compared.length >= 2 && (
        <section aria-labelledby="cmp-h" className="mt-10">
          <SectionTitle id="cmp-h">Direkter Vergleich</SectionTitle>
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="p-3 font-medium text-muted">Kriterium</th>
                  {compared.map((c) => (
                    <th key={c.g.id} className="p-3">
                      <span className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded border border-black/10" style={{ background: c.g.colors[0].hex }} />
                        {c.g.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Farbe', (i: Insight) => i.g.colors.map((c) => c.name ?? nameColor(c.hex).name).join(' / ')],
                  ['Farbtyp-Eignung', (i: Insight) => i.fitLabel ?? '–'],
                  ['Gute Partner im Schrank', (i: Insight) => String(i.goodPartners.length)],
                  ['Mögliche Outfits', (i: Insight) => String(i.outfits)],
                  ['Ähnliche vorhandene Teile', (i: Insight) => (i.similar.length ? i.similar.map((s) => s.g.name).join(', ') : 'keine')],
                  ['Priorität', (i: Insight) => (i.g.wishlist?.priority ? String(i.g.wishlist.priority) : '–')],
                ].map(([label, fn]) => (
                  <tr key={label as string} className="border-b border-line last:border-0">
                    <td className="p-3 text-muted">{label as string}</td>
                    {compared.map((c) => (
                      <td key={c.g.id} className="p-3">
                        {(fn as (i: Insight) => string)(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
