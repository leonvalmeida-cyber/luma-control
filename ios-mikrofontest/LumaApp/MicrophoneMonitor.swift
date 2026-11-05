import Foundation
import AVFoundation
import Combine

/// Audio-only diagnostics; no recording files, cloud upload or Hue traffic.
/// Values are visual diagnostics, not calibrated sound-pressure dB.
@MainActor
final class MicrophoneMonitor: ObservableObject {
    @Published private(set) var isRunning = false
    @Published private(set) var level: Double = 0
    @Published private(set) var transient: Double = 0
    @Published private(set) var lastFrameAgeMs: Double = 0
    @Published private(set) var status = "Mikrofon noch nicht gestartet."

    private var engine: AVAudioEngine?
    private var timer: Timer?
    private let sample = AudioLevelMailbox()
    private var previous = 0.0

    func start() async {
        guard !isRunning else { return }
        let granted = await withCheckedContinuation { continuation in
            AVAudioApplication.requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
        guard granted else {
            status = "Mikrofonzugriff in den iPhone-Einstellungen erlauben."
            return
        }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.record, mode: .measurement, options: [])
            try session.setActive(true)
            let engine = AVAudioEngine()
            let node = engine.inputNode
            let format = node.outputFormat(forBus: 0)
            guard format.channelCount > 0 else {
                status = "Kein Audioeingang verfügbar."
                return
            }
            node.installTap(onBus: 0, bufferSize: 1024, format: format) { [sample] buffer, _ in
                guard let channel = buffer.floatChannelData?[0] else { return }
                let count = Int(buffer.frameLength)
                guard count > 0 else { return }
                var power = 0.0
                for index in 0..<count {
                    let value = Double(channel[index])
                    power += value * value
                }
                sample.publish(rms: sqrt(power / Double(count)))
            }
            engine.prepare()
            try engine.start()
            self.engine = engine
            previous = 0
            isRunning = true
            status = "Audioeingang aktiv · ohne Lampenübertragung"
            timer = Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { [weak self] _ in
                Task { @MainActor [weak self] in self?.refresh() }
            }
        } catch {
            stop()
            status = "Audiofehler: \(error.localizedDescription)"
        }
    }

    private func refresh() {
        guard let value = sample.read() else {
            lastFrameAgeMs = .infinity
            return
        }
        let age = (ProcessInfo.processInfo.systemUptime - value.timestamp) * 1000
        lastFrameAgeMs = max(0, age)
        if age > 500 {
            level = 0
            transient = 0
            status = "Keine aktuellen Mikrofon-Daten."
            return
        }
        let scaled = min(1, max(0, value.rms * 8))
        transient = min(1, max(0, scaled - previous) * 5)
        level = scaled
        previous = previous * 0.8 + scaled * 0.2
    }

    func stop() {
        timer?.invalidate()
        timer = nil
        engine?.inputNode.removeTap(onBus: 0)
        engine?.stop()
        engine = nil
        try? AVAudioSession.sharedInstance().setActive(false)
        isRunning = false
        level = 0
        transient = 0
        status = "Gestoppt."
    }
}

/// The audio callback does not enqueue every frame on the main thread.
/// It overwrites one small snapshot which the UI reads at a fixed rate.
private final class AudioLevelMailbox: @unchecked Sendable {
    struct Value {
        var rms: Double
        var timestamp: TimeInterval
    }
    private var value: Value?
    private let lock = NSLock()

    func publish(rms: Double) {
        lock.lock()
        value = Value(rms: rms, timestamp: ProcessInfo.processInfo.systemUptime)
        lock.unlock()
    }
    func read() -> Value? {
        lock.lock()
        defer { lock.unlock() }
        return value
    }
}

