import { useMemo, useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import type { Garment } from '@/domain/types';
import { matchGarments, ROLE_LABEL, type GarmentRole } from '@/domain/recommendation/garmentMatching';
import { LEVEL_LABEL, pairKey } from '@/domain/recommendation/pairing';
import { useAppData } from '@/app/AppData';
import { store } from '@/data/store';
import { GarmentIllustration } from '@/illustrations/Figure';
import { Badge, cx } from './ui/primitives';
import { t } from '@/i18n';

/** Passende Teile je Rolle, mit Begründung und Feedback-Knöpfen. */
export function MatchList({
  anchor,
  candidates,
  perRole = 3,
  roles,
  includePlanned = true,
}: {
  anchor: Garment;
  candidates: Garment[];
  perRole?: number;
  roles?: GarmentRole[];
  includePlanned?: boolean;
}) {
  const { season, profile, feedback, catalog } = useAppData();
  const [expanded, setExpanded] = useState<string | null>(null);
  const matches = useMemo(
    () =>
      matchGarments(
        anchor,
        candidates.filter((g) => g.ownership === 'owned' || (includePlanned && (g.ownership === 'planned' || g.ownership === 'wishlist'))),
        {
          season,
          favoriteColors: profile?.preferences.favoriteColors.map((c) => c.hex),
          dislikedColors: profile?.preferences.dislikedColors.map((c) => c.hex),
          feedback,
          catalog,
        },
      ),
    [anchor, candidates, season, profile, feedback, catalog, includePlanned],
  );
  const shown = (roles ?? (Object.keys(matches) as GarmentRole[])).filter((r) => matches[r].length);
  if (!shown.length) return <p className="text-sm text-muted">Noch keine anderen Kleidungsstücke zum Kombinieren erfasst.</p>;
  return (
    <div className="space-y-4">
      {shown.map((role) => (
        <div key={role}>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{ROLE_LABEL[role]}</p>
          <ul className="space-y-2">
            {matches[role].slice(0, perRole).map(({ garment, evaluation }) => {
              const key = pairKey(anchor.id, garment.id);
              const verdict = feedback.get(key);
              const open = expanded === key;
              return (
                <li key={garment.id} className="rounded-xl border border-line">
                  <div className="flex items-center gap-3 p-2">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-stage p-1">
                      <GarmentIllustration decorative subcategory={garment.subcategory} colors={garment.colors} pattern={garment.pattern} attributes={garment.attributes} catalog={catalog} className="h-full w-full" />
                    </div>
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setExpanded(open ? null : key)} aria-expanded={open}>
                      <span className="block truncate text-sm font-medium">{garment.name}</span>
                      <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        <span>{LEVEL_LABEL[evaluation.level]}</span>
                        {garment.ownership !== 'owned' && <Badge tone="info">{t.ownership[garment.ownership]}</Badge>}
                        <span className="underline">{open ? 'weniger' : 'warum?'}</span>
                      </span>
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label="Als hilfreich markieren"
                        aria-pressed={verdict === 'helpful'}
                        onClick={() => profile && store.feedback.set(profile.id, key, verdict === 'helpful' ? null : 'helpful')}
                        className={cx('rounded-full p-1.5 hover:bg-surface-2', verdict === 'helpful' ? 'text-positive' : 'text-muted')}
                      >
                        <ThumbsUp className={cx('h-4 w-4', verdict === 'helpful' && 'fill-current')} />
                      </button>
                      <button
                        type="button"
                        aria-label="Als unpassend markieren"
                        aria-pressed={verdict === 'unfitting'}
                        onClick={() => profile && store.feedback.set(profile.id, key, verdict === 'unfitting' ? null : 'unfitting')}
                        className={cx('rounded-full p-1.5 hover:bg-surface-2', verdict === 'unfitting' ? 'text-danger' : 'text-muted')}
                      >
                        <ThumbsDown className={cx('h-4 w-4', verdict === 'unfitting' && 'fill-current')} />
                      </button>
                    </div>
                  </div>
                  {open && (
                    <ul className="space-y-1 border-t border-line px-3 py-2 text-xs">
                      {evaluation.reasons.map((r, i) => (
                        <li key={i} className={cx(r.effect === 'negative' ? 'text-attention' : 'text-muted')}>
                          {r.effect === 'positive' ? '＋ ' : r.effect === 'negative' ? '– ' : '· '}
                          {r.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
