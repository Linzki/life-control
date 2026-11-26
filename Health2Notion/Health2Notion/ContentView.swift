import SwiftUI

struct ContentView: View {
    @StateObject private var sync = SyncService.shared

    @State private var token = Settings.token
    @State private var databaseID = Settings.databaseID
    @State private var parentPage = ""
    @State private var days = 7
    @State private var message: String?
    @State private var busy = false

    var body: some View {
        NavigationStack {
            Form {
                Section("1 · Notion verbinden") {
                    SecureField("Integration-Token (secret_… / ntn_…)", text: $token)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    TextField("Datenbank-ID oder Link", text: $databaseID)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Button("Speichern") { save() }
                }

                Section {
                    TextField("Link/ID einer Notion-Seite", text: $parentPage)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Button("Datenbank automatisch erstellen") { Task { await createDatabase() } }
                        .disabled(busy || token.isEmpty || parentPage.isEmpty)
                } header: {
                    Text("Oder: neue Datenbank anlegen")
                } footer: {
                    Text("Die Seite muss vorher für deine Integration freigegeben sein (··· → Verbindungen).")
                }

                Section("2 · Apple Health") {
                    Button("Zugriff auf Health erlauben") { Task { await requestHealth() } }
                }

                Section("3 · Synchronisieren") {
                    Picker("Zeitraum", selection: $days) {
                        Text("Heute + gestern").tag(2)
                        Text("7 Tage").tag(7)
                        Text("30 Tage").tag(30)
                        Text("90 Tage").tag(90)
                    }
                    Button {
                        save()
                        Task { await sync.sync(days: days) }
                    } label: {
                        HStack {
                            Text("Jetzt synchronisieren")
                            if sync.isSyncing { Spacer(); ProgressView() }
                        }
                    }
                    .disabled(sync.isSyncing)
                    if let last = sync.lastSync {
                        Text("Zuletzt: \(last.formatted(date: .abbreviated, time: .shortened))")
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                }

                if let message {
                    Section { Text(message).font(.footnote) }
                }

                if !sync.log.isEmpty {
                    Section("Protokoll") {
                        ForEach(sync.log, id: \.self) { Text($0).font(.footnote) }
                    }
                }
            }
            .navigationTitle("Health 2 Notion")
        }
    }

    private func save() {
        Settings.token = token.trimmingCharacters(in: .whitespacesAndNewlines)
        if let id = try? NotionClient.normalizeID(databaseID) { databaseID = id }
        Settings.databaseID = databaseID
        message = "Gespeichert."
    }

    private func requestHealth() async {
        do {
            try await HealthManager.shared.requestAuthorization()
            message = "Health-Zugriff angefragt. Du kannst ihn jederzeit in Einstellungen → Health → Datenzugriff ändern."
        } catch {
            message = error.localizedDescription
        }
    }

    private func createDatabase() async {
        busy = true
        defer { busy = false }
        do {
            let id = try await NotionClient(token: token.trimmingCharacters(in: .whitespacesAndNewlines))
                .createDatabase(parentPageID: parentPage)
            databaseID = id
            save()
            message = "Datenbank erstellt und gespeichert."
        } catch {
            message = error.localizedDescription
        }
    }
}
