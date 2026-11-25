# ChromaWardrobe

**Personal Color Analysis & Wardrobe Studio** – eine eigenständige, lokal laufende Web-App für persönliche Farbberatung, digitalen Kleiderschrank, Outfitplanung und verständliche Farbtheorie.

ChromaWardrobe hilft dabei,

- den eigenen Farbtyp zu entdecken (12 saisonale Typen, ausführlich erklärt),
- den Kleiderschrank mit den **tatsächlichen Farben** zu erfassen (Farbfeld, Paletten, HEX, Foto- oder Kamera-Scanner),
- vorhandene Kleidungsstücke neu zu kombinieren (Outfit-Studio mit SVG-Figur und nachvollziehbaren Empfehlungen),
- Kaufideen virtuell auszuprobieren, bevor man kauft,
- Farbtheorie Schritt für Schritt zu verstehen (Farbakademie mit interaktiven Experimenten).

Die App richtet sich ausdrücklich auch an Menschen ohne Vorwissen. Saisonale Farbtypen werden als **ästhetisches Orientierungssystem** dargestellt, nicht als wissenschaftliche Diagnose.

> Status: **Phase 1 (MVP)** ist umgesetzt, Teile von Phase 2 und 3 ebenfalls. Was fehlt, ist in der App als „Noch nicht implementiert“ gekennzeichnet und in [ROADMAP.md](ROADMAP.md) beschrieben.

---

## Funktionsumfang (aktueller Stand)

| Bereich | Stand |
| --- | --- |
| Mehrere lokale Profile (anlegen, bearbeiten, duplizieren inkl. Kleiderschrank, löschen mit Rückgängig, wechseln) | ✅ |
| Vorausgefülltes Startprofil „Warmer Herbst“ (als Beispieldaten gekennzeichnet) + anonymes Demo-Profil | ✅ |
| 12 Farbtypen mit kuratierten Paletten (Grund-, Akzent-, Neutral-, Weiß-, Braun-, Blau-, Grün-, Rottöne, Metalle, weniger harmonische Farben), Beispieloutfits, Abgrenzung | ✅ |
| Farbtyp manuell wählen, ändern, Alternativen merken oder bewusst offenlassen | ✅ |
| Geführter Farbtyp-Fragebogen | ⏳ Phase 2 (Bewertungsmodell dokumentiert) |
| Kleiderschrank: ~60 Unterkategorien, eigene Silhouetten, Muster, mehrfarbige Teile mit Anteilen, Status (vorhanden/geplant/Wunsch/archiviert/aussortiert), Fotos, Links, Filter, Suche | ✅ |
| Geführter Erfassungs-Workflow mit Live-Vorschau und anschließenden Kombinationsvorschlägen | ✅ |
| Farbbestimmung: Farbfeld, Paletten, HEX, Foto-Scanner (Bereichsmessung, Zoom, dominante Farben, Graukarten-Weißabgleich) | ✅ |
| Kamera-Scanner (Rückkamera, Zielkreis, Live-Messung, Stream wird beim Verlassen beendet) | ✅ |
| Outfit-Studio: Schichten, Jacken offen/geschlossen, Muster, Hautton/Haar/Bart, A/B-Vergleich, Paletten, Farbcodes kopieren, PNG-Export, speichern/duplizieren/favorisieren, kuratierte Beispiele | ✅ |
| Mehrdimensionale Outfit-Analyse (Harmonie, Helligkeitskontrast, Temperatur, Sättigung, Farbtyp, Proportionen) – ohne „Schönheitsnote“ | ✅ |
| Outfit-Empfehlungen aus dem Bestand, umgekehrte Suche, Vielseitigkeit, Feedback „hilfreich/unpassend“ | ✅ (erste Version) |
| Wunschliste mit Farbtyp-Eignung, Partnern, möglichen Outfits, Dubletten-Hinweis und Vergleich | ✅ (erste Version) |
| Farbakademie: 14 interaktive Module (u. a. HEX, Farbkreis, warm/kühl, Helligkeit, Sättigung, Grau & Braun, Kontrast) | ✅ (1 Modul geplant) |
| Backup/Import (validiert), Profil-Export, Paletten-Export (JSON/CSS), Outfit-Export | ✅ |
| Light/Dark Mode, Tastaturbedienung, mobile Navigation | ✅ |
| PWA, Mehrsprachigkeit, Cloud-Sync | ⏳ Phase 4 |

## Voraussetzungen

- **Node.js ≥ 20.19** (empfohlen 22 LTS, siehe `.nvmrc`)
- npm (wird mit Node.js installiert)
- Ein aktueller Browser (Chrome, Edge, Firefox, Safari)

## Installation & Start

```bash
npm install        # installiert exakt die Versionen aus package-lock.json
npm run dev        # Entwicklungsserver: http://localhost:5173
```

Beim ersten Start wird automatisch das Startprofil „Warmer Herbst“ mit Beispiel-Kleiderschrank angelegt.

### Weitere Befehle

| Befehl | Zweck |
| --- | --- |
| `npm run build` | Typprüfung + Produktionsbuild nach `dist/` |
| `npm run preview` | Produktionsbuild lokal ansehen |
| `npm run test` | Unit-Tests (Vitest) |
| `npm run test:e2e` | End-to-End-Tests (Playwright, Desktop + Mobil) |
| `npm run typecheck` | Nur TypeScript prüfen |

Für die E2E-Tests einmalig den Browser installieren: `npx playwright install chromium`.

## Wie werden Daten gespeichert?

- Alle Daten (Profile, Kleidungsstücke, Outfits, Fotos, Feedback) liegen **ausschließlich lokal** im Browser in **IndexedDB** (Datenbank `chromawardrobe`).
- Es gibt **kein Tracking**, keine externen Dienste, keine KI-APIs. Kamera- und Fotodaten werden nur lokal ausgewertet.
- Daten bleiben nach einem Neustart erhalten – gehen aber verloren, wenn der Browserspeicher gelöscht wird. In den Einstellungen kann man den Browser um **dauerhafte Speicherung** bitten.
- Lokale Profile sind **keine abgesicherten Konten**: Wer Zugriff auf den Browser hat, sieht alle Profile.

## Backups

**Einstellungen → Backup & Wiederherstellung**

- „Alle Profile sichern“ erzeugt eine JSON-Datei inklusive Fotos.
- Einzelne Profile lassen sich im Profilbereich oder in den Einstellungen exportieren.
- Beim Import wird die Datei vollständig validiert (Schema, Farbcodes, Links, Bildformate, Verweise). Modi:
  - **Hinzufügen**: Profile werden mit neuen IDs ergänzt, nichts wird überschrieben.
  - **Alles ersetzen**: Wiederherstellung – alle lokalen Daten werden durch das Backup ersetzt.

Backups enthalten persönliche Daten. **Lege sie nicht ins Git-Repository** (die `.gitignore` schließt typische Backup-Dateinamen aus).

## Grenzen des Farbscanners

Ein Kamera- oder Fotoscan ist eine **Schätzung der wahrgenommenen Farbe**, keine farbmetrische Messung. Licht (warm/kalt), Schatten, Spiegelungen, Kamerasensor, automatischer Weißabgleich, Stoffstruktur sowie Über- und Unterbelichtung verändern das Ergebnis. Die App misst deshalb einen Bereich (getrimmter Mittelwert in linearem RGB), warnt bei Problemen und bietet einen Weißabgleich über eine neutrale Grau- oder Weißkarte. Der Kamerazugriff erfordert HTTPS oder `localhost`; der Foto-Upload funktioniert immer.

## Hosting

Der Build in `dist/` ist rein statisch und kann auf jedem statischen Hoster liegen (GitHub Pages, Netlify, Cloudflare Pages …). Dank Hash-Routing und `base: './'` ist keine Server-Konfiguration nötig. Für den Kamerazugriff muss die Seite per HTTPS ausgeliefert werden.

## Projektstruktur

```
src/
  app/            App-Shell, Navigation, Profil-Kontext, Theme
  components/     UI-Bausteine, Farbauswahl, Kleidungskarten, Formulare
  data/           IndexedDB (Dexie), Repository-Schnittstellen, Backup, Seed-Daten
  domain/         Reine Logik ohne UI:
    color/          Farbräume, Delta E, Farbnamen, Farbeigenschaften
    seasons/        12 Farbtypen (datengetrieben) + Eignungsmodell
    garments/       Kategorien, Unterkategorien, Outfit-Slots
    recommendation/ Kombinierbarkeit, Outfit-Vorschläge, Outfit-Analyse
    image/          Farbmessung aus Bildern, Weißabgleich, k-Means
    examples/       Kuratierte Farbbeispiele
    profile/        Fabriken, Erscheinungs-Presets
  illustrations/  Parametrische SVG-Silhouetten und Figur
  i18n/           Übersetzungen (Deutsch)
  pages/          Seiten (lazy geladen)
e2e/              Playwright-Tests
docs/             Architektur, Datenmodell, Farbtheorie, Fragebogen-Modell, Lizenzentscheidung
```

## Weiterentwicklung

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) – Architektur und technische Entscheidungen
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) – Datenmodelle, Migrationen, Backup-Format
- [docs/COLOR_THEORY.md](docs/COLOR_THEORY.md) – Farbräume, Heuristiken und Empfehlungslogik
- [docs/QUESTIONNAIRE_MODEL.md](docs/QUESTIONNAIRE_MODEL.md) – Bewertungsmodell des geplanten Fragebogens
- [ROADMAP.md](ROADMAP.md) · [CHANGELOG.md](CHANGELOG.md)

Neue Farbtyp-Systeme, Kleidungsarten, Sprachen oder ein Backend lassen sich über die jeweiligen Registries bzw. Schnittstellen ergänzen – Details in der Architektur-Dokumentation.

## Lizenz

Noch nicht festgelegt – siehe [docs/LICENSE_DECISION.md](docs/LICENSE_DECISION.md). Bis zur Entscheidung gilt: alle Rechte vorbehalten.
