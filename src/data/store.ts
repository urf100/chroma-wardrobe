import { ChromaDB } from './db';
import { createDexieStore } from './repositories/dexieStore';
import type { DataStore } from './repositories/types';

/** Singleton für die App. Tests erzeugen eigene Instanzen mit eigenem DB-Namen. */
export const db = new ChromaDB();
export const store: DataStore = createDexieStore(db);

export const SETTINGS = {
  activeProfileId: 'activeProfileId',
  seeded: 'seeded',
  lastBackupAt: 'lastBackupAt',
} as const;
