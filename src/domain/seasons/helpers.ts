import type { ColorSwatch } from '../types';

/** Kurzschreibweise für Farbfelder in den Paletten-Dateien. */
export const c = (hex: string, name: string, note?: string): ColorSwatch => (note ? { hex, name, note } : { hex, name });
