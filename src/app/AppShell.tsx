import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  House,
  Layers,
  Menu,
  Palette,
  ScanLine,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  UserRound,
  WandSparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { t } from '@/i18n';
import { useAppData } from './AppData';
import { ProfileSwitcher } from './ProfileSwitcher';
import { cx } from '@/components/ui/primitives';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { to: '/', label: t.nav.overview, icon: House },
  { to: '/profil', label: t.nav.profile, icon: UserRound },
  { to: '/farbtyp', label: t.nav.analysis, icon: Sparkles },
  { to: '/palette', label: t.nav.palette, icon: Palette },
  { to: '/kleiderschrank', label: t.nav.wardrobe, icon: Shirt },
  { to: '/studio', label: t.nav.studio, icon: Layers },
  { to: '/scanner', label: t.nav.scanner, icon: ScanLine },
  { to: '/empfehlungen', label: t.nav.recommendations, icon: WandSparkles },
  { to: '/wunschliste', label: t.nav.wishlist, icon: ShoppingBag },
  { to: '/akademie', label: t.nav.academy, icon: GraduationCap },
  { to: '/einstellungen', label: t.nav.settings, icon: Settings },
];

const MOBILE_PRIMARY = ['/', '/kleiderschrank', '/studio', '/palette'];

const SHORT_LABEL: Record<string, string> = { '/': 'Start', '/kleiderschrank': 'Schrank', '/studio': 'Studio', '/palette': 'Palette' };

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden>
        <circle cx="24" cy="26" r="16" fill="#A65C3D" />
        <circle cx="40" cy="26" r="16" fill="#3D777E" fillOpacity=".85" />
        <circle cx="32" cy="40" r="16" fill="#CBB99C" fillOpacity=".85" />
      </svg>
      <span className={cx('font-display text-lg leading-none', compact && 'sr-only sm:not-sr-only')}>{t.app.name}</span>
    </span>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="space-y-0.5">
      {NAV.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx('flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] transition-colors', isActive ? 'bg-surface-2 font-semibold text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink')
            }
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const { profile } = useAppData();
  useEffect(() => {
    setMoreOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#main" className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-canvas focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Zum Inhalt springen
      </a>

      {/* Desktop-Navigation */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
        <div className="mb-6 px-2">
          <Logo />
        </div>
        <ProfileSwitcher />
        <nav aria-label="Hauptnavigation" className="mt-5 flex-1 overflow-y-auto">
          <NavLinks />
        </nav>
        <p className="px-3 pt-3 text-[11px] leading-snug text-muted">Alle Daten bleiben lokal in diesem Browser.</p>
      </aside>

      {/* Mobile Kopfzeile */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <Logo compact />
        <ProfileSwitcher compact />
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16" key={profile?.id}>
        {children}
      </main>

      {/* Mobile Navigation unten */}
      <nav aria-label="Schnellnavigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5">
          {NAV.filter((n) => MOBILE_PRIMARY.includes(n.to)).map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) => cx('flex flex-col items-center gap-0.5 py-2 text-[11px]', isActive ? 'font-semibold text-ink' : 'text-muted')}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="max-w-full truncate px-1">{SHORT_LABEL[to] ?? label}</span>
              </NavLink>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setMoreOpen(true)} className="flex w-full flex-col items-center gap-0.5 py-2 text-[11px] text-muted" aria-expanded={moreOpen}>
              <Menu className="h-5 w-5" aria-hidden />
              {t.nav.more}
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Alle Bereiche">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Menü schließen" onClick={() => setMoreOpen(false)} />
          <div className="cw-fade-in absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Alle Bereiche</p>
              <button type="button" onClick={() => setMoreOpen(false)} className="rounded-full p-2 hover:bg-surface-2" aria-label="Schließen">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMoreOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
