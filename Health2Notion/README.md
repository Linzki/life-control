# Health 2 Notion

iOS-App (SwiftUI + HealthKit), die Apple-Health-Daten pro Tag in eine Notion-Datenbank schreibt.

**Daten:** Schritte, aktive Energie, Distanz, Trainingsminuten, Ruhepuls, Ø Puls, Schlaf, Gewicht, Workouts (Anzahl und Minuten).

Pro Tag gibt es genau eine Zeile. Bestehende Tage werden aktualisiert, nicht dupliziert.
Fehlende Werte überschreiben nichts.

## Einrichten

Voraussetzung: Mac mit Xcode 15+, ein echtes iPhone (HealthKit läuft nicht im Simulator mit echten Daten).

```bash
brew install xcodegen
cd Health2Notion
xcodegen generate
open Health2Notion.xcodeproj
```

In Xcode unter *Signing & Capabilities* dein Team wählen und die Bundle-ID bei Bedarf ändern
(`project.yml` und `Health2NotionApp.refreshTaskID` müssen zusammenpassen). Dann auf das iPhone starten.

## Notion vorbereiten

1. Auf notion.so/my-integrations eine **interne Integration** anlegen und das Token kopieren.
2. Eine Notion-Seite öffnen → `···` → *Verbindungen* → deine Integration hinzufügen.
3. In der App: Token eintragen und entweder Datenbank-Link einfügen oder den Seiten-Link eintragen
   und **„Datenbank automatisch erstellen"** tippen. Das legt alle Spalten korrekt an.
4. **Health-Zugriff erlauben**, dann **Jetzt synchronisieren**.

## Automatik

Die App synchronisiert heute und gestern im Hintergrund. Auslöser sind neue Schritte (stündlich)
und ein Hintergrund-Refresh alle paar Stunden. iOS entscheidet über den genauen Zeitpunkt.

## Hinweise

- Das Token liegt im Keychain.
- Schlaf zählt die Nacht, die am jeweiligen Tag endet. Überlappende Quellen werden zusammengeführt.
- Spaltennamen sind deutsch. Wenn du sie in Notion umbenennst, musst du sie in `NotionClient.swift` anpassen.
