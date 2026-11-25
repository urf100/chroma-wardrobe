import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppDataProvider, useAppData } from './AppData';
import { AppShell } from './AppShell';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from './theme';
import { Callout } from '@/components/ui/primitives';

// Seiten werden bei Bedarf geladen (kleinerer Start-Bundle).
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const AnalysisPage = lazy(() => import('@/pages/AnalysisPage'));
const SeasonDetailPage = lazy(() => import('@/pages/SeasonDetailPage'));
const PalettePage = lazy(() => import('@/pages/PalettePage'));
const WardrobePage = lazy(() => import('@/pages/wardrobe/WardrobePage'));
const GarmentEditorPage = lazy(() => import('@/pages/wardrobe/GarmentEditorPage'));
const StudioPage = lazy(() => import('@/pages/studio/StudioPage'));
const ScannerPage = lazy(() => import('@/pages/ScannerPage'));
const RecommendationsPage = lazy(() => import('@/pages/RecommendationsPage'));
const WishlistPage = lazy(() => import('@/pages/WishlistPage'));
const AcademyPage = lazy(() => import('@/pages/academy/AcademyPage'));
const AcademyModulePage = lazy(() => import('@/pages/academy/AcademyModulePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted" role="status">
      Wird geladen …
    </div>
  );
}

function Routed() {
  const { ready, error, profile } = useAppData();
  if (error)
    return (
      <div className="mx-auto max-w-lg p-8">
        <Callout tone="attention" title="Die lokale Datenbank konnte nicht geöffnet werden">
          {error}. Mögliche Ursachen: privater Modus mit gesperrtem Speicher oder ein veralteter Browser. Deine Daten wurden nicht verändert.
        </Callout>
      </div>
    );
  if (!ready) return <Loading />;
  return (
    <AppShell>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/einstellungen" element={<SettingsPage />} />
          <Route path="/farbtyp" element={<AnalysisPage />} />
          <Route path="/farbtyp/:seasonId" element={<SeasonDetailPage />} />
          <Route path="/akademie" element={<AcademyPage />} />
          <Route path="/akademie/:moduleId" element={<AcademyModulePage />} />
          {profile ? (
            <>
              <Route path="/palette" element={<PalettePage />} />
              <Route path="/kleiderschrank" element={<WardrobePage />} />
              <Route path="/kleiderschrank/neu" element={<GarmentEditorPage key="new" />} />
              <Route path="/kleiderschrank/:id" element={<GarmentEditorPage />} />
              <Route path="/studio" element={<StudioPage />} />
              <Route path="/scanner" element={<ScannerPage />} />
              <Route path="/empfehlungen" element={<RecommendationsPage />} />
              <Route path="/wunschliste" element={<WishlistPage />} />
            </>
          ) : (
            <Route path="*" element={<ProfilePage />} />
          )}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export function App() {
  return (
    <ThemeProvider>
    <HashRouter>
      <ToastProvider>
        <AppDataProvider>
          <Routed />
        </AppDataProvider>
      </ToastProvider>
    </HashRouter>
    </ThemeProvider>
  );
}
