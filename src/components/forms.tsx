import { useEffect, useRef, useState } from 'react';
import type { AppearanceTrait, ColorSwatch, HexColor } from '@/domain/types';
import { TextArea, TextInput, cx } from './ui/primitives';
import { Swatch } from './color/Swatch';
import { HexInput } from './color/ColorPicker';

/** Textfeld mit lokalem Zustand, das verzögert speichert (keine Cursor-Sprünge). */
export function SavingText({
  value,
  onSave,
  multiline = false,
  ...rest
}: { value: string; onSave: (v: string) => void; multiline?: boolean; id?: string; placeholder?: string; 'aria-label'?: string; className?: string }) {
  const [text, setText] = useState(value);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(value);
  useEffect(() => {
    if (value !== latest.current) {
      setText(value);
      latest.current = value;
    }
  }, [value]);
  const change = (v: string) => {
    setText(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      latest.current = v;
      onSave(v);
    }, 500);
  };
  const flush = () => {
    window.clearTimeout(timer.current);
    if (text !== latest.current) {
      latest.current = text;
      onSave(text);
    }
  };
  return multiline ? (
    <TextArea value={text} onChange={(e) => change(e.target.value)} onBlur={flush} {...rest} />
  ) : (
    <TextInput value={text} onChange={(e) => change(e.target.value)} onBlur={flush} {...rest} />
  );
}

/** Visuelle Auswahl eines Erscheinungsmerkmals mit „Ich bin mir nicht sicher“. */
export function AppearancePicker({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: ColorSwatch[];
  value?: AppearanceTrait;
  onChange: (v: AppearanceTrait | undefined) => void;
}) {
  const [custom, setCustom] = useState(false);
  const isPreset = value?.hex && options.some((o) => o.hex === value.hex);
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      {hint && <p className="mb-2 text-xs text-muted">{hint}</p>}
      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {options.map((o) => (
          <Swatch key={o.hex} hex={o.hex} name={o.name} showHex={false} selected={value?.hex === o.hex} onClick={() => onChange({ hex: o.hex, label: o.name })} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          aria-pressed={!value}
          onClick={() => onChange(undefined)}
          className={cx('rounded-full border px-3 py-1', !value ? 'border-ink bg-ink text-canvas' : 'border-line hover:bg-surface-2')}
        >
          Ich bin mir nicht sicher
        </button>
        <button type="button" onClick={() => setCustom((c) => !c)} className="rounded-full border border-line px-3 py-1 hover:bg-surface-2" aria-expanded={custom}>
          Eigener Farbton
        </button>
        {value?.hex && !isPreset && (
          <span className="flex items-center gap-1.5 text-muted">
            <span className="h-4 w-4 rounded border border-black/10" style={{ background: value.hex }} /> {value.label ?? value.hex}
          </span>
        )}
      </div>
      {custom && (
        <div className="mt-2 max-w-xs">
          <HexInput value={(value?.hex ?? '#B58463') as HexColor} onChange={(hex) => onChange({ hex, label: 'Eigener Farbton' })} />
        </div>
      )}
    </fieldset>
  );
}
