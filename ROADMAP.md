# Roadmap

Jede Phase ergibt eine benutzbare, getestete Anwendung. ✅ erledigt · 🟡 teilweise · ⏳ offen

## Phase 1 – Funktionierender MVP ✅

- ✅ Projektsetup (Vite, React, TypeScript, Tailwind, Vitest, Playwright, CI)
- ✅ Responsive Oberfläche mit Desktop- und Mobil-Navigation, Light/Dark Mode
- ✅ Lokale Datenbank (IndexedDB) mit Schema-Versionierung
- ✅ Mehrere Benutzerprofile (anlegen, bearbeiten, duplizieren, löschen, wechseln)
- ✅ Vorausgefülltes Startprofil „Warmer Herbst“ + anonymes Demo-Profil
- ✅ 12 Farbtypen mit Paletten und Erklärungen
- ✅ Manueller Farbpicker, Paletten, HEX-Eingabe
- ✅ Kleiderschrankverwaltung mit geführtem Workflow
- ✅ Unterschiedliche SVG-Silhouetten (~60 Kleidungsarten)
- ✅ Outfit-Studio mit Schichten, Mustern, Vergleich, Export
- ✅ Kuratierte Farbbeispiele
- ✅ Backup, Import, Wiederherstellung

## Phase 2 – Farbtyp-Assistent und Scanner 🟡

- ⏳ Geführter Fragebogen (12 Schritte, visuelle Vergleiche, „unsicher“-Option) – Modell in `docs/QUESTIONNAIRE_MODEL.md`
- ⏳ Transparente Farbtyp-Bewertung mit Unsicherheit und Begründung
- ✅ Kamera-Farbscanner (Live-Zielkreis, Rückkamera, Stream-Beendigung)
- ✅ Foto-Farbscanner (Bereichsmessung, Zoom, Antippen)
- ✅ Mehrfarbige Kleidungsstücke mit Anteilen
- ✅ Farbquantisierung (dominante Farben, k-Means in OKLab)
- ✅ Referenzkalibrierung per Grau-/Weißkarte
- ⏳ Gesichtsfoto-Vergleich (Schritt 11 des Fragebogens)

## Phase 3 – Intelligente Beratung 🟡

- ✅ Automatische Outfit-Empfehlungen aus dem Bestand (erste Version)
- ✅ Erklärende Bewertungslogik (Harmonie, Kontrast, Temperatur, Sättigung, Farbtyp, Proportionen)
- ✅ Persönliche Präferenzen und Feedback (hilfreich/unpassend)
- 🟡 Kleiderschrankanalyse: Farbverteilung (hell/dunkel, neutral/farbig, warm/kühl) und Vielseitigkeit; ⏳ fehlende Neutrale, Überschneidungen, Verteilung je Kategorie, Tragehäufigkeit
- 🟡 Kaufberatung: Eignung, Partner, mögliche Outfits, Dubletten, Vergleich; ⏳ „zusätzliche Kombinationen durch Neuanschaffung“ als Differenz
- ✅ Outfit-Vergleiche (A/B im Studio)
- 🟡 Farbakademie: 14 Module; ⏳ „Aufbau eines vielseitigen Kleiderschranks“, mehr Quizfragen
- ⏳ Anlass-Filter (Alltag, elegant, sportlich, Business Casual …) für Vorschläge
- ⏳ Mehrere Accessoires gleichzeitig im Studio

## Phase 4 – Produktreife ⏳

- ⏳ Progressive Web App (Manifest, Service Worker, Offline-Cache)
- ⏳ Erweiterte Barrierefreiheit (Audit mit Screenreadern, axe in E2E)
- ⏳ Mehrsprachigkeit (Englisch zuerst; Struktur in `src/i18n` vorhanden)
- ⏳ Performance (Virtualisierung großer Kleiderschränke, Bildgrößen)
- ⏳ Optionales Cloud-Backend (Supabase/PostgreSQL) über das `DataStore`-Interface
- ⏳ Authentifizierung und Synchronisierung
- ⏳ Deployment (z. B. GitHub Pages / Cloudflare Pages) und öffentliche Version
- ⏳ Lizenzentscheidung (siehe `docs/LICENSE_DECISION.md`)
