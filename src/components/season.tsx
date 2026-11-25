import { Link } from 'react-router-dom';
import type { ColorSeason, Scale } from '@/domain/types';
import { DIMENSION_LABEL, SCALE_LABELS } from '@/domain/seasons';
import { cx } from './ui/primitives';

const AXIS = {
  temperature: { label: 'Farbtemperatur', from: 'kühl', to: 'warm', gradient: 'linear-gradient(to right, #6E8FB8, #C9C2B6, #C98A4A)' },
  value: { label: 'Helligkeit', from: 'dunkel', to: 'hell', gradient: 'linear-gradient(to right, #2A2A2C, #8C8A86, #EEEBE4)' },
  chroma: { label: 'Sättigung', from: 'gedeckt', to: 'klar', gradient: 'linear-gradient(to right, #8F8A82, #A27B60, #D8572A)' },
  contrast: { label: 'Kontrast', from: 'gering', to: 'hoch', gradient: 'linear-gradient(to right, #B9B3A8, #8A8680, #1B1B1D)' },
} as const;

/** Skala mit Text – die Position ist zusätzlich in Worten angegeben. */
export function ScaleBar({ axis, value }: { axis: keyof typeof AXIS; value: Scale }) {
  const a = AXIS[axis];
  const pct = ((value + 2) / 4) * 100;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium">{a.label}</span>
        <span className="text-muted">{SCALE_LABELS[axis][value + 2]}</span>
      </div>
      <div className="relative h-2.5 rounded-full" style={{ background: a.gradient }} aria-hidden>
        <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink shadow" style={{ left: `${pct}%` }} />
      </div>
      <div className="mt-0.5 flex justify-between text-[10px] text-muted" aria-hidden>
        <span>{a.from}</span>
        <span>{a.to}</span>
      </div>
    </div>
  );
}

export function SeasonScales({ season, className, columns = 2 }: { season: ColorSeason; className?: string; columns?: 1 | 2 }) {
  return (
    <div className={cx('grid gap-3', columns === 2 && 'sm:grid-cols-2', className)}>
      <ScaleBar axis="temperature" value={season.temperature} />
      <ScaleBar axis="value" value={season.value} />
      <ScaleBar axis="chroma" value={season.chroma} />
      <ScaleBar axis="contrast" value={season.contrast} />
    </div>
  );
}

export function SeasonCard({ season, active }: { season: ColorSeason; active?: boolean }) {
  const strip = [...season.palette.base.slice(0, 3), ...season.palette.accent.slice(0, 5)];
  return (
    <Link
      to={`/farbtyp/${season.id}`}
      className={cx('group block overflow-hidden rounded-2xl border bg-surface transition-shadow hover:shadow-md', active ? 'border-ink ring-1 ring-ink' : 'border-line')}
    >
      <div className="flex h-16" aria-hidden>
        {strip.map((s) => (
          <span key={s.hex} className="flex-1" style={{ background: s.hex }} />
        ))}
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold">{season.nameDe}</p>
          {active && <span className="text-xs font-semibold">Dein Typ</span>}
        </div>
        <p className="text-xs text-muted">
          {season.nameEn} · {DIMENSION_LABEL[season.primary]} & {DIMENSION_LABEL[season.secondary]}
        </p>
        <p className="mt-2 text-sm text-muted">{season.summary}</p>
      </div>
    </Link>
  );
}
