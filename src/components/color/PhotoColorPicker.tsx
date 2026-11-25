/**
 * Foto-Farbscanner: Bild lokal laden, zoomen, Bereich antippen, Farbe übernehmen.
 * Bilder verlassen das Gerät nicht.
 */
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ImagePlus, Minus, Plus, Sparkles } from 'lucide-react';
import type { HexColor } from '@/domain/types';
import { dominantColors, sampleRegion, applyWhiteBalance, type DominantColor } from '@/domain/image/sampling';
import { nameColor } from '@/domain/color';
import { Button, Callout, Segmented, cx } from '../ui/primitives';
import { Swatch } from './Swatch';

export interface PickedColor {
  hex: HexColor;
  rawHex: HexColor;
  warnings: string[];
  sampleSize: number;
}

export function PhotoColorPicker({
  onPick,
  compact = false,
  initialImage,
  referenceHex,
  onReference,
}: {
  onPick: (hex: HexColor, info: PickedColor) => void;
  compact?: boolean;
  initialImage?: Blob | null;
  referenceHex?: HexColor | null;
  onReference?: (hex: HexColor | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasImage, setHasImage] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [radius, setRadius] = useState(8);
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const [last, setLast] = useState<PickedColor | null>(null);
  const [mode, setMode] = useState<'pick' | 'reference'>('pick');
  const [dominant, setDominant] = useState<DominantColor[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async (blob: Blob) => {
    setError(null);
    try {
      const bmp = await createImageBitmap(blob);
      const max = 900;
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const c = canvasRef.current!;
      c.width = Math.round(bmp.width * scale);
      c.height = Math.round(bmp.height * scale);
      c.getContext('2d', { willReadFrequently: true })!.drawImage(bmp, 0, 0, c.width, c.height);
      setHasImage(true);
      setMarker(null);
      setLast(null);
      setDominant([]);
      setZoom(1);
    } catch {
      setError('Das Bild konnte nicht geladen werden. Unterstützt werden JPEG, PNG, WebP und GIF.');
    }
  };

  useEffect(() => {
    if (initialImage) void load(initialImage);
  }, [initialImage]);

  const pickAt = (e: PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * c.width;
    const y = ((e.clientY - r.top) / r.height) * c.height;
    const img = c.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, c.width, c.height);
    const res = sampleRegion(img, x, y, radius);
    if (!res) return;
    setMarker({ x: (x / c.width) * 100, y: (y / c.height) * 100 });
    if (mode === 'reference') {
      onReference?.(res.hex);
      setMode('pick');
      return;
    }
    const hex = referenceHex ? applyWhiteBalance(res.hex, referenceHex) : res.hex;
    const info = { hex, rawHex: res.hex, warnings: res.warnings, sampleSize: res.sampleSize };
    setLast(info);
    onPick(hex, info);
  };

  const findDominant = () => {
    const c = canvasRef.current!;
    const img = c.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, c.width, c.height);
    setDominant(dominantColors(img, 6).map((d) => ({ ...d, hex: referenceHex ? applyWhiteBalance(d.hex, referenceHex) : d.hex })));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-ink hover:opacity-90">
          <ImagePlus className="h-4 w-4" aria-hidden />
          {hasImage ? 'Anderes Foto' : 'Foto wählen oder aufnehmen'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void load(f);
            }}
          />
        </label>
        {hasImage && (
          <>
            <Button size="icon" variant="outline" aria-label="Verkleinern" onClick={() => setZoom((z) => Math.max(1, z - 0.5))}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-sm text-muted">{Math.round(zoom * 100)} %</span>
            <Button size="icon" variant="outline" aria-label="Vergrößern" onClick={() => setZoom((z) => Math.min(4, z + 0.5))}>
              <Plus className="h-4 w-4" />
            </Button>
            {!compact && (
              <Button variant="outline" onClick={findDominant}>
                <Sparkles className="h-4 w-4" aria-hidden /> Dominante Farben
              </Button>
            )}
          </>
        )}
      </div>
      {error && <Callout tone="attention">{error}</Callout>}
      <div className={cx('relative overflow-auto rounded-xl border border-line bg-surface-2', hasImage ? (compact ? 'max-h-64' : 'max-h-[60vh]') : 'hidden')}>
        <div className="relative" style={{ width: `${zoom * 100}%` }}>
          <canvas ref={canvasRef} onPointerDown={pickAt} className="block w-full cursor-crosshair touch-manipulation" aria-label="Foto – Stelle antippen, um die Farbe zu messen" />
          {marker && (
            <span
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
              style={{ left: `${marker.x}%`, top: `${marker.y}%`, width: `${radius * 2 * zoom}px`, height: `${radius * 2 * zoom}px`, minWidth: 12, minHeight: 12 }}
            />
          )}
        </div>
      </div>
      {hasImage && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            Messbereich
            <input type="range" min={3} max={30} value={radius} onChange={(e) => setRadius(Number(e.target.value))} aria-label="Größe des Messbereichs" />
          </label>
          {onReference && (
            <Segmented
              label="Modus"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'pick', label: 'Farbe messen' },
                { value: 'reference', label: 'Graukarte antippen' },
              ]}
            />
          )}
        </div>
      )}
      {!hasImage && !compact && (
        <Callout title="Tipps für eine brauchbare Aufnahme">
          Indirektes Tageslicht, kein Blitz, keine direkte Sonne. Das Kleidungsstück flach und faltenfrei hinlegen. Für genauere Werte eine neutrale
          Grau- oder Weißkarte mit ins Bild legen und als Referenz antippen.
        </Callout>
      )}
      {last && (
        <div className="rounded-xl border border-line p-3 text-sm">
          <p>
            Gemessen: <strong>{nameColor(last.hex).name}</strong> <span className="font-mono text-muted">{last.hex}</span>
            {referenceHex && <span className="text-muted"> (mit Weißabgleich, ungekorrigiert {last.rawHex})</span>}
          </p>
          {last.warnings.map((w) => (
            <p key={w} className="mt-1 text-attention">
              {w}
            </p>
          ))}
        </div>
      )}
      {dominant.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Dominante Farben – antippen zum Übernehmen</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {dominant.map((d) => (
              <Swatch key={d.hex} hex={d.hex} note={`${Math.round(d.share * 100)} %`} onClick={() => onPick(d.hex, { hex: d.hex, rawHex: d.hex, warnings: [], sampleSize: 0 })} />
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-muted">
        Ein Foto liefert eine Schätzung der wahrgenommenen Farbe – keine professionelle farbmetrische Messung. Licht, Kamera und Weißabgleich
        beeinflussen das Ergebnis.
      </p>
    </div>
  );
}
