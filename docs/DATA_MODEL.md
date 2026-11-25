# Datenmodell

Alle Typen sind in [`src/domain/types.ts`](../src/domain/types.ts) definiert. Hier die Übersicht und die wichtigsten Regeln.

## Entitäten (persistiert)

| Tabelle | Typ | Schlüssel / Indizes | Inhalt |
| --- | --- | --- | --- |
| `profiles` | `UserProfile` | `id`, `name`, `updatedAt` | Erscheinungsbild, Farbtyp, Vorlieben, eigene Farben und Kategorien, Analyseergebnisse |
| `garments` | `Garment` | `id`, `profileId`, `[profileId+ownership]`, `category`, `subcategory` | Kleidungsstücke inkl. geplanter Käufe und Wünsche |
| `outfits` | `Outfit` | `id`, `profileId` | Gespeicherte Outfits und Farbexperimente |
| `images` | `StoredImage` | `id`, `profileId` | Fotos als Blob (Profilbild, Produktfoto, Scan) |
| `feedback` | `RecommendationFeedback` | `id`, `profileId`, `[profileId+targetKey]` | „hilfreich“/„unpassend“ je Kombination |
| `settings` | `SettingEntry` | `key` | z. B. aktives Profil, letztes Backup |

## Trennung: vorhanden – geplant – Inspiration

| Art | Modell |
| --- | --- |
| Vorhandene Kleidung | `Garment.ownership = 'owned'` |
| Geplante Anschaffung | `Garment.ownership = 'planned'` (+ `purchaseStatus`, `wishlist`) |
| Kaufoption / Wunsch | `Garment.ownership = 'wishlist'` (`WishlistItem`) |
| Archiviert / aussortiert | `'archived'` / `'sold'` |
| Reine Inspirationsfarbe | `UserProfile.customSwatches[]` mit `kind = 'inspiration'` – **kein** Kleidungsstück |
| Hosenfarbe zum Experimentieren | `customSwatches[]` mit `kind = 'trial-bottom'` |
| Vorgeschlagene Ergänzung | `customSwatches[]` mit `kind = 'neutral-suggestion'` |

## Kleidungsstück (`Garment`)

- `colors[0]` ist die Hauptfarbe; weitere Einträge sind Sekundär-/Akzentfarben mit geschätztem Flächenanteil `share` (Summe = 1).
- `name` je Farbe = benutzerdefinierter Farbname (optional; sonst automatisch).
- `pattern.type`: `solid | check | stripes | melange | houndstooth | herringbone | camouflage | colorblock | print | custom`.
- `attributes`: unterkategorienabhängige Eigenschaften (z. B. `hood`, `length`, `closure`, `sleeve`), definiert im Katalog.
- `colorIsApproximation`: Farbwert ist eine Schätzung (z. B. Startprofil). `sample`: Beispieldaten.

## Outfit

- `slots`: `base | shirt | knit | overshirt | outer | onepiece | bottom | shoes | scarf | headwear | accessory`.
- Ein Slot verweist optional auf `garmentId`; ohne Verweis ist er ein freies Farbexperiment. Gespeichert wird zusätzlich eine Momentaufnahme (Farben/Muster), damit Outfits auch nach dem Löschen eines Teils darstellbar bleiben. Verknüpfte Teile werden beim Anzeigen mit ihren aktuellen Daten aktualisiert.
- `kind`: `'wardrobe'`, wenn alle sichtbaren Slots aus dem Bestand stammen, sonst `'experiment'`.

## IDs & Zeitstempel

UUID v4 mit Präfix (`prof_`, `gar_`, `out_`, `img_`, `fb_`, `sw_`), ISO-8601-Zeitstempel (`createdAt`, `updatedAt`).

## Schema-Versionierung & Migrationen

- IndexedDB: `src/data/db.ts`, `this.version(n).stores(...).upgrade(...)`.
- Backups: `schemaVersion` (aktuell `1`). `validateBackup()` lehnt neuere Versionen ab und ruft `migrateBackup()` für ältere auf.

## Backup-Format

```jsonc
{
  "format": "chromawardrobe-backup",
  "schemaVersion": 1,
  "exportedAt": "2026-11-25T12:00:00.000Z",
  "scope": "full" | "profile",
  "app": { "name": "ChromaWardrobe", "version": "0.1.0" },
  "profiles": [ /* UserProfile */ ],
  "garments": [ /* Garment */ ],
  "outfits":  [ /* Outfit */ ],
  "feedback": [ /* RecommendationFeedback */ ],
  "images":   [ { "id", "profileId", "kind", "mimeType", "dataUrl", "createdAt" } ]
}
```

Validierung: Typen, Aufzählungen, Längen- und Mengenlimits, HEX-Format, nur `http(s)`-Links, nur Rasterbild-Data-URLs, referenzielle Integrität (Kleidungsstücke/Outfits müssen auf importierte Profile verweisen).

## Weitere Typen

`ColorSeason`, `ColorTypeSystem`, `ColorPalette`, `ColorSwatch`, `GarmentCategory`, `GarmentSubcategory`, `GarmentPattern`, `OutfitRecommendation`, `ColorAnalysisResult`, `QuestionnaireAnswer`, `ScanResult` – siehe `types.ts`. `ColorAnalysisResult` und `QuestionnaireAnswer` sind für den Fragebogen (Phase 2) bereits vorbereitet.
