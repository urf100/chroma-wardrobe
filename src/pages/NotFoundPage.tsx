import { LinkButton, EmptyState } from '@/components/ui/primitives';

export default function NotFoundPage() {
  return (
    <EmptyState title="Diese Seite gibt es nicht" action={<LinkButton to="/" variant="primary">Zur Übersicht</LinkButton>}>
      Vielleicht wurde der Link verändert oder der Inhalt gelöscht.
    </EmptyState>
  );
}
