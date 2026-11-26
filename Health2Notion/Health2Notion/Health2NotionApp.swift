import SwiftUI
import BackgroundTasks

@main
struct Health2NotionApp: App {
    static let refreshTaskID = "com.example.health2notion.refresh"
    @Environment(\.scenePhase) private var scenePhase

    init() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: Self.refreshTaskID, using: nil) { task in
            Self.handleRefresh(task as! BGAppRefreshTask)
        }
        // Neue Schritte aus Health wecken die App im Hintergrund.
        HealthManager.shared.enableBackgroundDelivery {
            Task { @MainActor in _ = await SyncService.shared.sync(days: 2) }
        }
    }

    var body: some Scene {
        WindowGroup { ContentView() }
            .onChange(of: scenePhase) { _, phase in
                if phase == .background { Self.scheduleRefresh() }
            }
    }

    static func scheduleRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: refreshTaskID)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 3 * 3600)
        try? BGTaskScheduler.shared.submit(request)
    }

    private static func handleRefresh(_ task: BGAppRefreshTask) {
        scheduleRefresh()
        let work = Task { @MainActor in
            let ok = await SyncService.shared.sync(days: 2)
            task.setTaskCompleted(success: ok)
        }
        task.expirationHandler = { work.cancel() }
    }
}
