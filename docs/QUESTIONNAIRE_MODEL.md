# Bewertungsmodell des Farbtyp-Fragebogens

> **Status: geplant für Phase 2 – noch nicht implementiert.** Die Datentypen (`QuestionnaireAnswer`, `ColorAnalysisResult`, `SeasonCandidate`) existieren bereits. Dieses Dokument legt das Modell vorab fest, damit die Umsetzung transparent und überprüfbar bleibt.

## Grundsätze

1. **Kein einzelnes Merkmal bestimmt den Typ.** Haarfarbe, Adern oder Schmuckvorliebe sind schwache Indizien.
2. **Mehrere Indikatoren, drei Achsen.** Jede Antwort liefert Evidenz für Temperatur (T), Helligkeit (V), Sättigung/Klarheit (C) und Kontrast (K) – jeweils auf einer Skala von −2 bis +2 – sowie ein Gewicht für ihre Aussagekraft.
3. **„Ich bin mir nicht sicher“ ist eine gültige Antwort** und erhöht die Unsicherheit statt einen Default zu setzen.
4. **Vielfalt berücksichtigen:** Hautfarbe wird nicht mit Temperatur gleichgesetzt; gefärbte Haare zählen nicht, wenn die natürliche Haarfarbe angegeben ist; Fragen sind so formuliert, dass sie für alle Hauttöne funktionieren.
5. **Keine erfundenen Prozentwerte.** Ausgegeben werden Rangfolge, Begründung und eine qualitative Unsicherheit.

## Schritte und Evidenz

| Schritt | Frage (Kurzform) | Hauptachse | Gewicht |
| --- | --- | --- | --- |
| 2 | Natürliche Haarfarbe | V, K (schwach T) | 0,6 |
| 3 | Augenfarbe & Klarheit der Iris | C, K | 0,6 |
| 4 | Hautton & Unterton | V (Hautton), T (Unterton) | 0,8 |
| 5 | Warme vs. kühle Farben am Gesicht | T | **1,5** |
| 6 | Gold vs. Silber | T | 0,7 |
| 7 | Reinweiß vs. Cremeweiß vs. Ecru | T, C | 1,0 |
| 8 | Kräftige vs. gedeckte Farben | C | **1,5** |
| 9 | Helle vs. dunkle Farben | V | **1,2** |
| 10 | Persönlicher Kontrast | K | 1,0 |
| 11 | Optionaler Foto-Vergleich (Drape-Simulation) | T, C, V | 1,0 |

Vergleiche am eigenen Gesicht (Schritte 5, 8, 9, 11) werden höher gewichtet als Merkmalsabfragen, weil sie die tatsächliche Wirkung abbilden.

## Auswertung

1. Für jede Achse: gewichteter Mittelwert der Evidenz `ē` und Summe der Gewichte `w` (Informationsmenge).
2. Jeder der 12 Typen hat ein Profil (T, V, C, K) in `domain/seasons` (`temperature`, `value`, `chroma`, `contrast`).
3. Distanz je Typ: `d = Σ_achsen w_a · (ē_a − typ_a)²`, wobei die **Hauptachse des Typs** doppelt zählt (z. B. Klarheit beim Klaren Winter).
4. Rangfolge nach `d`. Ergebnis: wahrscheinlichster Typ, 1–2 Alternativen (wenn `d` innerhalb von 25 % des Besten liegt).
5. **Unsicherheit**: hoch, wenn eine Hauptachse < 1,0 Gewicht hat oder viele „unsicher“-Antworten vorliegen; mittel, wenn Alternativen sehr nah liegen; sonst niedrig.
6. **Begründung**: Die drei Antworten mit dem größten Beitrag zur Entscheidung werden in Sätzen erklärt („Du hast Cremeweiß am Gesicht vorgezogen – das spricht für eine warme Tendenz.“).

## Ergebnisseite (geplant)

Wahrscheinlichster Typ, Alternativen, Begründung, Unsicherheit, wichtigste persönliche Merkmale, geeignete und weniger geeignete Farben, Kombinationsvorschläge – und immer die Möglichkeit, das Ergebnis manuell zu korrigieren oder offenzulassen.
