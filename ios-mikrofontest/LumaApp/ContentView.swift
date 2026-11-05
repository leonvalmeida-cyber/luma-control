import SwiftUI

struct ContentView: View {
    @StateObject private var audio = MicrophoneMonitor()
    @State private var target: LumaTarget = .livingRoom

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text("Luma Control")
                        .font(.largeTitle.bold())
                    Text("Echtzeitlabor · Schritt 1: Mikrofon überprüfen")
                        .foregroundStyle(.secondary)

                    Picker("Lichtbereich", selection: $target) {
                        ForEach(LumaTarget.allCases) { area in
                            Text(area.rawValue).tag(area)
                        }
                    }
                    .pickerStyle(.segmented)

                    GroupBox("Mikrofonanalyse") {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("Audio")
                                Spacer()
                                Text(audio.isRunning ? "Aktiv" : "Gestoppt")
                                    .foregroundStyle(audio.isRunning ? .green : .secondary)
                            }
                            ProgressView(value: audio.level)
                                .tint(.purple)
                            HStack {
                                Text("Pegel")
                                Spacer()
                                Text("\(Int(audio.level * 100)) %")
                                    .monospacedDigit()
                            }
                            HStack {
                                Text("Impuls")
                                Spacer()
                                Text("\(Int(audio.transient * 100)) %")
                                    .monospacedDigit()
                            }
                            HStack {
                                Text("Letzter Eingang")
                                Spacer()
                                Text(audio.lastFrameAgeMs.isFinite ? "\(Int(audio.lastFrameAgeMs)) ms" : "–")
                                    .monospacedDigit()
                            }
                            Text(audio.status)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                            Button(audio.isRunning ? "Mikrofon stoppen" : "Mikrofon starten") {
                                if audio.isRunning { audio.stop() }
                                else { Task { await audio.start() } }
                            }
                            .buttonStyle(.borderedProminent)
                        }
                        .padding(.vertical, 8)
                    }
                    Text("Dieser erste native Test steuert noch keine Lampen. Erst wenn die Mikrofonanalyse dauerhaft stabil ist, aktivieren wir den verschlüsselten Hue-Entertainment-Stream.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding()
            }
            .navigationTitle("Luma")
            .navigationBarTitleDisplayMode(.inline)
            .onDisappear { audio.stop() }
        }
    }
}

