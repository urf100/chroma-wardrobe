/**
 * Zentraler App-Kontext: aktives Profil, dessen Daten, Katalog und Farbtyp.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ColorSeason, FeedbackVerdict, Garment, Outfit, UserProfile } from '@/domain/types';
import { buildCatalog, type Catalog } from '@/domain/garments/catalog';
import { getSeason } from '@/domain/seasons';
import { store } from '@/data/store';
import { ensureSeeded } from '@/data/services';
import { useActiveProfileId, useFeedback, useGarments, useOutfits, useProfiles } from '@/data/hooks';
import { nowIso } from '@/domain/id';

export interface AppData {
  ready: boolean;
  error: string | null;
  profiles: UserProfile[];
  profile: UserProfile | null;
  catalog: Catalog;
  season?: ColorSeason;
  garments: Garment[];
  outfits: Outfit[];
  feedback: Map<string, FeedbackVerdict>;
  updateProfile: (fn: (p: UserProfile) => UserProfile) => Promise<void>;
}

const Ctx = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    ensureSeeded(store)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setBootstrapped(true));
  }, []);
  const profiles = useProfiles();
  const activeId = useActiveProfileId();
  const profile = useMemo(() => {
    if (!profiles) return null;
    return profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null;
  }, [profiles, activeId]);
  const garments = useGarments(profile?.id);
  const outfits = useOutfits(profile?.id);
  const feedbackList = useFeedback(profile?.id);

  const value = useMemo<AppData>(() => {
    const catalog = buildCatalog(profile?.customCategories, profile?.customSubcategories);
    return {
      ready: bootstrapped && profiles !== undefined && activeId !== undefined,
      error,
      profiles: profiles ?? [],
      profile,
      catalog,
      season: getSeason(profile?.colorType.seasonId),
      garments: garments ?? [],
      outfits: outfits ?? [],
      feedback: new Map((feedbackList ?? []).map((f) => [f.targetKey, f.verdict])),
      updateProfile: async (fn) => {
        if (!profile) return;
        const fresh = (await store.profiles.get(profile.id)) ?? profile;
        await store.profiles.put({ ...fn(fresh), updatedAt: nowIso() });
      },
    };
  }, [bootstrapped, error, profiles, activeId, profile, garments, outfits, feedbackList]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData(): AppData {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppData außerhalb des AppDataProvider');
  return v;
}
