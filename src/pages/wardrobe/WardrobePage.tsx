import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Shirt } from 'lucide-react';
import type { Garment } from '@/domain/types';
import { useAppData } from '@/app/AppData';
import { LinkButton, Chip, EmptyState, PageHeader, Segmented, TextInput, Callout } from '@/components/ui/primitives';
import { GarmentCard, GarmentDetailModal } from '@/components/garments';
import { nameColor } from '@/domain/color';
import { subcategoryLabel } from '@/domain/garments/catalog';
import { t } from '@/i18n';

type StatusFilter = 'owned' | 'future' | 'archive' | 'all';

const STATUS_MATCH: Record<StatusFilter, (g: Garment) => boolean> = {
  owned: (g) => g.ownership === 'owned',
  future: (g) => g.ownership === 'planned' || g.ownership === 'wishlist',
  archive: (g) => g.ownership === 'archived' || g.ownership === 'sold',
  all: () => true,
};

export default function WardrobePage() {
  const { garments, catalog, profile } = useAppData();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<StatusFilter>('owned');
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const openId = params.get('teil');
  const open = garments.find((g) => g.id === openId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return garments
      .filter(STATUS_MATCH[status])
      .filter((g) => !category || g.category === category)
      .filter((g) => !favOnly || g.favorite)
      .filter(
        (g) =>
          !q ||
          [g.name, g.brand, g.model, subcategoryLabel(g.subcategory, catalog), ...g.colors.map((c) => c.name ?? nameColor(c.hex).name)]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [garments, status, category, favOnly, query, catalog]);

  const counts = useMemo(() => Object.fromEntries((Object.keys(STATUS_MATCH) as StatusFilter[]).map((k) => [k, garments.filter(STATUS_MATCH[k]).length])), [garments]);
  const usedCategories = catalog.categories.filter((c) => garments.some((g) => g.category === c.id && STATUS_MATCH[status](g)));

  return (
    <div>
      <PageHeader
        eyebrow={profile?.name}
        title={t.nav.wardrobe}
        description="Alle Kleidungsstücke mit ihren tatsächlichen Farben. Vorhandene Teile, geplante Anschaffungen und Wünsche sind klar getrennt."
        actions={
          <LinkButton to="/kleiderschrank/neu" variant="primary" size="lg">
            <Plus className="h-5 w-5" /> Kleidungsstück hinzufügen
          </LinkButton>
        }
      />

      <div className="mb-5 flex flex-col gap-3">
        <Segmented<StatusFilter>
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'owned', label: `Vorhanden (${counts.owned})` },
            { value: 'future', label: `Geplant & Wunsch (${counts.future})` },
            { value: 'archive', label: `Archiv (${counts.archive})` },
            { value: 'all', label: `Alle (${counts.all})` },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <TextInput aria-label="Kleiderschrank durchsuchen" placeholder="Suchen: Name, Marke, Farbe …" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <Chip active={category === null} onClick={() => setCategory(null)}>
            Alle Kategorien
          </Chip>
          {usedCategories.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setCategory(category === c.id ? null : c.id)}>
              {c.label}
            </Chip>
          ))}
          <Chip active={favOnly} onClick={() => setFavOnly((f) => !f)}>
            ♥ Lieblingsstücke
          </Chip>
        </div>
      </div>

      {status === 'owned' && garments.some((g) => g.sample) && (
        <div className="mb-5">
          <Callout>
            Die Teile des Startprofils sind <strong>Beispieldaten</strong> mit geschätzten Farben. Du kannst sie bearbeiten, löschen oder durch eigene Teile
            ersetzen.
          </Callout>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Shirt className="h-8 w-8" />}
          title={garments.length === 0 ? 'Dein Kleiderschrank ist noch leer' : 'Keine passenden Kleidungsstücke'}
          action={
            <LinkButton to="/kleiderschrank/neu" variant="primary">
              <Plus className="h-4 w-4" /> Erstes Kleidungsstück hinzufügen
            </LinkButton>
          }
        >
          {garments.length === 0
            ? 'Beginne mit den Teilen, die du am häufigsten trägst – z. B. deinen T-Shirts, deiner Lieblingshose und deiner Jacke.'
            : 'Ändere die Filter oder die Suche.'}
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filtered.map((g) => (
            <li key={g.id}>
              <GarmentCard garment={g} catalog={catalog} onOpen={() => setParams({ teil: g.id })} />
            </li>
          ))}
        </ul>
      )}

      <GarmentDetailModal
        garment={open}
        onClose={() => {
          params.delete('teil');
          setParams(params);
        }}
      />
    </div>
  );
}
