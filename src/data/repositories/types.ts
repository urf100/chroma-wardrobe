/**
 * Abstrakte Repository-Schnittstellen.
 *
 * Die App greift ausschließlich über diese Interfaces auf Daten zu. Heute
 * implementiert `dexieStore.ts` sie mit IndexedDB; ein späteres Backend
 * (z. B. Supabase/PostgreSQL) kann dieselben Interfaces implementieren.
 */
import type {
  FeedbackVerdict,
  Garment,
  ID,
  Outfit,
  RecommendationFeedback,
  StoredImage,
  UserProfile,
} from '@/domain/types';

export interface ProfileRepository {
  list(): Promise<UserProfile[]>;
  get(id: ID): Promise<UserProfile | undefined>;
  put(profile: UserProfile): Promise<void>;
  /** Löscht das Profil inklusive aller zugehörigen Daten. */
  delete(id: ID): Promise<void>;
}

export interface GarmentRepository {
  listByProfile(profileId: ID): Promise<Garment[]>;
  get(id: ID): Promise<Garment | undefined>;
  put(garment: Garment): Promise<void>;
  bulkPut(garments: Garment[]): Promise<void>;
  delete(id: ID): Promise<void>;
}

export interface OutfitRepository {
  listByProfile(profileId: ID): Promise<Outfit[]>;
  get(id: ID): Promise<Outfit | undefined>;
  put(outfit: Outfit): Promise<void>;
  delete(id: ID): Promise<void>;
}

export interface ImageRepository {
  get(id: ID): Promise<StoredImage | undefined>;
  listByProfile(profileId: ID): Promise<StoredImage[]>;
  put(image: StoredImage): Promise<void>;
  delete(id: ID): Promise<void>;
}

export interface FeedbackRepository {
  listByProfile(profileId: ID): Promise<RecommendationFeedback[]>;
  /** Setzt oder entfernt (verdict = null) ein Feedback. */
  set(profileId: ID, targetKey: string, verdict: FeedbackVerdict | null): Promise<void>;
}

export interface SettingsRepository {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

export interface DataStore {
  profiles: ProfileRepository;
  garments: GarmentRepository;
  outfits: OutfitRepository;
  images: ImageRepository;
  feedback: FeedbackRepository;
  settings: SettingsRepository;
  /** Löscht sämtliche lokalen Daten. */
  clearAll(): Promise<void>;
}
