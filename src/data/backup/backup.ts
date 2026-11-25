/**
 * Export, Import und Wiederherstellung von Backups.
 *
 * Import-Modi:
 * - `merge`: Importierte Profile werden mit NEUEN IDs hinzugefügt (keine bestehenden Daten werden überschrieben).
 * - `replace`: Alle lokalen Daten werden gelöscht und durch das Backup ersetzt (Wiederherstellung).
 */
import type { Garment, Outfit, RecommendationFeedback, StoredImage, UserProfile } from '@/domain/types';
import type { DataStore } from '../repositories/types';
import { DATA_SCHEMA_VERSION } from '../db';
import { BACKUP_FORMAT, backupSchema, type BackupFile, type BackupImage } from './schema';
import { createId } from '@/domain/id';

export const APP_VERSION = '0.1.0';

/* ---------- Blob <-> DataURL (browser- und testtauglich) ---------- */

export async function blobToDataUrl(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) bin += String.fromCharCode(...buf.subarray(i, i + chunk));
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(bin)}`;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, data] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? 'application/octet-stream';
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function imageToBackup(img: StoredImage): Promise<BackupImage> {
  return {
    id: img.id,
    profileId: img.profileId,
    kind: img.kind,
    mimeType: img.mimeType as BackupImage['mimeType'],
    dataUrl: await blobToDataUrl(img.blob),
    createdAt: img.createdAt,
  };
}

/* ---------- Export ---------- */

async function collect(store: DataStore, profiles: UserProfile[], scope: BackupFile['scope']): Promise<BackupFile> {
  const garments: Garment[] = [];
  const outfits: Outfit[] = [];
  const feedback: RecommendationFeedback[] = [];
  const images: BackupImage[] = [];
  for (const p of profiles) {
    garments.push(...(await store.garments.listByProfile(p.id)));
    outfits.push(...(await store.outfits.listByProfile(p.id)));
    feedback.push(...(await store.feedback.listByProfile(p.id)));
    for (const img of await store.images.listByProfile(p.id)) images.push(await imageToBackup(img));
  }
  return {
    format: BACKUP_FORMAT,
    schemaVersion: DATA_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    scope,
    app: { name: 'ChromaWardrobe', version: APP_VERSION },
    profiles,
    garments,
    outfits,
    feedback,
    images,
  };
}

export async function exportAll(store: DataStore): Promise<BackupFile> {
  return collect(store, await store.profiles.list(), 'full');
}

export async function exportProfile(store: DataStore, profileId: string): Promise<BackupFile> {
  const p = await store.profiles.get(profileId);
  if (!p) throw new Error('Profil nicht gefunden.');
  return collect(store, [p], 'profile');
}

/* ---------- Validierung ---------- */

export interface ValidationResult {
  ok: boolean;
  data?: BackupFile;
  errors: string[];
  summary?: { profiles: number; garments: number; outfits: number; images: number };
}

/** Migration älterer Backup-Versionen. Heute gibt es nur Version 1. */
function migrateBackup(raw: unknown): unknown {
  return raw;
}

export function validateBackup(input: string | unknown): ValidationResult {
  let raw: unknown = input;
  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input);
    } catch {
      return { ok: false, errors: ['Die Datei ist kein gültiges JSON.'] };
    }
  }
  if (!raw || typeof raw !== 'object' || (raw as { format?: unknown }).format !== BACKUP_FORMAT) {
    return { ok: false, errors: ['Die Datei ist kein ChromaWardrobe-Backup.'] };
  }
  const version = (raw as { schemaVersion?: unknown }).schemaVersion;
  if (typeof version === 'number' && version > DATA_SCHEMA_VERSION) {
    return { ok: false, errors: [`Das Backup stammt aus einer neueren App-Version (Schema ${version}). Bitte App aktualisieren.`] };
  }
  const parsed = backupSchema.safeParse(migrateBackup(raw));
  if (!parsed.success) {
    const errors = parsed.error.issues.slice(0, 8).map((i) => `${i.path.join('.') || 'Datei'}: ${i.message}`);
    return { ok: false, errors };
  }
  const data = parsed.data;
  // Referenzielle Integrität prüfen
  const profileIds = new Set(data.profiles.map((p) => p.id));
  const errors: string[] = [];
  for (const g of data.garments) if (!profileIds.has(g.profileId)) errors.push(`Kleidungsstück „${g.name}“ verweist auf ein unbekanntes Profil.`);
  for (const o of data.outfits) if (!profileIds.has(o.profileId)) errors.push(`Outfit „${o.name}“ verweist auf ein unbekanntes Profil.`);
  if (errors.length) return { ok: false, errors: errors.slice(0, 8) };
  return {
    ok: true,
    data,
    errors: [],
    summary: { profiles: data.profiles.length, garments: data.garments.length, outfits: data.outfits.length, images: data.images.length },
  };
}

/* ---------- Import ---------- */

export type ImportMode = 'merge' | 'replace';

export interface ImportResult {
  profiles: number;
  garments: number;
  outfits: number;
  images: number;
  /** ID-Zuordnung alt → neu (nur im Merge-Modus). */
  profileIdMap: Record<string, string>;
}

export async function importBackup(store: DataStore, data: BackupFile, mode: ImportMode): Promise<ImportResult> {
  const idMap = new Map<string, string>();
  const remap = (oldId: string | undefined, prefix: string) => {
    if (!oldId) return undefined;
    if (mode === 'replace') return oldId;
    let n = idMap.get(oldId);
    if (!n) {
      n = createId(prefix);
      idMap.set(oldId, n);
    }
    return n;
  };

  if (mode === 'replace') await store.clearAll();

  const profileIdMap: Record<string, string> = {};
  for (const p of data.profiles) {
    const newId = remap(p.id, 'prof')!;
    profileIdMap[p.id] = newId;
    await store.profiles.put({ ...(p as UserProfile), id: newId, avatarImageId: remap(p.avatarImageId, 'img') });
  }
  for (const img of data.images) {
    await store.images.put({
      id: remap(img.id, 'img')!,
      profileId: remap(img.profileId, 'prof')!,
      kind: img.kind,
      mimeType: img.mimeType,
      blob: dataUrlToBlob(img.dataUrl),
      createdAt: img.createdAt,
    });
  }
  const garments: Garment[] = data.garments.map((g) => ({
    ...(g as Garment),
    id: remap(g.id, 'gar')!,
    profileId: remap(g.profileId, 'prof')!,
    photoImageId: remap(g.photoImageId, 'img'),
  }));
  await store.garments.bulkPut(garments);
  for (const o of data.outfits) {
    const slots: Outfit['slots'] = {};
    for (const [slot, v] of Object.entries(o.slots)) {
      if (!v) continue;
      slots[slot as keyof Outfit['slots']] = { ...v, garmentId: v.garmentId ? (mode === 'replace' ? v.garmentId : idMap.get(v.garmentId)) : undefined };
    }
    await store.outfits.put({ ...(o as Outfit), id: remap(o.id, 'out')!, profileId: remap(o.profileId, 'prof')!, slots });
  }
  for (const f of data.feedback) {
    const key = mode === 'replace' ? f.targetKey : f.targetKey.split('|').map((k) => idMap.get(k) ?? k).sort().join('|');
    await store.feedback.set(remap(f.profileId, 'prof')!, key, f.verdict);
  }
  return {
    profiles: data.profiles.length,
    garments: data.garments.length,
    outfits: data.outfits.length,
    images: data.images.length,
    profileIdMap,
  };
}

export function backupFileName(scope: BackupFile['scope'], label?: string): string {
  const d = new Date().toISOString().slice(0, 10);
  const safe = label ? `-${label.replace(/[^a-z0-9äöüß-]+/gi, '-').toLowerCase()}` : '';
  return `chromawardrobe-backup-${scope}${safe}-${d}.json`;
}
