import Foundation

@main
struct HueRequestPolicyChecks {
    static func main() {
        let host = "hue-bridge.local"
        let allowed = ["https://hue-bridge.local/api", "https://HUE-BRIDGE.LOCAL:443/clip/v2/resource"]
        let denied = [
            "http://hue-bridge.local/api",
            "https://other.local/api",
            "https://hue-bridge.local:444/api",
            "https://user:password@hue-bridge.local/api",
            "https://hue-bridge.local/api#fragment",
            "https://hue-bridge.local.evil.example/api"
        ]
        for item in allowed {
            precondition(HueRequestPolicy.allows(URL(string: item)!, expectedHost: host), "Valid bridge rejected")
        }
        for item in denied {
            precondition(!HueRequestPolicy.allows(URL(string: item)!, expectedHost: host), "Unsafe endpoint accepted")
        }
        let redirected = URLRequest(url: URL(string: "https://other.local/")!)
        precondition(HueRequestPolicy.redirectedRequest(redirected) == nil, "Redirect was followed")
        print("Hue request security policy checks passed")
    }
}

