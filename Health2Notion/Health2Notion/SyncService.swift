import Foundation
import SwiftUI

@MainActor
final class SyncService: ObservableObject {
    static let shared = SyncService()

    @Published var isSyncing = false
    @Published var log: [String] = []
    @Published var lastSync: Date? = Settings.lastSync

    /// Synchronisiert die letzten `days` Tage (inkl. heute) nach Notion.
    @discardableResult
    func sync(days: Int) async -> Bool {
        guard !isSyncing else { return false }
        guard Settings.isConfigured else {
            append("⚠️ Bitte zuerst Token und Datenbank eintragen.")
            return false
        }
        isSyncing = true
        defer { isSyncing = false }

        let client = NotionClient(token: Settings.token)
        let cal = Calendar.current
        var failed = false

        for offset in stride(from: days - 1, through: 0, by: -1) {
            let day = cal.date(byAdding: .day, value: -offset, to: Date())!
            let metrics = await HealthManager.shared.metrics(for: day)
            let label = day.formatted(.dateTime.day().month().year())
            do {
                try await client.upsert(databaseID: Settings.databaseID, metrics: metrics)
                append("✅ \(label)")
            } catch {
                append("❌ \(label): \(error.localizedDescription)")
                failed = true
            }
            // Notion erlaubt im Schnitt 3 Anfragen pro Sekunde.
            try? await Task.sleep(nanoseconds: 700_000_000)
        }
        if !failed {
            Settings.lastSync = Date()
            lastSync = Settings.lastSync
        }
        return !failed
    }

    func append(_ line: String) {
        log.insert(line, at: 0)
        if log.count > 100 { log.removeLast(log.count - 100) }
    }
}
