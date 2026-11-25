/**
 * Kleine, zugängliche UI-Bausteine auf Basis von Tailwind.
 * Entscheidung: keine schwere Komponentenbibliothek – siehe docs/ARCHITECTURE.md.
 */
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Info, TriangleAlert } from 'lucide-react';
import { Link, type LinkProps } from 'react-router-dom';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-primary text-primary-ink hover:opacity-90',
  secondary: 'bg-surface-2 text-ink hover:bg-line',
  outline: 'border border-line bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'bg-danger text-white hover:opacity-90',
};
const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
  icon: 'h-10 w-10 justify-center',
};

export const buttonClass = (variant: Variant = 'secondary', size: Size = 'md', className?: string) =>
  cx(
    'inline-flex shrink-0 items-center rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-45',
    VARIANT[variant],
    SIZE[size],
    className,
  );

/** Navigationslink im Button-Stil (kein verschachteltes <a><button>). */
export function LinkButton({ variant = 'secondary', size = 'md', className, ...rest }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      {...rest}
    />
  );
});

export function Card({ className, children, as: As = 'div', ...rest }: { className?: string; children?: ReactNode; as?: 'div' | 'section' | 'article' } & Record<string, unknown>) {
  return (
    <As className={cx('rounded-2xl border border-line bg-surface', className)} {...rest}>
      {children}
    </As>
  );
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'positive' | 'attention' | 'info' | 'sample'; className?: string }) {
  const t = {
    neutral: 'bg-surface-2 text-muted',
    positive: 'bg-positive/12 text-positive',
    attention: 'bg-attention/12 text-attention',
    info: 'bg-focus/12 text-focus',
    sample: 'border border-dashed border-line text-muted',
  }[tone];
  return <span className={cx('inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', t, className)}>{children}</span>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-muted uppercase">{eyebrow}</p>}
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
        {description && <div className="mt-2 text-[15px] leading-relaxed text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ children, hint, id }: { children: ReactNode; hint?: ReactNode; id?: string }) {
  return (
    <div className="mb-3">
      <h2 id={id} className="text-lg font-semibold">
        {children}
      </h2>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function Callout({ children, tone = 'info', title }: { children: ReactNode; tone?: 'info' | 'attention'; title?: string }) {
  const Icon = tone === 'info' ? Info : TriangleAlert;
  return (
    <div className={cx('flex gap-3 rounded-xl border p-3 text-sm leading-relaxed', tone === 'info' ? 'border-line bg-surface-2' : 'border-attention/40 bg-attention/8')}>
      <Icon className={cx('mt-0.5 h-4 w-4 shrink-0', tone === 'info' ? 'text-muted' : 'text-attention')} aria-hidden />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-muted">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const fieldBase =
  'w-full rounded-xl border border-line bg-surface px-3 text-[15px] text-ink placeholder:text-muted/70 focus:border-focus focus:outline-none';

export function Field({ label, hint, children, htmlFor, className }: { label: string; hint?: ReactNode; children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(fieldBase, 'h-10', className)} {...rest} />;
});

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldBase, 'min-h-20 py-2', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(fieldBase, 'h-10 pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

/** Umschaltbarer Chip (für Mehrfachauswahl), mit aria-pressed. */
export function Chip({ active, onClick, children, className, title }: { active: boolean; onClick: () => void; children: ReactNode; className?: string; title?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={cx(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
        active ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-ink hover:bg-surface-2',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Segmentierte Auswahl (Radiogruppe). */
export function Segmented<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cx('inline-flex flex-wrap rounded-full bg-surface-2 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx('h-8 rounded-full px-3 text-sm transition-colors', value === o.value ? 'bg-surface font-medium text-ink shadow-sm' : 'text-muted hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 py-1.5">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-10 rounded-full bg-line transition-colors peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-focus" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
