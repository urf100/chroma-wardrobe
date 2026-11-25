import type { ChromaDB } from '../db';
import type { DataStore } from './types';
import { createId, nowIso } from '@/domain/id';

export function createDexieStore(db: ChromaDB): DataStore {
  return {
    profiles: {
      list: () => db.profiles.orderBy('name').toArray(),
      get: (id) => db.profiles.get(id),
      put: async (p) => {
        await db.profiles.put(p);
      },
      delete: (id) =>
        db.transaction('rw', [db.profiles, db.garments, db.outfits, db.images, db.feedback], async () => {
          await db.garments.where('profileId').equals(id).delete();
          await db.outfits.where('profileId').equals(id).delete();
          await db.images.where('profileId').equals(id).delete();
          await db.feedback.where('profileId').equals(id).delete();
          await db.profiles.delete(id);
        }),
    },
    garments: {
      listByProfile: (profileId) => db.garments.where('profileId').equals(profileId).toArray(),
      get: (id) => db.garments.get(id),
      put: async (g) => {
        await db.garments.put(g);
      },
      bulkPut: async (gs) => {
        await db.garments.bulkPut(gs);
      },
      delete: (id) => db.garments.delete(id),
    },
    outfits: {
      listByProfile: (profileId) => db.outfits.where('profileId').equals(profileId).toArray(),
      get: (id) => db.outfits.get(id),
      put: async (o) => {
        await db.outfits.put(o);
      },
      delete: (id) => db.outfits.delete(id),
    },
    images: {
      get: (id) => db.images.get(id),
      listByProfile: (profileId) => db.images.where('profileId').equals(profileId).toArray(),
      put: async (img) => {
        await db.images.put(img);
      },
      delete: (id) => db.images.delete(id),
    },
    feedback: {
      listByProfile: (profileId) => db.feedback.where('profileId').equals(profileId).toArray(),
      set: async (profileId, targetKey, verdict) => {
        const existing = await db.feedback.where('[profileId+targetKey]').equals([profileId, targetKey]).first();
        if (verdict === null) {
          if (existing) await db.feedback.delete(existing.id);
          return;
        }
        await db.feedback.put({ id: existing?.id ?? createId('fb'), profileId, targetKey, verdict, createdAt: nowIso() });
      },
    },
    settings: {
      get: async <T,>(key: string) => (await db.settings.get(key))?.value as T | undefined,
      set: async (key, value) => {
        await db.settings.put({ key, value });
      },
    },
    clearAll: () =>
      db.transaction('rw', [db.profiles, db.garments, db.outfits, db.images, db.feedback, db.settings], async () => {
        await Promise.all([db.profiles.clear(), db.garments.clear(), db.outfits.clear(), db.images.clear(), db.feedback.clear(), db.settings.clear()]);
      }),
  };
}
