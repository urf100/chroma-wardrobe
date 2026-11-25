import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge, PageHeader, SectionTitle, cx } from '@/components/ui/primitives';
import { t } from '@/i18n';
import { MODULES, type Level } from './modules';

const LEVELS: { level: Level; hint: string }[] = [
  { level: 'Einstieg', hint: 'Ohne Vorwissen: Was Farbe ist und wie man sie beschreibt.' },
  { level: 'Grundlagen', hint: 'Die Werkzeuge für stimmige Outfits.' },
  { level: 'Vertiefung', hint: 'Feinheiten für den persönlichen Stil.' },
];

export default function AcademyPage() {
  return (
    <div>
      <PageHeader
        title={t.nav.academy}
        description="Farbtheorie verständlich, visuell und zum Ausprobieren – von „Was ist ein HEX-Code?“ bis zur Frage, warum Grau und Braun manchmal nicht harmonieren."
      />
      <div className="space-y-10">
        {LEVELS.map(({ level, hint }) => (
          <section key={level} aria-labelledby={`lvl-${level}`}>
            <SectionTitle id={`lvl-${level}`} hint={hint}>
              {level}
            </SectionTitle>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.filter((m) => m.level === level).map((m) => (
                <li key={m.id}>
                  {m.ready ? (
                    <Link to={`/akademie/${m.id}`} className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-md">
                      <p className="font-semibold">{m.title}</p>
                      <p className="mt-1 flex-1 text-sm text-muted">{m.summary}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
                        Starten <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  ) : (
                    <div className={cx('flex h-full flex-col rounded-2xl border border-dashed border-line p-4')}>
                      <p className="font-semibold text-muted">{m.title}</p>
                      <p className="mt-1 flex-1 text-sm text-muted">{m.summary}</p>
                      <Badge tone="attention" className="mt-3 self-start">
                        {t.common.notImplemented}
                      </Badge>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
