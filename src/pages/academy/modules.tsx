/**
 * Lernmodule der Farbakademie. Jedes Modul: einfache Erklärung, Farbfelder,
 * Kleidungsbeispiele und – wo sinnvoll – ein interaktives Experiment oder Quiz.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import type { HexColor, OutfitSlot, OutfitSlotValue } from '@/domain/types';
import { colorProfile, CHROMA_LABEL, hexToOklch, LIGHTNESS_LABEL, mixOklab, nameColor, NEUTRALITY_LABEL, oklchToHex, rgbToHex, TEMPERATURE_LABEL } from '@/domain/color';
import { GREY_BROWN_CASES, CURATED_EXAMPLES, HARMONY_LABEL, TEE_PAIRINGS } from '@/domain/examples/curated';
import { pairColors } from '@/domain/recommendation/pairing';
import { OutfitFigure } from '@/illustrations/Figure';
import { garmentColor } from '@/domain/profile/factory';
import { Swatch, ColorStrip } from '@/components/color/Swatch';
import { Badge, Callout, Card, LinkButton, cx } from '@/components/ui/primitives';
import { useAppData } from '@/app/AppData';

export type Level = 'Einstieg' | 'Grundlagen' | 'Vertiefung';

export interface AcademyModule {
  id: string;
  title: string;
  level: Level;
  summary: string;
  ready: boolean;
  Component?: () => ReactNode;
}

/* ---------------- Hilfskomponenten ---------------- */

const P = ({ children }: { children: ReactNode }) => <p className="leading-relaxed">{children}</p>;

function MiniOutfit({ top, bottom, outer, className = 'h-72' }: { top: HexColor; bottom: HexColor; outer?: HexColor; className?: string }) {
  const slots: Partial<Record<OutfitSlot, OutfitSlotValue>> = {
    base: { subcategory: 'oversized-tee', colors: [garmentColor(top)], pattern: { type: 'solid' } },
    bottom: { subcategory: 'chino', colors: [garmentColor(bottom)], pattern: { type: 'solid' } },
    shoes: { subcategory: 'sneaker', colors: [garmentColor('#F1EEE7')], pattern: { type: 'solid' } },
  };
  if (outer) slots.outer = { subcategory: 'harrington', colors: [garmentColor(outer)], pattern: { type: 'solid' } };
  return <OutfitFigure slots={slots} options={{ jacketOpen: true, showSkin: false, showHair: false, showBeard: false }} className={cx('w-auto', className)} />;
}

function Slider({ label, value, min, max, step = 1, onChange, gradient, valueText }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; gradient: string; valueText: string }) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted">{valueText}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="cw-range w-full" style={{ background: gradient }} aria-valuetext={valueText} />
    </label>
  );
}

function Quiz({ question, options, answer, explanation }: { question: string; options: { label: ReactNode; id: string }[]; answer: string; explanation: string }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <Card className="p-4">
      <p className="mb-3 font-semibold">Kurzes Quiz: {question}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setPicked(o.id)}
            aria-pressed={picked === o.id}
            className={cx('rounded-xl border p-2 text-sm', picked === o.id ? (o.id === answer ? 'border-positive' : 'border-attention') : 'border-line hover:bg-surface-2')}
          >
            {o.label}
          </button>
        ))}
      </div>
      {picked && (
        <p className={cx('mt-3 text-sm', picked === answer ? 'text-positive' : 'text-attention')} role="status">
          {picked === answer ? 'Richtig! ' : 'Nicht ganz. '}
          {explanation}
        </p>
      )}
    </Card>
  );
}

function ColorFacts({ hex }: { hex: HexColor }) {
  const p = colorProfile(hex);
  return (
    <p className="text-sm text-muted">
      <strong className="text-ink">{nameColor(hex).name}</strong> · {LIGHTNESS_LABEL[p.lightness]} · {CHROMA_LABEL[p.chroma]} · {TEMPERATURE_LABEL[p.temperature]} · <span className="font-mono">{hex}</span>
    </p>
  );
}

/* ---------------- Module ---------------- */

function WhatIsColor() {
  const [light, setLight] = useState(0);
  const base = '#89674F';
  const tinted = light === 0 ? base : mixOklab(base, light > 0 ? '#FFB45A' : '#7FA8FF', Math.abs(light) / 100 * 0.35);
  return (
    <div className="space-y-5">
      <P>
        Farbe ist keine feste Eigenschaft eines Stoffes, sondern entsteht im Zusammenspiel von Licht, Material und unserem Sehen. Ein Stoff verschluckt
        einen Teil des Lichts und wirft den Rest zurück – diesen Rest nehmen wir als Farbe wahr.
      </P>
      <P>Deshalb sieht dasselbe Kleidungsstück im warmen Abendlicht anders aus als im kühlen Tageslicht. Probiere es aus:</P>
      <Slider label="Beleuchtung" value={light} min={-100} max={100} onChange={setLight} gradient="linear-gradient(to right, #7FA8FF, #F0EEE9, #FFB45A)" valueText={light === 0 ? 'neutrales Tageslicht' : light > 0 ? 'warmes Licht' : 'kühles Licht'} />
      <div className="grid grid-cols-2 gap-4">
        <Swatch hex={base} name="Stofffarbe (neutrales Licht)" size="lg" />
        <Swatch hex={tinted} name="So wirkt sie gerade" size="lg" />
      </div>
      <Callout>Darum empfiehlt der Farbscanner indirektes Tageslicht und optional eine Graukarte zum Weißabgleich.</Callout>
    </div>
  );
}

function HexModule() {
  const [rgb, setRgb] = useState({ r: 166, g: 92, b: 61 });
  const hex = rgbToHex(rgb);
  return (
    <div className="space-y-5">
      <P>
        Ein HEX-Code wie <span className="font-mono">#A65C3D</span> ist eine Kurzschrift für eine Farbe auf dem Bildschirm. Nach der Raute folgen drei
        Paare: Rot, Grün und Blau. Jedes Paar reicht von <span className="font-mono">00</span> (nichts) bis <span className="font-mono">FF</span> (voll).
      </P>
      <P>Du musst HEX-Codes nicht verstehen, um ChromaWardrobe zu nutzen – sie sind nur praktisch, um Farben exakt weiterzugeben.</P>
      <div className="grid gap-5 md:grid-cols-[1fr_200px]">
        <div className="space-y-3">
          {(['r', 'g', 'b'] as const).map((k) => (
            <Slider
              key={k}
              label={{ r: 'Rot', g: 'Grün', b: 'Blau' }[k]}
              value={rgb[k]}
              min={0}
              max={255}
              onChange={(v) => setRgb({ ...rgb, [k]: v })}
              gradient={`linear-gradient(to right, ${rgbToHex({ ...rgb, [k]: 0 })}, ${rgbToHex({ ...rgb, [k]: 255 })})`}
              valueText={`${rgb[k]} = ${rgb[k].toString(16).padStart(2, '0').toUpperCase()}`}
            />
          ))}
        </div>
        <div>
          <Swatch hex={hex} size="lg" />
          <p className="mt-2 font-mono text-lg">
            #<span className="text-[#C0392B]">{hex.slice(1, 3)}</span>
            <span className="text-[#2E7D32]">{hex.slice(3, 5)}</span>
            <span className="text-[#1F4FA0]">{hex.slice(5, 7)}</span>
          </p>
        </div>
      </div>
      <Quiz
        question="Welcher Code ist Weiß?"
        options={[
          { id: '000000', label: <span className="font-mono">#000000</span> },
          { id: 'FFFFFF', label: <span className="font-mono">#FFFFFF</span> },
          { id: 'FF0000', label: <span className="font-mono">#FF0000</span> },
        ]}
        answer="FFFFFF"
        explanation="FF bei Rot, Grün und Blau bedeutet: alles Licht voll an – das ergibt Weiß."
      />
    </div>
  );
}

function ColorWheel() {
  const [sel, setSel] = useState(1);
  const n = 12;
  const segs = Array.from({ length: n }, (_, i) => oklchToHex({ L: 0.62, C: 0.13, h: (i * 360) / n + 25 }));
  const rel = (i: number) => {
    const d = Math.min((i - sel + n) % n, (sel - i + n) % n);
    if (i === sel) return 'Ausgewählt';
    if (d === 6) return 'Komplementär';
    if (d === 1) return 'Analog';
    if (d === 4) return 'Triadisch';
    if (d === 5) return 'Split-Komplementär';
    return '';
  };
  const complement = segs[(sel + 6) % n];
  return (
    <div className="space-y-5">
      <P>
        Der Farbkreis ordnet Farbtöne im Kreis an. Nachbarn wirken verwandt (<strong>analog</strong>), gegenüberliegende Farben bilden einen starken
        Kontrast (<strong>komplementär</strong>). Drei gleichmäßig verteilte Farben sind <strong>triadisch</strong>.
      </P>
      <div className="grid items-center gap-6 md:grid-cols-[280px_1fr]">
        <svg viewBox="-110 -110 220 220" className="mx-auto w-64" role="group" aria-label="Farbkreis – Segment auswählen">
          {segs.map((c, i) => {
            const a0 = ((i - 0.5) / n) * 2 * Math.PI - Math.PI / 2;
            const a1 = ((i + 0.5) / n) * 2 * Math.PI - Math.PI / 2;
            const r0 = 50;
            const r1 = rel(i) ? 104 : 96;
            const d = `M${r0 * Math.cos(a0)} ${r0 * Math.sin(a0)} L${r1 * Math.cos(a0)} ${r1 * Math.sin(a0)} A${r1} ${r1} 0 0 1 ${r1 * Math.cos(a1)} ${r1 * Math.sin(a1)} L${r0 * Math.cos(a1)} ${r0 * Math.sin(a1)} A${r0} ${r0} 0 0 0 ${r0 * Math.cos(a0)} ${r0 * Math.sin(a0)} Z`;
            return (
              <path
                key={i}
                d={d}
                fill={c}
                stroke={i === sel ? 'var(--cw-ink)' : 'var(--cw-surface)'}
                strokeWidth={i === sel ? 3 : 1.5}
                tabIndex={0}
                role="button"
                aria-label={`${nameColor(c).name}${rel(i) ? ` – ${rel(i)}` : ''}`}
                onClick={() => setSel(i)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(i)}
                className="cursor-pointer"
              />
            );
          })}
          <text textAnchor="middle" y="4" fontSize="11" fill="var(--cw-muted)">
            antippen
          </text>
        </svg>
        <div className="space-y-3">
          <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {segs.map((c, i) =>
              rel(i) ? (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded border border-black/10" style={{ background: c }} /> {rel(i)}
                </li>
              ) : null,
            )}
          </ul>
          <div className="flex items-end gap-4">
            <MiniOutfit top={segs[sel]} bottom={complement} className="h-56" />
            <MiniOutfit top={segs[sel]} bottom={mixOklab(complement, '#7A776F', 0.6)} className="h-56" />
          </div>
          <p className="text-sm text-muted">
            Links: reiner Komplementärkontrast – sehr auffällig. Rechts: dieselbe Gegenfarbe stark gedämpft – in der Kleidung meist alltagstauglicher.
            Mathematisch „passende“ Farben sind nicht automatisch stilistisch harmonisch.
          </p>
        </div>
      </div>
    </div>
  );
}

function WarmCool() {
  const [t, setT] = useState(0);
  const hex = oklchToHex({ L: 0.62, C: 0.03 + Math.abs(t) * 0.0006, h: t >= 0 ? 70 : 250 });
  return (
    <div className="space-y-5">
      <P>
        <strong>Warme Farben</strong> haben einen Gelb- oder Orangeanteil (Camel, Rost, Oliv). <strong>Kühle Farben</strong> haben einen Blau- oder
        Rosaanteil (Marine, Eisblau, Beere). Auch Neutrale haben eine Temperatur: Ein Grau kann leicht gelblich (warm) oder leicht bläulich (kühl) sein.
      </P>
      <Slider label="Temperatur eines Grautons" value={t} min={-100} max={100} onChange={setT} gradient="linear-gradient(to right, #6F7E96, #8F8E8B, #A08A6A)" valueText={TEMPERATURE_LABEL[colorProfile(hex).temperature]} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Swatch hex={hex} size="lg" />
        <Swatch hex="#89613F" name="Warmes Braun" size="lg" />
      </div>
      <p className="text-sm text-muted">Schiebe den Regler nach links: Neben dem warmen Braun wirkt ein kühles Grau zunehmend „fremd“. Nach rechts verbinden sich beide.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Rot', '#B4483A', '#B3122E'],
          ['Grün', '#656749', '#1B5E57'],
          ['Weiß', '#F3EAD7', '#F4F6F8'],
        ].map(([n, w, k]) => (
          <Card key={n} className="p-3">
            <p className="mb-2 text-sm font-medium">{n}: warm vs. kühl</p>
            <div className="grid grid-cols-2 gap-2">
              <Swatch hex={w} name={`Warmes ${n}`} />
              <Swatch hex={k} name={`Kühles ${n}`} />
            </div>
          </Card>
        ))}
      </div>
      <Quiz
        question="Welche Farbe ist wärmer?"
        options={[
          { id: 'a', label: <Swatch hex="#465B73" name="Jeansblau" size="sm" /> },
          { id: 'b', label: <Swatch hex="#B18A5E" name="Camel" size="sm" /> },
        ]}
        answer="b"
        explanation="Camel enthält viel Gelb-Orange und ist damit warm. Jeansblau ist kühl."
      />
    </div>
  );
}

function Lightness() {
  const [L, setL] = useState(0.4);
  const top = oklchToHex({ L, C: 0.05, h: 150 });
  const bottom = '#CBB99C';
  return (
    <div className="space-y-5">
      <P>
        Helligkeit beschreibt, wie hell oder dunkel eine Farbe ist – unabhängig vom Farbton. Der <strong>Helligkeitskontrast</strong> zwischen Oberteil
        und Hose bestimmt stark, wie klar ein Outfit wirkt. Wenig Kontrast wirkt weich, viel Kontrast markant.
      </P>
      <div className="grid items-center gap-6 md:grid-cols-[1fr_220px]">
        <div className="space-y-3">
          <Slider label="Helligkeit des Shirts" value={L} min={0.2} max={0.95} step={0.01} onChange={setL} gradient="linear-gradient(to right, #1b2a20, #6f8f78, #eef3ef)" valueText={LIGHTNESS_LABEL[colorProfile(top).lightness]} />
          <ColorFacts hex={top} />
          <p className="text-sm text-muted">
            Helligkeitsunterschied zur Hose: <strong>{Math.round(Math.abs(hexToOklch(top).L - hexToOklch(bottom).L) * 100)}</strong> von 100.{' '}
            {Math.abs(hexToOklch(top).L - hexToOklch(bottom).L) < 0.1 ? 'Die Teile verschmelzen fast.' : 'Die Teile heben sich voneinander ab.'}
          </p>
          <Callout>Tipp für Graustufen: Kneife die Augen zusammen – dann siehst du vor allem Helligkeit statt Farbe.</Callout>
        </div>
        <MiniOutfit top={top} bottom={bottom} />
      </div>
    </div>
  );
}

function Saturation() {
  const [C, setC] = useState(0.06);
  const top = oklchToHex({ L: 0.55, C, h: 40 });
  return (
    <div className="space-y-5">
      <P>
        Die <strong>Sättigung</strong> (Buntheit) beschreibt, wie rein oder „leuchtend“ eine Farbe ist. <strong>Gedeckte Farben</strong> enthalten
        sozusagen etwas Grau – sie wirken ruhig, natürlich und lassen sich leicht kombinieren. <strong>Klare Farben</strong> sind rein und strahlend.
      </P>
      <div className="grid items-center gap-6 md:grid-cols-[1fr_220px]">
        <div className="space-y-3">
          <Slider label="Sättigung des Shirts" value={C} min={0} max={0.2} step={0.005} onChange={setC} gradient="linear-gradient(to right, #8d8580, #b4654a, #e2401c)" valueText={CHROMA_LABEL[colorProfile(top).chroma]} />
          <ColorFacts hex={top} />
          <div className="grid grid-cols-3 gap-2">
            <Swatch hex="#B76C60" name="Gedeckt: verwaschenes Rot" />
            <Swatch hex="#A65C3D" name="Mittel: Rostrot" />
            <Swatch hex="#E8322E" name="Klar: leuchtendes Rot" />
          </div>
        </div>
        <MiniOutfit top={top} bottom="#293E53" />
      </div>
    </div>
  );
}

function Neutrals() {
  const { garments } = useAppData();
  const owned = garments.filter((g) => g.ownership === 'owned');
  return (
    <div className="space-y-5">
      <P>
        Neutrale Grundfarben sind die ruhigen Begleiter eines Kleiderschranks. In der Mode zählen dazu nicht nur Schwarz, Grau und Weiß, sondern auch
        <strong> warme Neutrale</strong> (Beige, Camel, Braun, Ecru) und <strong>kühle Neutrale</strong> (Marine, Anthrazit). Sie lassen eine einzelne
        Akzentfarbe wirken.
      </P>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {['#F3EAD7', '#E5D8BF', '#CBB99C', '#B18A5E', '#4F382E', '#FAFAFA', '#C4C4C4', '#414143', '#1C1C1E', '#293E53', '#263346', '#465B73'].map((h) => (
          <Swatch key={h} hex={h} note={NEUTRALITY_LABEL[colorProfile(h).neutrality]} />
        ))}
      </div>
      {owned.length > 0 && (
        <Card className="p-4">
          <p className="mb-2 font-semibold">In deinem Kleiderschrank</p>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {owned.map((g) => (
              <li key={g.id} className="flex items-center gap-2">
                <span className="h-4 w-4 rounded border border-black/10" style={{ background: g.colors[0].hex }} />
                <span className="truncate">{g.name}</span>
                <span className="ml-auto shrink-0 text-muted">{NEUTRALITY_LABEL[colorProfile(g.colors[0].hex).neutrality]}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Callout>Weißes T-Shirt als Dauerlösung? Cremeweiß und Ecru sind ähnlich einfach zu kombinieren, aber weicher – und farbige Shirts funktionieren besonders leicht mit neutralen Hosen und Jacken.</Callout>
    </div>
  );
}

function GreyBrown() {
  return (
    <div className="space-y-5">
      <P>
        Grau und Braun gelten beide als „neutral“ – trotzdem wirken sie zusammen oft unentschieden. Der Grund liegt meist in drei Faktoren:
        <strong> Temperatur</strong> (kühles Grau vs. warmes Braun), <strong>Helligkeit</strong> (zu ähnlich) und <strong>Sättigung</strong> (beide
        gedämpft, keiner führt).
      </P>
      <div className="grid gap-4 md:grid-cols-2">
        {GREY_BROWN_CASES.map((c) => {
          const g = colorProfile(c.grey.hex);
          const b = colorProfile(c.brown.hex);
          const ev = pairColors(c.grey.hex, c.brown.hex);
          return (
            <Card key={c.id} className="overflow-hidden">
              <div className="flex items-end gap-2 bg-stage p-3">
                <MiniOutfit top={c.brown.hex} bottom={c.grey.hex} className="h-56" />
                <div className="flex-1 space-y-2">
                  <Swatch hex={c.grey.hex} name={c.grey.name} size="sm" />
                  <Swatch hex={c.brown.hex} name={c.brown.name} size="sm" />
                </div>
              </div>
              <div className="space-y-2 p-4">
                <p className="font-semibold">{c.title}</p>
                <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-surface-2 p-2">
                    <dt className="text-muted">Helligkeitsabstand</dt>
                    <dd className="font-semibold">{Math.round(Math.abs(g.L - b.L) * 100)}</dd>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2">
                    <dt className="text-muted">Grau</dt>
                    <dd className="font-semibold">{TEMPERATURE_LABEL[g.temperature]}</dd>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2">
                    <dt className="text-muted">Braun</dt>
                    <dd className="font-semibold">{TEMPERATURE_LABEL[b.temperature]}</dd>
                  </div>
                </dl>
                <p className="text-sm text-muted">{c.explanation}</p>
                <Badge tone={ev.level === 'careful' ? 'attention' : 'positive'}>Einschätzung der App: {ev.level === 'careful' ? 'mit Bedacht' : ev.level === 'possible' ? 'möglich' : 'gut kombinierbar'}</Badge>
              </div>
            </Card>
          );
        })}
      </div>
      <Callout title="Faustregeln">
        Grau mit Braun gelingt leichter, wenn (1) das Grau warm ist, (2) ein deutlicher Helligkeitsunterschied besteht (Anthrazit + Camel) oder (3) ein
        verbindender Ton wie Ecru oder Cremeweiß dazukommt. Das sind Orientierungen – wenn dir eine Kombination gefällt, zählt das mehr.
      </Callout>
    </div>
  );
}

function Harmonies() {
  const harmonies = CURATED_EXAMPLES.filter((e) => e.group === 'harmony');
  return (
    <div className="space-y-5">
      <P>
        Harmonieprinzipien beschreiben, <em>warum</em> Farben zusammenpassen können: Ton-in-Ton und monochrome Outfits nutzen einen Farbton in
        verschiedenen Helligkeiten, analoge Kombinationen benachbarte Farbtöne, Komplementärkontraste gegenüberliegende. Am einfachsten im Alltag:
        eine neutrale Basis mit einer Akzentfarbe.
      </P>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {harmonies.map((e) => (
          <Card key={e.id} className="overflow-hidden">
            <ColorStrip colors={e.colors} height="h-12" className="rounded-none border-0" />
            <div className="p-4">
              <p className="font-semibold">{e.title}</p>
              {e.harmony && <Badge className="mt-1">{HARMONY_LABEL[e.harmony]}</Badge>}
              <p className="mt-2 text-sm text-muted">{e.description}</p>
              <p className="mt-1 text-xs text-muted">{e.colors.map((c) => `${c.name} ${c.hex}`).join(' · ')}</p>
              <LinkButton to={`/studio?example=${e.id}`} size="sm" variant="ghost" className="mt-2 -ml-3">
                <Layers className="h-4 w-4" /> Im Studio öffnen
              </LinkButton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TeePairings() {
  return (
    <div className="space-y-6">
      <P>
        Farbige T-Shirts sind leichter zu kombinieren, als es scheint: Mit einer neutralen Hose (Dunkelblau, Beige, Ecru, Braun) wird das Shirt zur
        Akzentfarbe. Hier sind kuratierte Partner für die T-Shirts aus dem Startprofil – als Ausgangspunkte, nicht als feste Regeln.
      </P>
      {TEE_PAIRINGS.map((p) => (
        <Card key={p.tee.hex} className="p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl border border-black/10" style={{ background: p.tee.hex }} />
            <div>
              <p className="font-semibold">T-Shirt {p.tee.name}</p>
              <p className="font-mono text-xs text-muted">{p.tee.hex}</p>
            </div>
          </div>
          <p className="mb-3 text-sm text-muted">{p.note}</p>
          <ul className="flex gap-3 overflow-x-auto pb-1">
            {p.pairs.map((pair) => (
              <li key={pair.hex} className="flex w-28 shrink-0 flex-col items-center rounded-xl bg-stage p-2">
                <MiniOutfit top={p.tee.hex} bottom={pair.hex} className="h-40" />
                <span className="mt-1 text-center text-xs font-medium">{pair.name}</span>
                <span className="font-mono text-[10px] text-muted">{pair.hex}</span>
                <Link to={`/studio?colors=${p.tee.hex.slice(1)},${pair.hex.slice(1)}`} className="text-[11px] underline">
                  ausprobieren
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function Contrast() {
  const examples = [
    { label: 'Geringer Kontrast', skin: '#F3D9BF', hair: '#C8A97E', eyes: '#8FA8C8', outfit: ['#E5D8BF', '#C7B596'] },
    { label: 'Mittlerer Kontrast', skin: '#E8C4A3', hair: '#9A7556', eyes: '#6E7A45', outfit: ['#35483C', '#CBB99C'] },
    { label: 'Hoher Kontrast', skin: '#F6E3D4', hair: '#1C1715', eyes: '#3B2A20', outfit: ['#111111', '#FFFFFF'] },
    { label: 'Hoher Kontrast (tiefer Hautton)', skin: '#5C3A2A', hair: '#1C1715', eyes: '#2B1F18', outfit: ['#F4F6F8', '#1F2E6E'] },
  ];
  return (
    <div className="space-y-5">
      <P>
        Dein persönlicher Kontrast beschreibt den Helligkeitsunterschied zwischen Haut, Haaren und Augen. Outfits mit einem ähnlichen Kontrastniveau
        wirken oft besonders stimmig: Wer selbst wenig Kontrast hat, wird von harten Schwarz-Weiß-Kombinationen leicht „überstrahlt“.
      </P>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {examples.map((e) => (
          <Card key={e.label} className="p-3">
            <p className="mb-2 text-sm font-semibold">{e.label}</p>
            <div className="flex gap-1">
              {[e.skin, e.hair, e.eyes].map((h, i) => (
                <span key={i} className="h-10 flex-1 rounded-lg border border-black/10" style={{ background: h }} title={['Haut', 'Haar', 'Augen'][i]} />
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted">Haut · Haar · Augen</p>
            <p className="mt-2 text-xs">Passendes Kontrastniveau:</p>
            <ColorStrip colors={e.outfit.map((hex) => ({ hex }))} height="h-6" />
          </Card>
        ))}
      </div>
      <Callout>Kontrast hat nichts mit „hell“ oder „dunkel“ an sich zu tun – auch Menschen mit tiefem Hautton können geringen, mittleren oder hohen Kontrast haben.</Callout>
    </div>
  );
}

function Proportions() {
  const [a, setA] = useState(60);
  const [b, setB] = useState(30);
  const c = Math.max(0, 100 - a - b);
  return (
    <div className="space-y-5">
      <P>
        Die <strong>60-30-10-Regel</strong> ist eine optionale Orientierung: etwa 60 % Hauptfarbe (z. B. Hose und Jacke), 30 % Nebenfarbe (Oberteil),
        10 % Akzent (Schal, Schuhe). Sie hilft, dass eine Farbe führt und das Outfit nicht „zerfällt“.
      </P>
      <Slider label="Hauptfarbe" value={a} min={20} max={80} onChange={(v) => setA(Math.min(v, 100 - b))} gradient="linear-gradient(to right, #293E53, #293E53)" valueText={`${a} %`} />
      <Slider label="Nebenfarbe" value={b} min={0} max={60} onChange={(v) => setB(Math.min(v, 100 - a))} gradient="linear-gradient(to right, #E5D8BF, #E5D8BF)" valueText={`${b} %`} />
      <ColorStrip height="h-10" colors={[{ hex: '#293E53', share: a }, { hex: '#E5D8BF', share: b }, { hex: '#703A40', share: c }]} />
      <p className="text-sm text-muted">Akzent (Weinrot): {c} %. {a >= 50 && a <= 70 && c <= 15 ? 'Nahe an 60-30-10 – eine klare Hierarchie.' : 'Auch andere Verteilungen funktionieren – z. B. ausgewogene 50/50-Kombinationen.'}</p>
    </div>
  );
}

function Seasons() {
  return (
    <div className="space-y-4">
      <P>
        Saisonale Farbtypen fassen Farbeigenschaften zu vier Familien (Frühling, Sommer, Herbst, Winter) mit je drei Untertypen zusammen. Entscheidend
        sind drei Achsen: <strong>Temperatur</strong> (warm/kühl), <strong>Helligkeit</strong> (hell/dunkel) und <strong>Sättigung</strong> (klar/gedeckt).
      </P>
      <P>
        Das System ist ein ästhetisches Orientierungswerkzeug, keine wissenschaftliche Diagnose. Einzelne Merkmale wie Haarfarbe oder Schmuckvorliebe
        bestimmen nie allein den Typ – und Menschen jeder Hautfarbe kommen in allen Typen vor.
      </P>
      <LinkButton to="/farbtyp" variant="primary">
        Alle 12 Farbtypen erkunden
      </LinkButton>
    </div>
  );
}

function FaceNear() {
  const { profile } = useAppData();
  const [top, setTop] = useState<HexColor>('#35483C');
  const options: HexColor[] = ['#FAFAFA', '#F3EAD7', '#35483C', '#703A40', '#B76C60', '#DCE9F2', '#E5559B', '#292A2C'];
  return (
    <div className="space-y-5">
      <P>
        Farben direkt am Gesicht (T-Shirt, Hemd, Schal, Kragen) beeinflussen, wie Haut, Augen und Haare wirken. Farben weiter weg (Hose, Schuhe)
        haben dagegen kaum Einfluss auf den Teint. Darum gewichtet ChromaWardrobe die Farbtyp-Eignung gesichtsnaher Teile stärker.
      </P>
      <div className="grid items-center gap-6 md:grid-cols-[220px_1fr]">
        <OutfitFigure
          slots={{
            base: { subcategory: 'oversized-tee', colors: [garmentColor(top)], pattern: { type: 'solid' } },
            bottom: { subcategory: 'jeans', colors: [garmentColor('#465B73')], pattern: { type: 'solid' } },
          }}
          options={{ jacketOpen: true, showSkin: true, showHair: true, showBeard: true }}
          appearance={{ skin: profile?.appearance.skinTone?.hex ?? '#E8C4A3', hair: profile?.appearance.hairColor?.hex ?? '#9A7556', beard: profile?.appearance.beardColor?.hex, hasBeard: profile?.appearance.hasBeard }}
          className="h-80 w-auto"
        />
        <div>
          <p className="mb-2 text-sm font-medium">T-Shirt-Farbe wählen und Wirkung am Gesicht vergleichen:</p>
          <div className="grid grid-cols-4 gap-2">
            {options.map((h) => (
              <Swatch key={h} hex={h} selected={h === top} onClick={() => setTop(h)} showHex={false} />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Schematische Darstellung mit den Farben aus deinem Profil – keine fotorealistische Anprobe.</p>
        </div>
      </div>
    </div>
  );
}

export const MODULES: AcademyModule[] = [
  { id: 'farbe', title: 'Was ist Farbe?', level: 'Einstieg', summary: 'Licht, Material und Wahrnehmung – und warum Licht Farben verändert.', ready: true, Component: WhatIsColor },
  { id: 'hex', title: 'Was ist ein HEX-Code?', level: 'Einstieg', summary: 'Rot, Grün und Blau in sechs Zeichen – mit Reglern zum Ausprobieren.', ready: true, Component: HexModule },
  { id: 'farbkreis', title: 'Der Farbkreis', level: 'Einstieg', summary: 'Analog, komplementär, triadisch – interaktiv am Farbkreis.', ready: true, Component: ColorWheel },
  { id: 'warm-kuehl', title: 'Warme und kühle Farben', level: 'Einstieg', summary: 'Farbtemperatur – auch bei Grau und Weiß.', ready: true, Component: WarmCool },
  { id: 'helligkeit', title: 'Helligkeit', level: 'Grundlagen', summary: 'Hell-Dunkel-Kontrast zwischen Oberteil und Hose.', ready: true, Component: Lightness },
  { id: 'saettigung', title: 'Sättigung: gedeckt und klar', level: 'Grundlagen', summary: 'Wie rein oder ruhig eine Farbe wirkt.', ready: true, Component: Saturation },
  { id: 'neutrale', title: 'Neutrale Grundfarben', level: 'Grundlagen', summary: 'Warme und kühle Neutrale als Basis jedes Kleiderschranks.', ready: true, Component: Neutrals },
  { id: 'harmonien', title: 'Harmonien: Ton-in-Ton, analog, komplementär', level: 'Grundlagen', summary: 'Kuratierte Beispiele für monochrome, analoge und komplementäre Kombinationen.', ready: true, Component: Harmonies },
  { id: 't-shirts', title: 'Farbige T-Shirts kombinieren', level: 'Grundlagen', summary: 'Passende Hosenfarben für Weinrot, Dunkelgrün, Braun & Co.', ready: true, Component: TeePairings },
  { id: 'grau-braun', title: 'Grau und Braun', level: 'Vertiefung', summary: 'Warum manche Kombinationen unentschieden wirken – und wie es klappt.', ready: true, Component: GreyBrown },
  { id: 'proportionen', title: 'Farbproportionen', level: 'Vertiefung', summary: 'Die 60-30-10-Regel als optionale Orientierung.', ready: true, Component: Proportions },
  { id: 'kontrast', title: 'Persönlicher Kontrast', level: 'Vertiefung', summary: 'Haut, Haare, Augen – und das passende Kontrastniveau im Outfit.', ready: true, Component: Contrast },
  { id: 'gesichtsnaehe', title: 'Farben in Gesichtsnähe', level: 'Vertiefung', summary: 'Warum das T-Shirt mehr zählt als die Hose.', ready: true, Component: FaceNear },
  { id: 'farbtypen', title: 'Saisonale Farbtypen', level: 'Vertiefung', summary: 'Das 12-Typen-System verständlich erklärt.', ready: true, Component: Seasons },
  { id: 'kleiderschrank', title: 'Aufbau eines vielseitigen Kleiderschranks', level: 'Vertiefung', summary: 'Basis, Akzente und sinnvolle Ergänzungen.', ready: false },
];

export function useModule(id: string | undefined) {
  return useMemo(() => MODULES.find((m) => m.id === id), [id]);
}

