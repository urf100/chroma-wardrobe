import { de, type Messages } from './de';

export type Locale = 'de';

const LOCALES: Record<Locale, Messages> = { de };

/**
 * Aktive Übersetzungen. Als `let`-Export eine „Live Binding“: Nach `setLocale()`
 * sehen alle Importe die neue Sprache (ein Neu-Rendern der App vorausgesetzt).
 */
export let t: Messages = de;

export function setLocale(locale: Locale) {
  t = LOCALES[locale];
}
