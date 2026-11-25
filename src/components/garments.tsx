import { useNavigate } from 'react-router-dom';
import { Archive, ArchiveRestore, Copy, ExternalLink, Heart, Layers, Pencil, Star, Trash2 } from 'lucide-react';
import type { Garment } from '@/domain/types';
import { GarmentIllustration } from '@/illustrations/Figure';
import { type Catalog, subcategoryLabel } from '@/domain/garments/catalog';
import { nameColor } from '@/domain/color';
import { t } from '@/i18n';
import { store } from '@/data/store';
import { duplicateGarment } from '@/domain/profile/factory';
import { nowIso } from '@/domain/id';
import { useImageUrl } from '@/data/hooks';
import { Badge, Button, cx } from './ui/primitives';
import { useToast } from './ui/Toast';
import { ColorStrip, Swatch } from './color/Swatch';
import { Modal } from './ui/Modal';
import { useAppData } from '@/app/AppData';
import { SEASON_FIT_LABEL, seasonFit } from '@/domain/seasons/fit';
import { MatchList } from './MatchList';

export function ownershipTone(o: Garment['ownership']) {
  return o === 'owned' ? 'positive' : o === 'planned' || o === 'wishlist' ? 'info' : 'neutral';
}

export function GarmentThumb({ garment, catalog, className, decorative }: { garment: Garment; catalog?: Catalog; className?: string; decorative?: boolean }) {
  return (
    <GarmentIllustration
      subcategory={garment.subcategory}
      colors={garment.colors}
      pattern={garment.pattern}
      attributes={garment.attributes}
      catalog={catalog}
      className={className}
      title={garment.name}
      decorative={decorative}
    />
  );
}

export function GarmentCard({ garment, onOpen, catalog, compact = false, selected }: { garment: Garment; onOpen: () => void; catalog?: Catalog; compact?: boolean; selected?: boolean }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      className={cx(
        'group flex w-full flex-col overflow-hidden rounded-2xl border bg-surface text-left transition-shadow hover:shadow-md',
        selected ? 'border-ink ring-1 ring-ink' : 'border-line',
      )}
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-stage p-3">
        <GarmentThumb decorative garment={garment} catalog={catalog} className="h-full w-full" />
        {garment.favorite && <Heart className="absolute top-2 right-2 h-4 w-4 fill-current text-ink" aria-label="Lieblingsstück" />}
      </div>
      <div className={cx('flex flex-1 flex-col gap-1.5', compact ? 'p-2' : 'p-3')}>
        <p className={cx('line-clamp-2 font-medium', compact ? 'text-xs' : 'text-sm')}>{garment.name}</p>
        <ColorStrip colors={garment.colors} />
        {!compact && (
          <p className="truncate text-xs text-muted">
            {garment.colors.map((c) => c.name ?? nameColor(c.hex).name).join(' · ')}
          </p>
        )}
        {!compact && garment.ownership !== 'owned' && (
          <div className="flex flex-wrap gap-1">
            <Badge tone={ownershipTone(garment.ownership)}>{t.ownership[garment.ownership]}</Badge>
          </div>
        )}
      </div>
    </button>
  );
}

/** Aktionen mit Rückgängig-Funktion. */
export function useGarmentActions() {
  const toast = useToast();
  return {
    duplicate: async (g: Garment) => {
      const copy = duplicateGarment(g);
      await store.garments.put(copy);
      toast.show('Kleidungsstück dupliziert.');
      return copy;
    },
    setOwnership: async (g: Garment, ownership: Garment['ownership']) => {
      const prev = g.ownership;
      await store.garments.put({ ...g, ownership, updatedAt: nowIso() });
      toast.show(`Status: ${t.ownership[ownership]}`, {
        onAction: () => void store.garments.put({ ...g, ownership: prev }),
      });
    },
    remove: async (g: Garment) => {
      await store.garments.delete(g.id);
      if (g.photoImageId) {
        const img = await store.images.get(g.photoImageId);
        await store.images.delete(g.photoImageId);
        toast.show(`„${g.name}“ gelöscht.`, {
          onAction: async () => {
            if (img) await store.images.put(img);
            await store.garments.put(g);
          },
        });
        return;
      }
      toast.show(`„${g.name}“ gelöscht.`, { onAction: () => void store.garments.put(g) });
    },
    toggleFavorite: async (g: Garment) => {
      await store.garments.put({ ...g, favorite: !g.favorite, updatedAt: nowIso() });
    },
  };
}

export function GarmentDetailModal({ garment, onClose }: { garment: Garment | null; onClose: () => void }) {
  const { catalog, season, garments } = useAppData();
  const actions = useGarmentActions();
  const navigate = useNavigate();
  const photo = useImageUrl(garment?.photoImageId);
  if (!garment) return null;
  const fit = season ? seasonFit(garment.colors[0].hex, season) : null;
  const sub = catalog.subcategories.get(garment.subcategory);
  const attrs = (sub?.attributes ?? []).map((a) => `${a.label}: ${a.options.find((o) => o.value === garment.attributes[a.key])?.label ?? '–'}`);
  return (
    <Modal open={!!garment} onClose={onClose} title={garment.name} description={`${subcategoryLabel(garment.subcategory, catalog)} · ${t.ownership[garment.ownership]}`} size="lg">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <div className="space-y-3">
          <div className="flex aspect-square items-center justify-center rounded-2xl bg-stage p-4">
            <GarmentThumb decorative garment={garment} catalog={catalog} className="h-full w-full" />
          </div>
          {photo && <img src={photo} alt={`Foto: ${garment.name}`} className="w-full rounded-2xl object-cover" />}
        </div>
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {garment.sample && <Badge tone="sample">{t.common.sample}</Badge>}
            {garment.colorIsApproximation && <Badge tone="attention">{t.common.approx}</Badge>}
            <Badge>{t.pattern[garment.pattern.type]}</Badge>
            {fit && <Badge tone={fit.level === 'outside' ? 'attention' : fit.level === 'possible' ? 'neutral' : 'positive'}>{season!.nameDe}: {SEASON_FIT_LABEL[fit.level]}</Badge>}
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {garment.colors.map((c, i) => (
              <Swatch key={i} hex={c.hex} name={c.name ?? nameColor(c.hex).name} note={garment.colors.length > 1 ? `${Math.round(c.share * 100)} %` : undefined} copyable />
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ['Marke', garment.brand],
              ['Modell', garment.model],
              ['Material', garment.material],
              ['Textur', garment.texture],
              ['Passform', garment.fit ? t.fit[garment.fit] : undefined],
              ['Jahreszeiten', garment.seasons.map((s) => t.wearSeason[s]).join(', ')],
              ['Stil', garment.styles.map((s) => t.style[s]).join(', ')],
              ['Details', attrs.join(' · ')],
              ['Kaufstatus', garment.purchaseStatus ? t.purchase[garment.purchaseStatus] : undefined],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="truncate">{v}</dd>
                </div>
              ))}
          </dl>
          {garment.notes && <p className="rounded-xl bg-surface-2 p-3 text-sm">{garment.notes}</p>}
          {garment.productUrl && /^https?:\/\//i.test(garment.productUrl) && (
            <a href={garment.productUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-sm underline">
              Produktlink öffnen <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => navigate(`/kleiderschrank/${garment.id}`)}>
              <Pencil className="h-4 w-4" /> {t.common.edit}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/studio?garment=${garment.id}`)}>
              <Layers className="h-4 w-4" /> Im Studio ausprobieren
            </Button>
            <Button variant="outline" onClick={() => actions.toggleFavorite(garment)} aria-pressed={garment.favorite}>
              <Star className={cx('h-4 w-4', garment.favorite && 'fill-current')} /> Lieblingsstück
            </Button>
            <Button variant="ghost" onClick={async () => { await actions.duplicate(garment); onClose(); }}>
              <Copy className="h-4 w-4" /> {t.common.duplicate}
            </Button>
            {garment.ownership === 'archived' || garment.ownership === 'sold' ? (
              <Button variant="ghost" onClick={() => actions.setOwnership(garment, 'owned')}>
                <ArchiveRestore className="h-4 w-4" /> {t.common.restore}
              </Button>
            ) : (
              <Button variant="ghost" onClick={async () => { await actions.setOwnership(garment, 'archived'); onClose(); }}>
                <Archive className="h-4 w-4" /> {t.common.archive}
              </Button>
            )}
            <Button variant="ghost" className="text-danger" onClick={async () => { await actions.remove(garment); onClose(); }}>
              <Trash2 className="h-4 w-4" /> {t.common.delete}
            </Button>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Passt gut zu</h3>
            <MatchList anchor={garment} candidates={garments} perRole={4} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
