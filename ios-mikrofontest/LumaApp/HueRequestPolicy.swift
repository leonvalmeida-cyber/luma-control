import Foundation

enum HueRequestPolicy {
    static func allows(_ url: URL, expectedHost: String) -> Bool {
        url.scheme?.lowercased() == "https"
            && url.host?.lowercased() == expectedHost.lowercased()
            && (url.port ?? 443) == 443
            && url.user == nil
            && url.password == nil
            && url.fragment == nil
    }

    /// Bridge credentials must never be forwarded to a redirected endpoint.
    static func redirectedRequest(_ request: URLRequest) -> URLRequest? { nil }
}

