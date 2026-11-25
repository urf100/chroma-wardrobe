/**
 * IndexedDB-Schema (via Dexie).
 *
 * Versionierung: Jede Schemaänderung bekommt eine neue `this.version(n)`.
 * Datenmigrationen laufen in `.upgrade(tx => …)`. Alte Versionen werden NIE
 * entfernt, damit Nutzer mit älteren Datenbanken sauber migriert werden.
 *
 * Beispiel für eine spätere Migration:
 *   this.version(2).stores({ garments: 'id, profileId, …, wearCount' })
 *     .upgrade((tx) => tx.table('garments').toCollection().modify((g) => { g.wearCount = 0; }));
 */
import Dexie, { type EntityTable } from 'dexie';
import type { Garment, Outfit, RecommendationFeedback, SettingEntry, StoredImage, UserProfile } from '@/domain/types';

/** Version des Datenformats (für Backups und Migrationen). */
export const DATA_SCHEMA_VERSION = 1;

export class ChromaDB extends Dexie {
  profiles!: EntityTable<UserProfile, 'id'>;
  garments!: EntityTable<Garment, 'id'>;
  outfits!: EntityTable<Outfit, 'id'>;
  images!: EntityTable<StoredImage, 'id'>;
  feedback!: EntityTable<RecommendationFeedback, 'id'>;
  settings!: EntityTable<SettingEntry, 'key'>;

  constructor(name = 'chromawardrobe') {
    super(name);
    this.version(1).stores({
      profiles: 'id, name, updatedAt',
      garments: 'id, profileId, [profileId+ownership], category, subcategory, updatedAt',
      outfits: 'id, profileId, updatedAt',
      images: 'id, profileId',
      feedback: 'id, profileId, [profileId+targetKey]',
      settings: 'key',
    });
  }
}
