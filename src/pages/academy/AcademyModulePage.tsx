import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { EmptyState, LinkButton, PageHeader } from '@/components/ui/primitives';
import { MODULES, useModule } from './modules';

export default function AcademyModulePage() {
  const { moduleId } = useParams();
  const m = useModule(moduleId);
  if (!m || !m.ready || !m.Component) return <EmptyState title="Dieses Lernmodul ist noch nicht verfügbar" action={<LinkButton to="/akademie">Zur Farbakademie</LinkButton>} />;
  const ready = MODULES.filter((x) => x.ready);
  const idx = ready.findIndex((x) => x.id === m.id);
  const prev = ready[idx - 1];
  const next = ready[idx + 1];
  const C = m.Component;
  return (
    <article className="mx-auto max-w-4xl">
      <p className="mb-2 text-sm">
        <Link to="/akademie" className="text-muted underline">
          Farbakademie
        </Link>
      </p>
      <PageHeader eyebrow={m.level} title={m.title} description={m.summary} />
      <C />
      <nav className="mt-12 flex flex-col justify-between gap-3 border-t border-line pt-4 sm:flex-row" aria-label="Weitere Module">
        {prev ? (
          <LinkButton to={`/akademie/${prev.id}`} variant="ghost" className="h-auto min-h-10 py-2">
            <ArrowLeft className="h-4 w-4" /> {prev.title}
          </LinkButton>
        ) : (
          <span />
        )}
        {next && (
          <LinkButton to={`/akademie/${next.id}`} variant="outline" className="h-auto min-h-10 self-end py-2">
            {next.title} <ArrowRight className="h-4 w-4" />
          </LinkButton>
        )}
      </nav>
    </article>
  );
}
