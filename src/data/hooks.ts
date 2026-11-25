/**
 * Reaktive Daten-Hooks. `useLiveQuery` aktualisiert Komponenten automatisch,
 * sobald sich die zugrunde liegenden IndexedDB-Daten ändern (auch tabübergreifend).
 */
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { SETTINGS, store } from './store';
import type { ID } from '@/domain/types';

export const useProfiles = () => useLiveQuery(() => store.profiles.list(), []);

export const useActiveProfileId = () =>
  useLiveQuery(async () => (await store.settings.get<string | null>(SETTINGS.activeProfileId)) ?? null, []);

export const useGarments = (profileId: ID | undefined) =>
  useLiveQuery(() => (profileId ? store.garments.listByProfile(profileId) : Promise.resolve([])), [profileId]);

export const useOutfits = (profileId: ID | undefined) =>
  useLiveQuery(() => (profileId ? store.outfits.listByProfile(profileId) : Promise.resolve([])), [profileId]);

export const useFeedback = (profileId: ID | undefined) =>
  useLiveQuery(() => (profileId ? store.feedback.listByProfile(profileId) : Promise.resolve([])), [profileId]);

export const useSetting = <T,>(key: string) => useLiveQuery(() => store.settings.get<T>(key), [key]);

/** Liefert eine Objekt-URL für ein gespeichertes Bild und gibt sie beim Unmount frei. */
export function useImageUrl(imageId: ID | undefined): string | undefined {
  const image = useLiveQuery(() => (imageId ? store.images.get(imageId) : Promise.resolve(undefined)), [imageId]);
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!image?.blob || typeof URL.createObjectURL !== 'function') {
      setUrl(undefined);
      return;
    }
    const u = URL.createObjectURL(image.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [image]);
  return url;
}
