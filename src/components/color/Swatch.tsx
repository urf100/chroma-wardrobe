import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { HexColor } from '@/domain/types';
import { nameColor, readableTextColor } from '@/domain/color';
import { cx } from '../ui/primitives';

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Farbfeld mit Namen und HEX-Code – Farbe ist nie die einzige Information. */
export function Swatch({
  hex,
  name,
  note,
  size = 'md',
  showHex = true,
  copyable = false,
  className,
  onClick,
  selected,
}: {
  hex: HexColor;
  name?: string;
  note?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showHex?: boolean;
  copyable?: boolean;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const label = name ?? nameColor(hex).name;
  const box = { xs: 'h-6 w-6 rounded-md', sm: 'h-10 w-10 rounded-lg', md: 'h-14 w-full rounded-xl', lg: 'h-24 w-full rounded-2xl' }[size];
  const inner = (
    <>
      <span
        className={cx(box, 'block border border-black/10 dark:border-white/10', selected && 'ring-2 ring-ink ring-offset-2 ring-offset-surface')}
        style={{ background: hex }}
        aria-hidden
      />
      {size !== 'xs' && (
        <span className="mt-1.5 block min-w-0 text-left">
          <span className="block truncate text-xs font-medium">{label}</span>
          {showHex && <span className="block font-mono text-[11px] text-muted">{hex}</span>}
          {note && <span className="block text-[11px] text-muted">{note}</span>}
        </span>
      )}
    </>
  );
  const cls = cx('group relative block min-w-0', size === 'sm' && 'flex items-center gap-2 [&>span:last-child]:mt-0', className);
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cx(cls, 'text-left')} aria-pressed={selected} aria-label={`${label} ${hex}`} title={`${label} ${hex}`}>
        {inner}
      </button>
    );
  return (
    <div className={cls} title={`${label} ${hex}`}>
      {inner}
      {copyable && (
        <button
          type="button"
          onClick={async () => {
            if (await copyText(hex)) {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }
          }}
          className="absolute top-1.5 right-1.5 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
          style={{ color: readableTextColor(hex) }}
          aria-label={`${hex} kopieren`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

/** Kompakte Farbleiste, z. B. für Outfit-Paletten. */
export function ColorStrip({ colors, className, height = 'h-3' }: { colors: { hex: HexColor; share?: number }[]; className?: string; height?: string }) {
  return (
    <div className={cx('flex overflow-hidden rounded-full border border-black/5', height, className)} aria-hidden>
      {colors.map((c, i) => (
        <span key={i} style={{ background: c.hex, flex: c.share ?? 1 }} />
      ))}
    </div>
  );
}
