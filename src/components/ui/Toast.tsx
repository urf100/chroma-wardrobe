import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'error';
}

interface ToastApi {
  show: (message: string, opts?: { actionLabel?: string; onAction?: () => void; tone?: 'neutral' | 'error'; duration?: number }) => void;
}

const Ctx = createContext<ToastApi>({ show: () => {} });

/** Hinweise mit optionaler Rückgängig-Aktion (z. B. nach dem Löschen). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const dismiss = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id));
  const show = useCallback<ToastApi['show']>((message, opts = {}) => {
    const id = ++seq.current;
    setItems((xs) => [...xs.slice(-2), { id, message, actionLabel: opts.actionLabel, onAction: opts.onAction, tone: opts.tone }]);
    window.setTimeout(() => dismiss(id), opts.duration ?? (opts.onAction ? 7000 : 3500));
  }, []);
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className="cw-fade-in pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-4 text-sm text-canvas shadow-lg"
          >
            <span>{t.message}</span>
            {t.onAction && (
              <button
                type="button"
                className="rounded-full bg-canvas/15 px-3 py-1 font-semibold hover:bg-canvas/25"
                onClick={() => {
                  t.onAction?.();
                  dismiss(t.id);
                }}
              >
                {t.actionLabel ?? 'Rückgängig'}
              </button>
            )}
            <button type="button" aria-label="Hinweis schließen" className="rounded-full p-1 hover:bg-canvas/15" onClick={() => dismiss(t.id)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
