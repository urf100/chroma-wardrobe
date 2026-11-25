/**
 * Farbauswahl mit vier gleichwertigen Methoden:
 * visueller Picker, Paletten, HEX-Eingabe und Foto-Farbscanner.
 * Niemand muss HEX-Codes verstehen – der Farbname wird immer angezeigt.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { ColorSwatch, HexColor } from '@/domain/types';
import { colorProfile, CHROMA_LABEL, LIGHTNESS_LABEL, nameColor, rgbToHex, hexToRgb, TEMPERATURE_LABEL, tryNormalizeHex } from '@/domain/color';
import { Segmented, TextInput, cx } from '../ui/primitives';
import { Swatch } from './Swatch';
import { PhotoColorPicker } from './PhotoColorPicker';

/* ---------- HSV ---------- */

function hexToHsv(hex: HexColor) {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function hsvToHex(h: number, s: number, v: number): HexColor {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return rgbToHex({ r: f(5) * 255, g: f(3) * 255, b: f(1) * 255 });
}

export function VisualPicker({ value, onChange }: { value: HexColor; onChange: (hex: HexColor) => void }) {
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const area = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);
  useEffect(() => {
    if (value !== lastEmitted.current) {
      setHsv(hexToHsv(value));
      lastEmitted.current = value;
    }
  }, [value]);
  const emit = (h: number, s: number, v: number) => {
    setHsv({ h, s, v });
    const hex = hsvToHex(h, s, v);
    lastEmitted.current = hex;
    onChange(hex);
  };
  const fromPointer = (e: PointerEvent) => {
    const r = area.current!.getBoundingClientRect();
    const s = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const v = 1 - Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    emit(hsv.h, s, v);
  };
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    emit(hsv.h, Math.min(1, Math.max(0, hsv.s + d[0])), Math.min(1, Math.max(0, hsv.v + d[1])));
  };
  const name = nameColor(value);
  return (
    <div className="space-y-3">
      <div
        ref={area}
        role="slider"
        tabIndex={0}
        aria-label="Sättigung und Helligkeit (Pfeiltasten verwenden)"
        aria-valuetext={`${name.name}, ${value}`}
        aria-valuenow={Math.round(hsv.s * 100)}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          fromPointer(e);
        }}
        onPointerMove={(e) => e.buttons === 1 && fromPointer(e)}
        className="relative h-44 w-full cursor-crosshair touch-none rounded-xl"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${hsv.h} 100% 50%)` }}
      >
        <span
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: value }}
        />
      </div>
      <label className="block">
        <span className="sr-only">Farbton</span>
        <input
          type="range"
          min={0}
          max={359}
          value={Math.round(hsv.h)}
          onChange={(e) => emit(Number(e.target.value), hsv.s, hsv.v)}
          className="cw-range w-full"
          style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
          aria-label="Farbton"
        />
      </label>
    </div>
  );
}

export interface PaletteGroup {
  label: string;
  swatches: ColorSwatch[];
}

export function PalettePicker({ value, onChange, groups }: { value: HexColor; onChange: (hex: HexColor, name?: string) => void; groups: PaletteGroup[] }) {
  if (!groups.length) return <p className="text-sm text-muted">Keine Paletten verfügbar. Wähle einen Farbtyp im Profil, um seine Palette hier zu sehen.</p>;
  return (
    <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{g.label}</p>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {g.swatches.map((s, i) => (
              <Swatch key={`${s.hex}-${i}`} hex={s.hex} name={s.name} size="md" showHex={false} selected={s.hex === value} onClick={() => onChange(s.hex, s.name)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HexInput({ value, onChange, id }: { value: HexColor; onChange: (hex: HexColor) => void; id?: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const valid = tryNormalizeHex(text);
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="h-10 w-10 shrink-0 rounded-lg border border-black/10" style={{ background: valid ?? value }} aria-hidden />
        <TextInput
          id={id}
          value={text}
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!valid}
          aria-describedby={id ? `${id}-help` : undefined}
          onChange={(e) => {
            setText(e.target.value);
            const n = tryNormalizeHex(e.target.value);
            if (n) onChange(n);
          }}
          className="font-mono uppercase"
          placeholder="#A65C3D"
        />
      </div>
      <p id={id ? `${id}-help` : undefined} className={cx('mt-1.5 text-xs', valid ? 'text-muted' : 'text-danger')}>
        {valid
          ? 'Ein HEX-Code beschreibt eine Farbe mit sechs Zeichen: je zwei für Rot, Grün und Blau.'
          : 'Bitte einen gültigen HEX-Code eingeben, z. B. #A65C3D oder A65C3D.'}
      </p>
    </div>
  );
}

/** Verständliche Beschreibung einer Farbe (Name + Eigenschaften). */
export function ColorDescription({ hex }: { hex: HexColor }) {
  const n = nameColor(hex);
  const p = colorProfile(hex);
  return (
    <div className="flex items-center gap-3">
      <span className="h-12 w-12 shrink-0 rounded-xl border border-black/10" style={{ background: hex }} aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold">{n.name}</p>
        <p className="text-xs text-muted">
          {n.description !== n.name && `${n.description} · `}
          {LIGHTNESS_LABEL[p.lightness]}, {CHROMA_LABEL[p.chroma]}, {TEMPERATURE_LABEL[p.temperature]} · <span className="font-mono">{hex}</span>
        </p>
      </div>
    </div>
  );
}

export type ChooserMethod = 'visual' | 'palette' | 'hex' | 'photo';

export function ColorChooser({
  value,
  onChange,
  groups,
  defaultMethod = 'palette',
  idPrefix = 'cc',
}: {
  value: HexColor;
  onChange: (hex: HexColor, name?: string) => void;
  groups: PaletteGroup[];
  defaultMethod?: ChooserMethod;
  idPrefix?: string;
}) {
  const [method, setMethod] = useState<ChooserMethod>(groups.length ? defaultMethod : 'visual');
  return (
    <div className="space-y-4">
      <ColorDescription hex={value} />
      <Segmented<ChooserMethod>
        label="Methode der Farbbestimmung"
        value={method}
        onChange={setMethod}
        options={[
          { value: 'palette', label: 'Palette' },
          { value: 'visual', label: 'Farbfeld' },
          { value: 'hex', label: 'HEX' },
          { value: 'photo', label: 'Foto' },
        ]}
      />
      {method === 'visual' && <VisualPicker value={value} onChange={(h) => onChange(h)} />}
      {method === 'palette' && <PalettePicker value={value} onChange={onChange} groups={groups} />}
      {method === 'hex' && <HexInput id={`${idPrefix}-hex`} value={value} onChange={(h) => onChange(h)} />}
      {method === 'photo' && <PhotoColorPicker onPick={(h) => onChange(h)} compact />}
    </div>
  );
}
