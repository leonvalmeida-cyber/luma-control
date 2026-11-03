import Foundation

/// Store one latest music frame without accumulating old light commands.
struct LumaRGB: Sendable, Equatable {
    let red: UInt16
    let green: UInt16
    let blue: UInt16
}
struct LumaFrame: Sendable, Equatable {
    let capturedAt: ContinuousClock.Instant
    let channels: [UInt8: LumaRGB]
}
actor LatestFrameMailbox {
    private var latest: LumaFrame?
    private var generation: UInt64 = 0
    private let clock = ContinuousClock()

    func publish(_ frame: LumaFrame) {
        generation &+= 1
        latest = frame
    }

    func take(maxAge: Duration = .milliseconds(120)) -> (generation: UInt64, frame: LumaFrame)? {
        guard let frame = latest, clock.now - frame.capturedAt <= maxAge else { return nil }
        return (generation, frame)
    }

    func clear() {
        generation &+= 1
        latest = nil
    }
}

enum LumaTarget: String, CaseIterable, Identifiable, Sendable {
    case all = "All"
    case livingRoom = "Wohnzimmer"
    var id: String { rawValue }
}
