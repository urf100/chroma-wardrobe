# Farbtheorie & Empfehlungslogik

Dieses Dokument beschreibt, **wie** ChromaWardrobe Farben analysiert und Empfehlungen begründet. Alle Schwellenwerte sind dokumentierte Heuristiken – keine Normen und keine „objektive Schönheit“.

## Farbräume

| Raum | Verwendung |
| --- | --- |
| HEX / sRGB | Anzeige, Eingabe, Speicherung |
| HSL / HSV | Verständliche Regler (Farbfeld-Picker) |
| **OKLab / OKLCH** | Wahrnehmungsorientierte Analyse: Helligkeit `L`, Buntheit `C`, Farbton `h`; Mischen; Regler der Farbakademie (mit Gamut-Mapping über Chroma-Reduktion) |
| CIELAB (D65) + **CIEDE2000** | Farbähnlichkeit (Paletten-Nähe, Farbnamen, Dubletten auf der Wunschliste) |
| Lineares RGB | Mitteln von Pixeln beim Scannen, Weißabgleich |

## Farbeigenschaften (`domain/color/analysis.ts`)

- **Helligkeit** aus OKLCH-`L`: sehr dunkel < 0,33 ≤ dunkel < 0,48 ≤ mittel < 0,68 ≤ hell < 0,86 ≤ sehr hell.
- **Sättigung** aus `C`: unbunt < 0,025 ≤ gedeckt < 0,07 ≤ mittel < 0,12 ≤ klar < 0,18 ≤ leuchtend.
- **Temperatur**: Projektion von (a, b) auf eine Warm-Achse (Farbton 65°, Orange-Gelb), normiert auf ±1. So sind fast neutrale Farben nahe 0 – ein gelbliches Grau bleibt dennoch „leicht warm“, ein bläuliches „leicht kühl“. Diese Feinheit ist für den Grau-Braun-Fall entscheidend.
- **Mode-Neutralität**: unbunt (C < 0,03), warm-neutral (Braun/Beige/Camel: Farbton 30–60° mit C < 0,075 bzw. 60–105° mit C < 0,11), kühl-neutral (Marine/Anthrazit-Blau: 220–280°, L < 0,42, C < 0,10).

## Farbnamen (`naming.ts`)

1. Nächster bekannter Modefarbname (≈ 120 Einträge) per CIEDE2000 < 7.
2. Sonst Beschreibung aus Helligkeit, Sättigung und Farbfamilie, z. B. „Dunkles, gedecktes Grün“. Die Beschreibung wird zusätzlich angezeigt.

## Eignung für einen Farbtyp (`seasons/fit.ts`)

1. **Nähe zur kuratierten Palette** (ΔE00 < 6) → „In der Palette“.
2. Nähe zu „weniger harmonischen“ Farben (ΔE00 < 6) → „Eher außerhalb“.
3. Sonst Abgleich mit der Charakteristik (Temperatur, Sättigung, Helligkeit). 0 Abweichungen → „Passt zur Charakteristik“, 1 → „Mit Bedacht“, ≥ 2 → „Eher außerhalb“.

Gesichtsnahe Teile (Oberteile, Jacken, Schal, Kopfbedeckung) werden stärker berücksichtigt als Hose und Schuhe.

## Kombinierbarkeit zweier Farben (`recommendation/pairing.ts`)

Jede Regel liefert **Punkte und einen Satz in natürlicher Sprache**. Punkte dienen nur zur Sortierung; angezeigt werden die Stufen *Sehr gut kombinierbar / Gut kombinierbar / Möglich / Mit Bedacht* und die Begründungen.

| Regel | Wirkung |
| --- | --- |
| Zwei Neutralfarben | + (leicht kombinierbar) |
| **Kühles Grau + warmes Braun bei ähnlicher Helligkeit** (ΔL < 0,18) | −− Temperaturkonflikt ohne Trennung |
| Grau + Braun mit großem Helligkeitsabstand | + Kontrast trennt |
| Neutral + Farbe | + Neutralfarbe als Basis |
| Gleicher Farbton, unterschiedliche Helligkeit | + Ton-in-Ton |
| Fast gleich, aber nicht ganz (ΔE 3–12, ΔL < 0,06) | − wirkt unbeabsichtigt |
| Farbtonabstand < 70° | + analog |
| ≥ 150°, beide gedeckt | + gedeckter Komplementärkontrast |
| Zwei kräftige Farben ohne Farbkreis-Beziehung | − konkurrieren |
| Beide sehr leuchtend | − |
| Deutlicher Sättigungsunterschied | + Sättigungskontrast |
| Warm/kalt bei ähnlicher Helligkeit | − / bei Helligkeitsabstand + |
| Helligkeitsabstand ≥ 0,25 | + klarer Helligkeitskontrast |
| Kaum Helligkeitsunterschied | − verschwimmt |
| Entspricht einem kuratierten Beispiel | + |
| Farbtyp-Eignung (nur gesichtsnah) | ± |
| **Persönliche Vorlieben** (Lieblings-/Abneigungsfarben) | ± stark |
| **Feedback** hilfreich/unpassend | +2 / −4 (Vorrang vor Theorie) |

Mathematisch ähnliche Farben sind nicht automatisch harmonisch – deshalb gibt es neben Abständen eigene Regeln für Neutrale, Temperatur, Sättigung und Proportionen.

## Outfit-Analyse (`recommendation/outfitAnalysis.ts`)

Keine Gesamtnote, sondern sechs Dimensionen mit Text:

1. **Farbharmonie** – erkannt werden Monochrom, Ton-in-Ton, analog, komplementär, split-komplementär, triadisch, tetradisch, neutrale Basis mit Akzent, Helligkeits-, Sättigungs- und Warm-Kalt-Kontrast oder „freie Kombination“.
2. **Helligkeitskontrast** – Spannweite der Helligkeit, abgeglichen mit dem persönlichen Kontrast aus dem Profil.
3. **Farbtemperatur** – einheitlich warm/kühl oder Mischung; Warnung bei Konflikt ähnlicher Helligkeit.
4. **Sättigung** – gedeckt, ein Akzent oder mehrere kräftige Farben.
5. **Eignung für den Farbtyp** – für die drei größten gesichtsnahen Flächen.
6. **Proportionen** – sichtbare Flächenanteile (Schichtung berücksichtigt: geschlossene Jacken verdecken Unterschichten); 60-30-10 nur als Orientierung.

## Outfit-Vorschläge (`garmentMatching.ts`)

Für ein Ankerteil werden je Rolle (Oberteil, Unterteil, Jacke, Schuhe, Schal) die besten Kandidaten gewählt, alle Kombinationen paarweise bewertet (Schuhe/Schal halb gewichtet) und nach Durchschnitt plus leichter Vollständigkeitsprämie sortiert. Teile im selben Slot (zwei T-Shirts) werden nie kombiniert. Geplante/gewünschte Teile werden nur auf Wunsch einbezogen und gekennzeichnet.

## Farbmessung aus Bildern (`domain/image/sampling.ts`)

- Kreisförmiger Messbereich statt Einzelpixel.
- Sortierung nach Luminanz; die hellsten 15 % (Glanzlichter) und dunkelsten 10 % (Schatten) werden verworfen.
- Mittelung in linearem RGB.
- Warnungen bei > 25 % übersteuerten bzw. sehr dunklen Pixeln und bei starken Helligkeitsunterschieden.
- Weißabgleich: Faktoren pro Kanal so, dass die Referenz (Grau-/Weißkarte) neutral wird.
- Dominante Farben: k-Means in OKLab mit deterministischer Initialisierung.

## Kuratierte Beispiele

`domain/examples/curated.ts` enthält die Kombinationen aus der Produktbeschreibung (T-Shirt-Partner, Harmonien, Grau-Braun-Vergleich). Sie sind Ausgangspunkte, keine universellen Regeln.
