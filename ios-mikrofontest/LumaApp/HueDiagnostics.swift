import Foundation
import Combine
import HueEntertainmentKit

/// Explicit opt-in diagnostics. This does not start an Entertainment stream.
@MainActor
final class HueDiagnostics: ObservableObject {
    @Published private(set) var bridges: [HueBridgeEndpoint] = []
    @Published private(set) var areas: [HueEntertainmentConfiguration] = []
    @Published private(set) var status = "Suche nach deiner Hue Bridge im Heim-WLAN."
    @Published private(set) var busy = false

    private let store = KeychainHueCredentialStore(service: "de.lumaflow.diagnostics")

    func discover() async {
        guard !busy else { return }
        busy = true
        defer { busy = false }
        bridges = []
        areas = []
        status = "Suche nach Hue Bridges …"
        do {
            let results = try await HueBridgeDiscovery().discoverBonjour(for: .seconds(5))
            bridges = results.compactMap { endpoint in
                guard let id = endpoint.bridgeID, id.utf8.count == 16,
                      id.utf8.allSatisfy({ (48...57).contains($0) || (65...70).contains($0) || (97...102).contains($0) })
                else { return nil }
                // The advertised port can describe HTTP; CLIP requests use HTTPS 443.
                return try? HueBridgeEndpoint(host: endpoint.host, port: 443, bridgeID: id)
            }
            status = bridges.isEmpty
                ? "Keine Bridge mit gültiger Kennung gefunden. Prüfe WLAN und lokalen Netzwerkzugriff."
                : "Bridge gefunden. Tippe auf „Verbinden“."
        } catch {
            status = "Bridge-Suche fehlgeschlagen. Prüfe WLAN und lokalen Netzwerkzugriff."
        }
    }

    func connect(_ endpoint: HueBridgeEndpoint) async {
        guard !busy, let bridgeID = endpoint.bridgeID else { return }
        busy = true
        areas = []
        defer { busy = false }

        let transport = HueSecureTransport(host: endpoint.host, bridgeID: bridgeID)
        let alias = "bridge-" + bridgeID.uppercased()
        do {
            let credentials: HueCredentials
            if let existing = try store.load(alias: alias) {
                credentials = existing
                status = "Gespeicherte Verbindung wird geprüft …"
            } else {
                status = "Drücke jetzt die Taste auf der Hue Bridge. Die App wartet 30 Sekunden."
                let client = HueBridgeClient(endpoint: endpoint, transport: transport)
                let result = try await client.pairWaitingForLinkButton(
                    deviceType: "LumaFlow#iPhone",
                    timeout: .seconds(30),
                    progress: { _ in }
                )
                try store.save(result.credentials, alias: alias)
                credentials = result.credentials
            }
            let client = HueBridgeClient(endpoint: endpoint, credentials: credentials, transport: transport)
            areas = try await client.entertainmentConfigurations()
            status = areas.isEmpty
                ? "Verbunden. Keine Entertainment-Bereiche gemeldet."
                : "Verbunden. \(areas.count) Entertainment-Bereiche gefunden."
        } catch HueEntertainmentError.authenticationRequired {
            status = "Die gespeicherte Verbindung wurde nicht akzeptiert. Bitte Verbindung entfernen und neu koppeln."
        } catch {
            // Raw network errors or responses may contain sensitive data.
            status = "Verbindung fehlgeschlagen. Bridge-Taste, WLAN und lokalen Netzwerkzugriff prüfen."
        }
    }

    func forget(_ endpoint: HueBridgeEndpoint) {
        guard !busy, let bridgeID = endpoint.bridgeID else { return }
        do {
            try store.remove(alias: "bridge-" + bridgeID.uppercased())
            areas = []
            status = "Verbindung vom iPhone entfernt. Für eine neue Verbindung erneut koppeln."
        } catch {
            status = "Verbindung konnte nicht entfernt werden."
        }
    }
}

