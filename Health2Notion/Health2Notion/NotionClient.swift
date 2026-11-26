import Foundation

enum NotionError: LocalizedError {
    case http(Int, String)
    case invalidResponse
    case invalidID

    var errorDescription: String? {
        switch self {
        case .http(let code, let msg): return "Notion-Fehler \(code): \(msg)"
        case .invalidResponse: return "Ungültige Antwort von Notion."
        case .invalidID: return "Die Notion-ID bzw. der Link ist ungültig."
        }
    }
}

struct NotionClient {
    let token: String
    private static let base = URL(string: "https://api.notion.com/v1")!
    private static let version = "2022-06-28"

    // MARK: - ID-Hilfe

    /// Akzeptiert eine reine ID oder einen kompletten Notion-Link und gibt die 32-stellige ID zurück.
    static func normalizeID(_ input: String) throws -> String {
        let withoutQuery = input.split(separator: "?").first.map(String.init) ?? input
        let hex = withoutQuery.replacingOccurrences(of: "-", with: "")
        guard hex.count >= 32 else { throw NotionError.invalidID }
        let id = String(hex.suffix(32))
        guard id.allSatisfy({ $0.isHexDigit }) else { throw NotionError.invalidID }
        return id
    }

    // MARK: - Datenbank anlegen

    /// Erstellt die Gesundheits-Datenbank mit allen Spalten unter einer bestehenden Seite.
    func createDatabase(parentPageID: String, title: String = "Health") async throws -> String {
        func number(_ format: String = "number") -> [String: Any] { ["number": ["format": format]] }
        let properties: [String: Any] = [
            "Name": ["title": [String: Any]()],
            "Datum": ["date": [String: Any]()],
            "Schritte": number(),
            "Aktive Energie (kcal)": number(),
            "Distanz (km)": number(),
            "Trainingsminuten": number(),
            "Ruhepuls": number(),
            "Ø Puls": number(),
            "Schlaf (h)": number(),
            "Gewicht (kg)": number(),
            "Workouts": number(),
            "Workout-Minuten": number(),
        ]
        let body: [String: Any] = [
            "parent": ["type": "page_id", "page_id": try Self.normalizeID(parentPageID)],
            "title": [["type": "text", "text": ["content": title]]],
            "properties": properties,
        ]
        let json = try await send("databases", method: "POST", body: body)
        guard let id = json["id"] as? String else { throw NotionError.invalidResponse }
        return id
    }

    // MARK: - Upsert eines Tages

    /// Legt den Tag an oder aktualisiert ihn, falls schon ein Eintrag mit diesem Datum existiert.
    func upsert(databaseID: String, metrics m: DailyMetrics) async throws {
        let dbID = try Self.normalizeID(databaseID)
        let dayString = Self.dayFormatter.string(from: m.day)
        let props = Self.properties(for: m, dayString: dayString)

        if let pageID = try await findPage(databaseID: dbID, dayString: dayString) {
            // Name bleibt unverändert, nur Messwerte aktualisieren.
            var update = props
            update.removeValue(forKey: "Name")
            _ = try await send("pages/\(pageID)", method: "PATCH", body: ["properties": update])
        } else {
            let body: [String: Any] = [
                "parent": ["database_id": dbID],
                "properties": props,
            ]
            _ = try await send("pages", method: "POST", body: body)
        }
    }

    private func findPage(databaseID: String, dayString: String) async throws -> String? {
        let body: [String: Any] = [
            "filter": ["property": "Datum", "date": ["equals": dayString]],
            "page_size": 1,
        ]
        let json = try await send("databases/\(databaseID)/query", method: "POST", body: body)
        let results = json["results"] as? [[String: Any]]
        return results?.first?["id"] as? String
    }

    private static func properties(for m: DailyMetrics, dayString: String) -> [String: Any] {
        var p: [String: Any] = [
            "Name": ["title": [["text": ["content": dayString]]]],
            "Datum": ["date": ["start": dayString]],
        ]
        func set(_ key: String, _ value: Double?) {
            guard let value else { return }
            p[key] = ["number": (value * 100).rounded() / 100]
        }
        set("Schritte", m.steps)
        set("Aktive Energie (kcal)", m.activeEnergyKcal)
        set("Distanz (km)", m.distanceKm)
        set("Trainingsminuten", m.exerciseMinutes)
        set("Ruhepuls", m.restingHeartRate)
        set("Ø Puls", m.avgHeartRate)
        set("Schlaf (h)", m.sleepHours)
        set("Gewicht (kg)", m.weightKg)
        set("Workouts", m.workoutCount.map(Double.init))
        set("Workout-Minuten", m.workoutMinutes)
        return p
    }

    private static let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = .current
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    // MARK: - HTTP

    private func send(_ path: String, method: String, body: [String: Any]?, retries: Int = 2) async throws -> [String: Any] {
        var req = URLRequest(url: Self.base.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue(Self.version, forHTTPHeaderField: "Notion-Version")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let body { req.httpBody = try JSONSerialization.data(withJSONObject: body) }

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw NotionError.invalidResponse }

        // Rate-Limit (≈3 Anfragen/s): kurz warten und erneut versuchen.
        if http.statusCode == 429, retries > 0 {
            let wait = Double(http.value(forHTTPHeaderField: "Retry-After") ?? "1") ?? 1
            try await Task.sleep(nanoseconds: UInt64(wait * 1_000_000_000))
            return try await send(path, method: method, body: body, retries: retries - 1)
        }
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
        guard (200..<300).contains(http.statusCode) else {
            throw NotionError.http(http.statusCode, json["message"] as? String ?? "Unbekannter Fehler")
        }
        return json
    }
}
