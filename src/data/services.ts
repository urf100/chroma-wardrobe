/**
 * Anwendungsdienste über der Repository-Schicht (Profilverwaltung, Seeding).
 */
import type { Garment, ID, Outfit, StoredImage, UserProfile } from '@/domain/types';
import type { DataStore } from './repositories/types';
import { SETTINGS } from './store';
import { buildDemoProfile, buildStarterProfile } from './seed/starterProfile';
import { createProfile, duplicateProfile } from '@/domain/profile/factory';
import { createId, nowIso } from '@/domain/id';

/** Legt beim allerersten Start das Startprofil an. Idempotent. */
export async function ensureSeeded(store: DataStore): Promise<void> {
  const seeded = await store.settings.get<boolean>(SETTINGS.seeded);
  if (seeded) return;
  const existing = await store.profiles.list();
  if (existing.length === 0) {
    const { profile, garments } = buildStarterProfile();
    await store.profiles.put(profile);
    await store.garments.bulkPut(garments);
    await store.settings.set(SETTINGS.activeProfileId, profile.id);
  }
  await store.settings.set(SETTINGS.seeded, true);
}

export async function addSampleProfile(store: DataStore, kind: 'starter' | 'demo'): Promise<UserProfile> {
  const { profile, garments } = kind === 'starter' ? buildStarterProfile() : buildDemoProfile();
  await store.profiles.put(profile);
  await store.garments.bulkPut(garments);
  return profile;
}

export async function createNewProfile(store: DataStore, name: string): Promise<UserProfile> {
  const p = createProfile(name);
  await store.profiles.put(p);
  await store.settings.set(SETTINGS.activeProfileId, p.id);
  return p;
}

/** Dupliziert ein Profil inklusive Kleiderschrank, Outfits und Bildern (neue IDs). */
export async function duplicateProfileDeep(store: DataStore, id: ID, newName?: string): Promise<UserProfile> {
  const original = await store.profiles.get(id);
  if (!original) throw new Error('Profil nicht gefunden.');
  const copy = duplicateProfile(original, newName);
  const idMap = new Map<string, string>();
  const images: StoredImage[] = await store.images.listByProfile(id);
  for (const img of images) {
    const nid = createId('img');
    idMap.set(img.id, nid);
    await store.images.put({ ...img, id: nid, profileId: copy.id });
  }
  if (copy.avatarImageId) copy.avatarImageId = idMap.get(copy.avatarImageId);
  await store.profiles.put(copy);
  const garments: Garment[] = (await store.garments.listByProfile(id)).map((g) => {
    const nid = createId('gar');
    idMap.set(g.id, nid);
    return { ...structuredClone(g), id: nid, profileId: copy.id, photoImageId: g.photoImageId ? idMap.get(g.photoImageId) : undefined, updatedAt: nowIso() };
  });
  await store.garments.bulkPut(garments);
  for (const o of await store.outfits.listByProfile(id)) {
    const slots: Outfit['slots'] = {};
    for (const [k, v] of Object.entries(o.slots)) if (v) slots[k as keyof Outfit['slots']] = { ...v, garmentId: v.garmentId ? idMap.get(v.garmentId) : undefined };
    await store.outfits.put({ ...structuredClone(o), id: createId('out'), profileId: copy.id, slots });
  }
  return copy;
}

export async function deleteProfile(store: DataStore, id: ID): Promise<void> {
  await store.profiles.delete(id);
  const active = await store.settings.get<string>(SETTINGS.activeProfileId);
  if (active === id) {
    const rest = await store.profiles.list();
    await store.settings.set(SETTINGS.activeProfileId, rest[0]?.id ?? null);
  }
}

export async function setActiveProfile(store: DataStore, id: ID): Promise<void> {
  await store.settings.set(SETTINGS.activeProfileId, id);
}

export async function saveImage(store: DataStore, profileId: ID, blob: Blob, kind: StoredImage['kind']): Promise<ID> {
  const id = createId('img');
  await store.images.put({ id, profileId, kind, mimeType: blob.type || 'image/jpeg', blob, createdAt: nowIso() });
  return id;
}

/**
 * Verkleinert ein Foto vor dem Speichern (spart Speicherplatz in IndexedDB).
 * Fällt in Umgebungen ohne Canvas auf das Original zurück.
 */
export async function downscaleImage(file: Blob, maxSize = 1200, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', quality));
  } catch {
    return file;
  }
}
