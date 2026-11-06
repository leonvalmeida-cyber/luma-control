import SwiftUI
import HueEntertainmentKit

struct HueDiagnosticsView: View {
    @StateObject private var diagnostics = HueDiagnostics()

    var body: some View {
        GroupBox("Hue-Verbindung prüfen") {
            VStack(alignment: .leading, spacing: 12) {
                Text(diagnostics.status)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Button("Bridge suchen") {
                    Task { await diagnostics.discover() }
                }
                .disabled(diagnostics.busy)

                ForEach(Array(diagnostics.bridges.enumerated()), id: \.element) { index, bridge in
                    HStack {
                        Text("Hue Bridge \(index + 1)")
                        Spacer()
                        Button("Verbinden") {
                            Task { await diagnostics.connect(bridge) }
                        }
                        .disabled(diagnostics.busy)
                    }
                    Button("Verbindung auf diesem iPhone entfernen") {
                        diagnostics.forget(bridge)
                    }
                    .font(.caption)
                    .disabled(diagnostics.busy)
                }

                ForEach(diagnostics.areas, id: \.id) { area in
                    VStack(alignment: .leading) {
                        Text(area.name).fontWeight(.semibold)
                        Text("\(area.channels.count) Kanäle · \(area.isActive ? "aktiv" : "inaktiv")")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Text("Dieser Test liest Bereiche und startet keinen Lichtstream.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

