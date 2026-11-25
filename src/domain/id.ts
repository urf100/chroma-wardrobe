/** Erzeugt eine eindeutige ID (UUID v4, mit Fallback für ältere Umgebungen). */
export function createId(prefix = ''): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
          const r = (Math.random() * 16) | 0;
          return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });
  return prefix ? `${prefix}_${uuid}` : uuid;
}

export const nowIso = () => new Date().toISOString();
