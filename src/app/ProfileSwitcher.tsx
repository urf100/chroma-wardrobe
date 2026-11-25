import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { useAppData } from './AppData';
import { setActiveProfile } from '@/data/services';
import { store } from '@/data/store';
import { useImageUrl } from '@/data/hooks';
import type { UserProfile } from '@/domain/types';
import { cx } from '@/components/ui/primitives';

export function Avatar({ profile, size = 32 }: { profile: UserProfile; size?: number }) {
  const url = useImageUrl(profile.avatarImageId);
  const initials = profile.name
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w[0] ?? ''))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  const bg = profile.appearance.skinTone?.hex ?? '#D9D5CE';
  return url ? (
    <img src={url} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-[#1b1b1d]"
      style={{ width: size, height: size, background: bg }}
    >
      {initials || '?'}
    </span>
  );
}

export function ProfileSwitcher({ compact = false }: { compact?: boolean }) {
  const { profiles, profile, season } = useAppData();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  if (!profile)
    return (
      <button type="button" className="rounded-full border border-line px-3 py-1.5 text-sm" onClick={() => navigate('/profil')}>
        Profil anlegen
      </button>
    );
  return (
    <div className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cx('flex w-full min-w-0 items-center gap-2.5 rounded-xl border border-line bg-surface text-left hover:bg-surface-2', compact ? 'max-w-[70vw] px-2 py-1' : 'px-2.5 py-2')}
      >
        <Avatar profile={profile} size={compact ? 26 : 34} />
        {!compact && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{profile.name}</span>
            <span className="block truncate text-xs text-muted">{season ? season.nameDe : 'Farbtyp offen'}</span>
          </span>
        )}
        {compact && <span className="max-w-[45vw] min-w-0 truncate text-sm font-medium">{profile.name}</span>}
        <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
        <span className="sr-only">Profil wechseln</span>
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Profilauswahl schließen" onClick={() => setOpen(false)} />
          <div className={cx('absolute z-50 mt-1 w-64 rounded-xl border border-line bg-surface p-1 shadow-xl', compact ? 'right-0' : 'left-0')}>
            <ul role="listbox" aria-label="Profile">
              {profiles.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={p.id === profile.id}
                    onClick={async () => {
                      await setActiveProfile(store, p.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-2"
                  >
                    <Avatar profile={p} size={24} />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    {p.id === profile.id && <Check className="h-4 w-4" aria-hidden />}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/profil?neu=1');
              }}
              className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-line px-2 py-2 text-left text-sm text-muted hover:bg-surface-2"
            >
              <Plus className="h-4 w-4" aria-hidden /> Neues Profil
            </button>
          </div>
        </>
      )}
    </div>
  );
}
