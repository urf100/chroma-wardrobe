import { ClipboardList } from 'lucide-react';
import { useAppData } from '@/app/AppData';
import { Badge, Callout, Card, LinkButton, PageHeader, SectionTitle } from '@/components/ui/primitives';
import { SeasonCard } from '@/components/season';
import { FAMILY_LABEL, FAMILY_ORDER, SEASONAL_12, getSeason } from '@/domain/seasons';
import { t } from '@/i18n';

const FAMILY_TEXT = {
  spring: 'Warm und klar – frische, lebendige Farben mit Gelbanteil.',
  summer: 'Kühl und weich – sanfte Farben mit Blau- oder Grauanteil.',
  autumn: 'Warm und gedeckt – erdige, satte Farben.',
  winter: 'Kühl und klar – kontrastreiche, reine Farben.',
} as const;

export default function AnalysisPage() {
  const { season, profile } = useAppData();
  return (
    <div>
      <PageHeader
        title={t.nav.analysis}
        description="Saisonale Farbtypen sind ein ästhetisches Orientierungssystem – keine wissenschaftlich eindeutige Diagnose. Sie helfen, Farben zu finden, die mit deinen natürlichen Farben harmonieren."
      />

      <div className="mb-10 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Dein aktueller Farbtyp</p>
          {season ? (
            <>
              <p className="mt-1 font-display text-2xl">{season.nameDe}</p>
              <p className="text-sm text-muted">{season.summary}</p>
              {profile && profile.colorType.alternativeSeasonIds.length > 0 && (
                <p className="mt-2 text-sm">
                  Alternativen: {profile.colorType.alternativeSeasonIds.map((id) => getSeason(id)?.nameDe).join(', ')}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <LinkButton to={`/farbtyp/${season.id}`} variant="primary" size="sm">
                  Mehr erfahren
                </LinkButton>
                <LinkButton to="/profil" variant="outline" size="sm">
                  Ändern
                </LinkButton>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 font-display text-2xl">Noch offen</p>
              <p className="text-sm text-muted">Kein Problem: Alle Funktionen sind auch ohne Farbtyp nutzbar. Erkunde die Typen unten und wähle einen aus, wenn er sich richtig anfühlt.</p>
            </>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-muted" aria-hidden />
            <p className="font-semibold">Geführter Farbtyp-Fragebogen</p>
            <Badge tone="attention">{t.common.notImplemented}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            Ein mehrstufiger Assistent mit visuellen Vergleichen (warme/kühle Farben, Gold/Silber, Weißtöne, Kontrast, optional eigenes Foto) und
            transparenter Auswertung ist für Phase 2 geplant. Das Bewertungsmodell ist bereits dokumentiert (docs/QUESTIONNAIRE_MODEL.md).
          </p>
          <p className="mt-2 text-sm text-muted">Bis dahin: Farbtyp im Profil manuell wählen, ändern oder bewusst offenlassen.</p>
        </Card>
      </div>

      <Callout title="So liest du die Farbtypen">
        Jeder Typ wird durch ein Hauptmerkmal (z. B. „warm“) und ein Nebenmerkmal (z. B. „gedeckt“) beschrieben. Benachbarte Typen teilen ein Merkmal –
        deshalb gibt es oft mehrere plausible Typen. Persönlicher Geschmack und individuelle Anpassungen sind ausdrücklich erlaubt.
      </Callout>

      <div className="mt-8 space-y-10">
        {FAMILY_ORDER.map((f) => (
          <section key={f} aria-labelledby={`fam-${f}`}>
            <SectionTitle id={`fam-${f}`} hint={FAMILY_TEXT[f]}>
              {FAMILY_LABEL[f]}
            </SectionTitle>
            <div className="grid gap-4 md:grid-cols-3">
              {SEASONAL_12.seasons
                .filter((s) => s.family === f)
                .map((s) => (
                  <SeasonCard key={s.id} season={s} active={s.id === season?.id} />
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
