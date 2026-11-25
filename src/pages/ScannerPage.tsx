/**
 * Farbscanner: Kamera-Modus (Live-Vorschau mit Zielkreis) und Foto-Modus.
 * Bilder und Messwerte bleiben lokal. Der Kamerastream wird beim Verlassen beendet.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CameraOff, Plus, RotateCcw, ShoppingBag, Palette as PaletteIcon } from 'lucide-react';
import type { HexColor } from '@/domain/types';
import { useAppData } from '@/app/AppData';
import { Badge, Button, Callout, Card, PageHeader, Segmented } from '@/components/ui/primitives';
import { PhotoColorPicker } from '@/components/color/PhotoColorPicker';
import { ColorDescription, HexInput, VisualPicker } from '@/components/color/ColorPicker';
import { applyWhiteBalance, sampleRegion } from '@/domain/image/sampling';
import { nameColor } from '@/domain/color';
import { SEASON_FIT_LABEL, seasonFit } from '@/domain/seasons/fit';
import { createId, nowIso } from '@/domain/id';
import { useToast } from '@/components/ui/Toast';
import { t } from '@/i18n';

type CamState = 'idle' | 'starting' | 'live' | 'error';

export function cameraErrorMessage(e: unknown): string {
  const name = (e as { name?: string })?.name;
  if (typeof window !== 'undefined' && !window.isSecureContext) return 'Der Kamerazugriff benötigt eine sichere Verbindung (HTTPS oder localhost). Nutze stattdessen den Foto-Modus.';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Der Kamerazugriff wurde nicht erlaubt. Du kannst ihn in den Browser-Einstellungen freigeben oder den Foto-Modus nutzen.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'Es wurde keine passende Kamera gefunden. Nutze den Foto-Modus.';
    case 'NotReadableError':
      return 'Die Kamera wird gerade von einer anderen Anwendung verwendet.';
    default:
      return 'Die Kamera konnte nicht gestartet werden. Nutze den Foto-Modus.';
  }
}

function CameraScanner({ onResult, referenceHex, onReference }: { onResult: (hex: HexColor) => void; referenceHex: HexColor | null; onReference: (hex: HexColor) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<CamState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<{ hex: HexColor; warnings: string[] } | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState('idle');
    setLive(null);
  }, []);

  // Stream beim Verlassen der Seite immer beenden
  useEffect(() => stop, [stop]);

  const start = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(cameraErrorMessage({ name: window.isSecureContext ? 'NotFoundError' : 'SecurityError' }));
      setState('error');
      return;
    }
    setState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState('live');
    } catch (e) {
      setError(cameraErrorMessage(e));
      setState('error');
    }
  };

  const measure = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    canvasRef.current ??= document.createElement('canvas');
    const c = canvasRef.current;
    const w = 320;
    const h = Math.round((v.videoHeight / v.videoWidth) * w);
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(v, 0, 0, w, h);
    return sampleRegion(ctx.getImageData(0, 0, w, h), w / 2, h / 2, 10);
  }, []);

  // Live-Messung im Zielkreis
  useEffect(() => {
    if (state !== 'live') return;
    const id = window.setInterval(() => {
      const r = measure();
      if (r) setLive({ hex: referenceHex ? applyWhiteBalance(r.hex, referenceHex) : r.hex, warnings: r.warnings });
    }, 350);
    return () => window.clearInterval(id);
  }, [state, measure, referenceHex]);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: '4 / 3' }}>
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" aria-label="Kameravorschau" />
        {state === 'live' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <span className="h-16 w-16 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.5)]" />
            <span className="absolute h-px w-24 bg-white/70" />
            <span className="absolute h-24 w-px bg-white/70" />
          </div>
        )}
        {state !== 'live' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <Camera className="h-8 w-8 opacity-70" aria-hidden />
            <p className="max-w-sm text-sm opacity-80">Die Kamera startet erst nach deiner ausdrücklichen Erlaubnis. Es werden keine Bilder übertragen oder gespeichert.</p>
            <Button variant="secondary" onClick={start} disabled={state === 'starting'}>
              {state === 'starting' ? 'Kamera wird gestartet …' : 'Kamera starten'}
            </Button>
          </div>
        )}
      </div>
      {error && <Callout tone="attention">{error}</Callout>}
      {state === 'live' && (
        <div className="flex flex-wrap items-center gap-2">
          {live && (
            <span className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm">
              <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: live.hex }} />
              {nameColor(live.hex).name} <span className="font-mono text-muted">{live.hex}</span>
            </span>
          )}
          <Button variant="primary" onClick={() => live && onResult(live.hex)} disabled={!live}>
            Farbe übernehmen
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const r = measure();
              if (r) onReference(r.hex);
            }}
          >
            Graukarte im Kreis messen
          </Button>
          <Button variant="ghost" onClick={stop}>
            <CameraOff className="h-4 w-4" /> Kamera beenden
          </Button>
        </div>
      )}
      {live?.warnings.map((w) => (
        <p key={w} className="text-sm text-attention">
          {w}
        </p>
      ))}
    </div>
  );
}

export default function ScannerPage() {
  const { season, updateProfile } = useAppData();
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState<'photo' | 'camera'>('photo');
  const [result, setResult] = useState<HexColor | null>(null);
  const [reference, setReference] = useState<HexColor | null>(null);
  const [adjust, setAdjust] = useState(false);
  const fit = result && season ? seasonFit(result, season) : null;

  return (
    <div>
      <PageHeader
        title={t.nav.scanner}
        description="Bestimme die Farbe eines Kleidungsstücks per Kamera oder Foto. Gemessen wird immer ein kleiner Bereich, nicht ein einzelner Pixel."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Segmented
            label="Modus"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'photo', label: 'Foto' },
              { value: 'camera', label: 'Kamera (live)' },
            ]}
          />
          {mode === 'camera' ? (
            <CameraScanner onResult={setResult} referenceHex={reference} onReference={(h) => { setReference(h); toast.show('Referenz gesetzt – Weißabgleich aktiv.'); }} />
          ) : (
            <PhotoColorPicker onPick={(h) => setResult(h)} referenceHex={reference} onReference={(h) => { setReference(h); if (h) toast.show('Referenz gesetzt – Weißabgleich aktiv.'); }} />
          )}
          <Callout title="Grenzen des Farbscanners" tone="attention">
            Ein Kamerascan ist eine Schätzung der wahrgenommenen Farbe, keine professionelle farbmetrische Messung. Warmes oder kaltes Licht, Schatten,
            Spiegelungen, Kamerasensor und automatischer Weißabgleich verändern das Ergebnis. Für bessere Werte: indirektes Tageslicht, gleichmäßige
            Beleuchtung, kein Blitz – und optional eine neutrale Grau- oder Weißkarte als Referenz.
          </Callout>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">Referenz (Weißabgleich)</p>
              {reference ? <Badge tone="positive">aktiv</Badge> : <Badge>aus</Badge>}
            </div>
            {reference ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="h-6 w-6 rounded border border-black/10" style={{ background: reference }} />
                <span className="font-mono">{reference}</span>
                <Button size="sm" variant="ghost" onClick={() => setReference(null)}>
                  <RotateCcw className="h-3.5 w-3.5" /> Zurücksetzen
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted">Optional: Eine neutrale Grau- oder Weißkarte mit fotografieren und antippen. Die App rechnet dann den Farbstich des Lichts heraus.</p>
            )}
          </Card>

          <Card className="p-4">
            <p className="mb-3 font-semibold">Ergebnis</p>
            {result ? (
              <div className="space-y-3">
                <ColorDescription hex={result} />
                {fit && (
                  <p className="text-sm text-muted">
                    {season!.nameDe}: <strong>{SEASON_FIT_LABEL[fit.level]}</strong>
                  </p>
                )}
                <button type="button" className="text-sm underline" onClick={() => setAdjust((a) => !a)} aria-expanded={adjust}>
                  Farbe manuell nachkorrigieren
                </button>
                {adjust && (
                  <div className="space-y-3">
                    <VisualPicker value={result} onChange={setResult} />
                    <HexInput id="scan-hex" value={result} onChange={setResult} />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Button variant="primary" onClick={() => navigate(`/kleiderschrank/neu?hex=${result.slice(1)}`)}>
                    <Plus className="h-4 w-4" /> Als Kleidungsstück anlegen
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/kleiderschrank/neu?hex=${result.slice(1)}&status=wishlist`)}>
                    <ShoppingBag className="h-4 w-4" /> Als Kaufidee prüfen
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await updateProfile((p) => ({ ...p, customSwatches: [...p.customSwatches, { id: createId('sw'), hex: result, name: nameColor(result).name, kind: 'personal', createdAt: nowIso(), note: 'gescannt' }] }));
                      toast.show('Zur persönlichen Palette hinzugefügt.');
                    }}
                  >
                    <PaletteIcon className="h-4 w-4" /> Zur Palette hinzufügen
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Tippe im Foto auf das Kleidungsstück oder übernimm die Farbe im Kamerakreis.</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
