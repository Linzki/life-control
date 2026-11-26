import Foundation
import HealthKit

/// Alle Werte eines Tages. nil = keine Daten vorhanden (wird in Notion nicht überschrieben).
struct DailyMetrics {
    var day: Date
    var steps: Double?
    var activeEnergyKcal: Double?
    var distanceKm: Double?
    var exerciseMinutes: Double?
    var restingHeartRate: Double?
    var avgHeartRate: Double?
    var sleepHours: Double?
    var weightKg: Double?
    var workoutCount: Int?
    var workoutMinutes: Double?
}

final class HealthManager {
    static let shared = HealthManager()
    private let store = HKHealthStore()

    static var isAvailable: Bool { HKHealthStore.isHealthDataAvailable() }

    private var quantityIDs: [HKQuantityTypeIdentifier] {
        [.stepCount, .activeEnergyBurned, .distanceWalkingRunning, .appleExerciseTime,
         .restingHeartRate, .heartRate, .bodyMass]
    }

    private var readTypes: Set<HKObjectType> {
        var set = Set<HKObjectType>(quantityIDs.compactMap { HKQuantityType.quantityType(forIdentifier: $0) })
        if let sleep = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) { set.insert(sleep) }
        set.insert(HKObjectType.workoutType())
        return set
    }

    // MARK: - Berechtigung

    func requestAuthorization() async throws {
        guard Self.isAvailable else { throw HealthError.unavailable }
        try await store.requestAuthorization(toShare: [], read: readTypes)
    }

    // MARK: - Hintergrund-Zustellung

    /// Weckt die App im Hintergrund, wenn neue Schritte eintreffen.
    func enableBackgroundDelivery(onUpdate: @escaping () -> Void) {
        guard Self.isAvailable,
              let type = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return }
        store.enableBackgroundDelivery(for: type, frequency: .hourly) { _, _ in }
        let query = HKObserverQuery(sampleType: type, predicate: nil) { _, completion, error in
            if error == nil { onUpdate() }
            completion()
        }
        store.execute(query)
    }

    // MARK: - Tageswerte

    func metrics(for day: Date) async -> DailyMetrics {
        let cal = Calendar.current
        let start = cal.startOfDay(for: day)
        let end = cal.date(byAdding: .day, value: 1, to: start)!

        async let steps = sum(.stepCount, unit: .count(), start: start, end: end)
        async let energy = sum(.activeEnergyBurned, unit: .kilocalorie(), start: start, end: end)
        async let dist = sum(.distanceWalkingRunning, unit: .meterUnit(with: .kilo), start: start, end: end)
        async let exercise = sum(.appleExerciseTime, unit: .minute(), start: start, end: end)
        let bpm = HKUnit.count().unitDivided(by: .minute())
        async let resting = average(.restingHeartRate, unit: bpm, start: start, end: end)
        async let avgHR = average(.heartRate, unit: bpm, start: start, end: end)
        async let weight = latest(.bodyMass, unit: .gramUnit(with: .kilo), start: start, end: end)
        async let sleep = sleepHours(for: start)
        async let workouts = workoutStats(start: start, end: end)

        var m = DailyMetrics(day: start)
        m.steps = await steps
        m.activeEnergyKcal = await energy
        m.distanceKm = await dist
        m.exerciseMinutes = await exercise
        m.restingHeartRate = await resting
        m.avgHeartRate = await avgHR
        m.weightKg = await weight
        m.sleepHours = await sleep
        let w = await workouts
        if w.count > 0 {
            m.workoutCount = w.count
            m.workoutMinutes = w.minutes
        }
        return m
    }

    // MARK: - Queries

    private func quantityType(_ id: HKQuantityTypeIdentifier) -> HKQuantityType? {
        HKQuantityType.quantityType(forIdentifier: id)
    }

    private func sum(_ id: HKQuantityTypeIdentifier, unit: HKUnit, start: Date, end: Date) async -> Double? {
        guard let type = quantityType(id) else { return nil }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        return await withCheckedContinuation { cont in
            let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate,
                                      options: .cumulativeSum) { _, stats, _ in
                cont.resume(returning: stats?.sumQuantity()?.doubleValue(for: unit))
            }
            store.execute(q)
        }
    }

    private func average(_ id: HKQuantityTypeIdentifier, unit: HKUnit, start: Date, end: Date) async -> Double? {
        guard let type = quantityType(id) else { return nil }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        return await withCheckedContinuation { cont in
            let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate,
                                      options: .discreteAverage) { _, stats, _ in
                cont.resume(returning: stats?.averageQuantity()?.doubleValue(for: unit))
            }
            store.execute(q)
        }
    }

    /// Letzter Messwert des Tages (z. B. Gewicht).
    private func latest(_ id: HKQuantityTypeIdentifier, unit: HKUnit, start: Date, end: Date) async -> Double? {
        guard let type = quantityType(id) else { return nil }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: predicate, limit: 1,
                                  sortDescriptors: [sort]) { _, samples, _ in
                let value = (samples?.first as? HKQuantitySample)?.quantity.doubleValue(for: unit)
                cont.resume(returning: value)
            }
            store.execute(q)
        }
    }

    /// Schlaf der Nacht, die an diesem Tag endet (Fenster: Vortag 18:00 – Tag 18:00).
    /// Überlappende Quellen (Watch + iPhone) werden zusammengeführt.
    private func sleepHours(for dayStart: Date) async -> Double? {
        guard let type = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) else { return nil }
        let cal = Calendar.current
        let start = cal.date(byAdding: .hour, value: -6, to: dayStart)!
        let end = cal.date(byAdding: .hour, value: 18, to: dayStart)!
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
        let asleep: Set<Int> = [
            HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
            HKCategoryValueSleepAnalysis.asleepCore.rawValue,
            HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
            HKCategoryValueSleepAnalysis.asleepREM.rawValue,
        ]
        let intervals: [(Date, Date)] = await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit,
                                  sortDescriptors: nil) { _, samples, _ in
                let list = (samples as? [HKCategorySample] ?? [])
                    .filter { asleep.contains($0.value) }
                    .map { ($0.startDate, $0.endDate) }
                cont.resume(returning: list)
            }
            store.execute(q)
        }
        guard !intervals.isEmpty else { return nil }
        let sorted = intervals.sorted { $0.0 < $1.0 }
        var total: TimeInterval = 0
        var cur = sorted[0]
        for iv in sorted.dropFirst() {
            if iv.0 <= cur.1 {
                cur.1 = max(cur.1, iv.1)
            } else {
                total += cur.1.timeIntervalSince(cur.0)
                cur = iv
            }
        }
        total += cur.1.timeIntervalSince(cur.0)
        return total / 3600
    }

    private func workoutStats(start: Date, end: Date) async -> (count: Int, minutes: Double) {
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: predicate,
                                  limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                let workouts = samples as? [HKWorkout] ?? []
                cont.resume(returning: (workouts.count, workouts.reduce(0) { $0 + $1.duration } / 60))
            }
            store.execute(q)
        }
    }
}

enum HealthError: LocalizedError {
    case unavailable
    var errorDescription: String? { "Apple Health ist auf diesem Gerät nicht verfügbar." }
}
