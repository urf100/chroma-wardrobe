// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { ChromaDB } from './db';
import { createDexieStore } from './repositories/dexieStore';
import type { DataStore } from './repositories/types';
import { ensureSeeded, createNewProfile, duplicateProfileDeep, deleteProfile, setActiveProfile, saveImage } from './services';
import { exportAll, exportProfile, importBackup, validateBackup } from './backup/backup';
import { SETTINGS } from './store';
import { createGarment, createOutfit, garmentColor } from '@/domain/profile/factory';

let store: DataStore;
let n = 0;

beforeEach(() => {
  store = createDexieStore(new ChromaDB(`test-${Date.now()}-${n++}`));
});

describe('Seeding', () => {
  it('legt beim ersten Start das Startprofil an – genau einmal', async () => {
    await ensureSeeded(store);
    await ensureSeeded(store);
    const profiles = await store.profiles.list();
    expect(profiles).toHaveLength(1);
    const p = profiles[0];
    expect(p.colorType.seasonId).toBe('warm-autumn');
    expect(p.sample).toBe('starter');
    expect(await store.settings.get(SETTINGS.activeProfileId)).toBe(p.id);
    const garments = await store.garments.listByProfile(p.id);
    expect(garments.filter((g) => g.ownership === 'owned')).toHaveLength(9);
    expect(garments.filter((g) => g.ownership === 'planned')).toHaveLength(2);
    expect(garments.filter((g) => g.ownership === 'wishlist')).toHaveLength(2);
    // Inspirations- und Hosenfarben sind KEINE Kleidungsstücke
    expect(p.customSwatches.filter((s) => s.kind === 'trial-bottom')).toHaveLength(8);
    expect(garments.every((g) => g.colorIsApproximation)).toBe(true);
  });

  it('seedet nicht erneut, wenn der Nutzer alle Profile gelöscht hat', async () => {
    await ensureSeeded(store);
    const [p] = await store.profiles.list();
    await deleteProfile(store, p.id);
    await ensureSeeded(store);
    expect(await store.profiles.list()).toHaveLength(0);
  });
});

describe('Profile', () => {
  it('erstellt, wechselt und löscht Profile getrennt', async () => {
    const a = await createNewProfile(store, 'Anna');
    const b = await createNewProfile(store, 'Ben');
    expect(await store.settings.get(SETTINGS.activeProfileId)).toBe(b.id);
    await setActiveProfile(store, a.id);
    expect(await store.settings.get(SETTINGS.activeProfileId)).toBe(a.id);

    await store.garments.put(createGarment(a.id, 'jeans', [garmentColor('#465B73')]));
    await store.garments.put(createGarment(b.id, 'chino', [garmentColor('#C7B596')]));
    expect(await store.garments.listByProfile(a.id)).toHaveLength(1);
    expect(await store.garments.listByProfile(b.id)).toHaveLength(1);

    await deleteProfile(store, a.id);
    expect(await store.garments.listByProfile(a.id)).toHaveLength(0);
    expect(await store.garments.listByProfile(b.id)).toHaveLength(1);
    expect(await store.settings.get(SETTINGS.activeProfileId)).toBe(b.id);
  });

  it('dupliziert ein Profil inklusive Kleiderschrank und Outfit-Verweisen', async () => {
    const a = await createNewProfile(store, 'Anna');
    const g = createGarment(a.id, 'tshirt', [garmentColor('#35483C')]);
    await store.garments.put(g);
    await store.outfits.put(
      createOutfit(a.id, { slots: { base: { garmentId: g.id, subcategory: 'tshirt', colors: g.colors, pattern: g.pattern } } }),
    );
    const copy = await duplicateProfileDeep(store, a.id);
    expect(copy.id).not.toBe(a.id);
    const copyGarments = await store.garments.listByProfile(copy.id);
    expect(copyGarments).toHaveLength(1);
    expect(copyGarments[0].id).not.toBe(g.id);
    const [o] = await store.outfits.listByProfile(copy.id);
    expect(o.slots.base?.garmentId).toBe(copyGarments[0].id);
  });
});

describe('Kleidungsverwaltung', () => {
  it('speichert, aktualisiert und löscht Kleidungsstücke', async () => {
    const p = await createNewProfile(store, 'Test');
    const g = createGarment(p.id, 'parka', [garmentColor('#656749')]);
    expect(g.attributes.hood).toBe('yes');
    await store.garments.put(g);
    await store.garments.put({ ...g, ownership: 'archived' });
    expect((await store.garments.get(g.id))?.ownership).toBe('archived');
    await store.garments.delete(g.id);
    expect(await store.garments.get(g.id)).toBeUndefined();
  });
});

describe('Backup & Import', () => {
  it('exportiert und importiert verlustfrei (Wiederherstellung)', async () => {
    await ensureSeeded(store);
    const [p] = await store.profiles.list();
    const blob = new Blob([new Uint8Array([137, 80, 78, 71, 1, 2, 3])], { type: 'image/png' });
    await saveImage(store, p.id, blob, 'garment');
    const backup = await exportAll(store);
    const json = JSON.stringify(backup);
    const v = validateBackup(json);
    expect(v.ok).toBe(true);
    expect(v.summary?.images).toBe(1);

    const target = createDexieStore(new ChromaDB(`restore-${Date.now()}`));
    await importBackup(target, v.data!, 'replace');
    const restored = await target.profiles.list();
    expect(restored[0].id).toBe(p.id);
    expect(await target.garments.listByProfile(p.id)).toHaveLength(13);
    const imgs = await target.images.listByProfile(p.id);
    expect(new Uint8Array(await imgs[0].blob.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71, 1, 2, 3]));
  });

  it('fügt im Merge-Modus mit neuen IDs hinzu und überschreibt nichts', async () => {
    await ensureSeeded(store);
    const backup = await exportAll(store);
    const res = await importBackup(store, validateBackup(JSON.stringify(backup)).data!, 'merge');
    const profiles = await store.profiles.list();
    expect(profiles).toHaveLength(2);
    const newId = Object.values(res.profileIdMap)[0];
    expect(await store.garments.listByProfile(newId)).toHaveLength(13);
  });

  it('exportiert einzelne Profile', async () => {
    const a = await createNewProfile(store, 'Anna');
    await createNewProfile(store, 'Ben');
    const b = await exportProfile(store, a.id);
    expect(b.scope).toBe('profile');
    expect(b.profiles.map((p) => p.name)).toEqual(['Anna']);
  });

  it('lehnt ungültige oder manipulierte Dateien ab', () => {
    expect(validateBackup('{kein json').ok).toBe(false);
    expect(validateBackup({ hello: 'world' }).ok).toBe(false);
    const bad = {
      format: 'chromawardrobe-backup',
      schemaVersion: 1,
      exportedAt: '2026-01-01',
      scope: 'full',
      app: { name: 'x', version: '1' },
      profiles: [],
      garments: [{ id: 'g', profileId: 'unknown', name: 'X', colors: [{ hex: 'red', role: 'main', share: 1 }] }],
      outfits: [],
      feedback: [],
      images: [],
    };
    const r = validateBackup(bad);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/HEX|Invalid|Ungültig|expected/i);
    expect(validateBackup({ ...bad, schemaVersion: 99 }).errors[0]).toMatch(/neueren/);
  });

  it('weist javascript:-Links und falsche Bildformate zurück', async () => {
    const p = await createNewProfile(store, 'X');
    const g = createGarment(p.id, 'tshirt', [garmentColor('#FFFFFF')], { productUrl: 'javascript:alert(1)' });
    await store.garments.put(g);
    const backup = await exportAll(store);
    expect(validateBackup(JSON.stringify(backup)).ok).toBe(false);
  });
});
