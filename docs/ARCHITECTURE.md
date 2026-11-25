# Architektur

## Überblick

ChromaWardrobe ist eine **Local-first Single-Page-App**. Es gibt keinen Server: Der Produktionsbuild ist statisch, alle Daten liegen in IndexedDB im Browser.

```
┌──────────────────────── UI (React) ─────────────────────────┐
│ pages/*  ←  components/*  ←  illustrations/* (SVG)           │
│        ↑ useAppData() (aktives Profil, Katalog, Farbtyp)     │
├──────────────────────── Daten ──────────────────────────────┤
│ data/hooks (useLiveQuery)  →  DataStore-Interfaces           │
│ data/repositories/dexieStore.ts  →  IndexedDB (Dexie)        │
│ data/backup (zod-Validierung, Export/Import)                 │
├──────────────────────── Domäne (reines TS) ─────────────────┤
│ color · seasons · garments · recommendation · image · profile│
└──────────────────────────────────────────────────────────────┘
```

Die **Domänenschicht** hat keine Abhängigkeit zu React oder IndexedDB und ist vollständig unit-getestet. UI-Komponenten rufen Domänenfunktionen auf; persistiert wird ausschließlich über die Repository-Schnittstellen.

## Technische Entscheidungen

| Entscheidung | Begründung | Alternativen |
| --- | --- | --- |
| **React 19 + TypeScript (strict)** | Verbreitet, großes Ökosystem, gute Typisierung der Datenmodelle | Svelte, Vue |
| **Vite 8** | Schneller Dev-Server, einfacher statischer Build | – |
| **Tailwind CSS 4** | Design-Tokens per CSS-Variablen (Light/Dark), kein Laufzeit-Overhead | CSS Modules |
| **Eigene kleine UI-Bausteine statt Komponentenbibliothek** | Wenige, gezielt barrierearme Komponenten (`<dialog>`, Radiogruppen, Toggles) genügen; vermeidet schwere Abhängigkeiten und Stilkonflikte. Eine Bibliothek wie Radix UI kann später ergänzt werden. | Radix UI, shadcn/ui, MUI |
| **lucide-react** | Konsistente, leichte Icons | – |
| **Dexie 4 (IndexedDB)** | Versionierte Schemata mit Migrationen, Indizes, reaktive Abfragen (`useLiveQuery`) auch tabübergreifend | idb, localStorage (zu klein für Fotos) |
| **zod 4** | Strikte Validierung importierter Backups (Typen, Längen, Formate, Links) | Handgeschriebene Validierung |
| **React Router 7 mit HashRouter** | Funktioniert auf jedem statischen Hoster ohne Rewrite-Regeln | BrowserRouter (braucht Server-Konfiguration) |
| **Eigene Farbbibliothek** (`domain/color`) | Volle Kontrolle und Testbarkeit für OKLab/OKLCH, CIELAB, CIEDE2000, Gamut-Mapping; kein externes Paket nötig | culori, chroma-js |
| **SVG-Illustrationen per Code** | Farben, Muster und Schichten dynamisch; eine Zeichnung dient als Figur-Layer und als Vorschaubild | Bitmaps (nicht umfärbbar) |
| **Vitest + Testing Library + fake-indexeddb** | Schnelle Unit-Tests inkl. Datenbank | Jest |
| **Playwright (Desktop + Pixel 7)** | E2E inklusive simulierter Kamera und Mobilansicht | Cypress |
| **Code-Splitting je Seite** | Kleiner Initial-Bundle | – |

## Datenschicht

- `src/data/db.ts`: Dexie-Schema mit Versionsnummer. **Jede Schemaänderung = neue `version(n)` mit optionaler `upgrade()`-Migration.** Alte Versionen werden nie entfernt.
- `src/data/repositories/types.ts`: `DataStore` mit `profiles`, `garments`, `outfits`, `images`, `feedback`, `settings`. Die App kennt nur diese Interfaces.
- `src/data/repositories/dexieStore.ts`: IndexedDB-Implementierung. Das Löschen eines Profils löscht in einer Transaktion alle zugehörigen Daten.
- `src/data/hooks.ts`: Reaktive Hooks auf Basis von `useLiveQuery`.

### Späteres Backend (z. B. Supabase/PostgreSQL)

1. Eine zweite Implementierung von `DataStore` schreiben (z. B. `supabaseStore.ts`); Tabellen entsprechen den Typen in `src/domain/types.ts` (IDs sind bereits UUID-basiert, Zeitstempel ISO-8601).
2. Reaktivität: Statt `useLiveQuery` Realtime-Subscriptions oder Query-Invalidierung (z. B. TanStack Query) in `data/hooks.ts` kapseln.
3. **Lokale Profile ≠ Benutzerkonten:** Ein Konto (Auth) besitzt künftig mehrere Profile. Dafür wird ein `ownerId` ergänzt; lokale Daten können per Backup-Import in ein Konto übernommen werden.
4. Synchronisierung: `updatedAt` je Datensatz ist vorhanden (Last-Write-Wins als einfacher Start).

## Zustandsverwaltung

- Persistenter Zustand: ausschließlich IndexedDB (Single Source of Truth).
- `AppDataProvider` lädt aktives Profil, dessen Kleiderschrank, Outfits, Feedback sowie den Katalog (inkl. eigener Kategorien) und stellt `updateProfile()` bereit.
- Flüchtiger UI-Zustand (z. B. Outfit-Entwurf im Studio) liegt in Komponenten-State; gespeichert wird explizit.
- Theme-Wahl in `localStorage` (wird vor dem ersten Rendern angewendet).

## Erweiterbarkeit

| Erweiterung | Ort |
| --- | --- |
| Neues Farbtyp-System (z. B. 16 Typen) | Neues `ColorTypeSystem` in `domain/seasons`, in `COLOR_SYSTEMS` registrieren |
| Neue Kleidungsart | Eintrag in `domain/garments/catalog.ts` + Renderer in `illustrations/garments.tsx` |
| Neues Muster | `PatternType` + `PatternDef` in `illustrations/patterns.tsx` |
| Neue Sprache | `src/i18n/<lang>.ts` mit dem `Messages`-Interface; Lerninhalte analog |
| Neue Empfehlungsregel | `domain/recommendation/pairing.ts` (jede Regel liefert Punkte **und** Begründung) |

## Barrierefreiheit

- Farben sind nie die einzige Information: Farbfelder zeigen Name und HEX-Code, Analysen nutzen Text und Symbole.
- Native `<dialog>`-Modals (Fokusfalle, Escape), Radiogruppen mit `aria-checked`, Toggles als Checkbox, Sprunglink zum Inhalt.
- Farbfeld-Picker per Pfeiltasten bedienbar.
- Neutrale Oberflächenfarben in Light und Dark Mode, damit Kleidungsfarben nicht verfälscht wirken.

## Sicherheit & Datenschutz

- Keine externen Requests zur Laufzeit (Schriftarten sind Systemschriften).
- Importierte Daten werden mit zod validiert; Produktlinks nur `http(s)`; Bilder nur als `data:image/(png|jpeg|webp|gif)`.
- React escaped alle Texte; es wird kein HTML aus Daten gerendert.
- Kamerastreams werden beim Verlassen des Scanners beendet.
