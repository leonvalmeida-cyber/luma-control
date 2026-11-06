import Foundation
import Security
import HueEntertainmentKit

/// One Bridge only. Redirects are never followed, and all HTTPS requests
/// must target this Bridge and pass the Hue CA and Bridge-ID checks.
final class HueSecureTransport: HueHTTPTransport, @unchecked Sendable {
    private let expectedHost: String
    private let delegate: HueTrustDelegate
    private let session: URLSession

    init(host: String, bridgeID: String) {
        self.expectedHost = host.lowercased()
        let delegate = HueTrustDelegate(host: host, bridgeID: bridgeID)
        self.delegate = delegate
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 10
        config.timeoutIntervalForResource = 15
        config.waitsForConnectivity = false
        config.urlCache = nil
        config.httpCookieStorage = nil
        config.urlCredentialStorage = nil
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        self.session = URLSession(configuration: config, delegate: delegate, delegateQueue: nil)
    }

    deinit {
        session.invalidateAndCancel()
    }

    func send(_ request: HueHTTPRequest) async throws -> HueHTTPResponse {
        guard HueRequestPolicy.allows(request.url, expectedHost: expectedHost)
        else { throw HueEntertainmentError.invalidEndpoint }
        var urlRequest = URLRequest(url: request.url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 10)
        urlRequest.httpMethod = request.method.rawValue
        urlRequest.httpBody = request.body
        for (name, value) in request.headers {
            urlRequest.setValue(value, forHTTPHeaderField: name)
        }
        let (data, response) = try await session.data(for: urlRequest)
        guard let http = response as? HTTPURLResponse else {
            throw HueEntertainmentError.malformedResponse
        }
        let headers = http.allHeaderFields.reduce(into: [String: String]()) { result, pair in
            result[String(describing: pair.key).lowercased()] = String(describing: pair.value)
        }
        return HueHTTPResponse(statusCode: http.statusCode, headers: headers, body: data)
    }
}

private final class HueTrustDelegate: NSObject, URLSessionDelegate, URLSessionTaskDelegate, @unchecked Sendable {
    private let expectedHost: String
    private let bridgeID: String

    init(host: String, bridgeID: String) {
        self.expectedHost = host.lowercased()
        self.bridgeID = bridgeID
    }

    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse,
        newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void
    ) {
        completionHandler(HueRequestPolicy.redirectedRequest(request))
    }

    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        let space = challenge.protectionSpace
        guard space.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              space.host.lowercased() == expectedHost,
              space.port == 443,
              let trust = space.serverTrust
        else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        let roots = HueBridgeCertificateAuthority.rootCertificates.compactMap {
            SecCertificateCreateWithData(nil, $0 as CFData)
        }
        let chain = SecTrustCopyCertificateChain(trust) as? [SecCertificate]
        var name: CFString?
        if let leaf = chain?.first { SecCertificateCopyCommonName(leaf, &name) }
        guard !roots.isEmpty,
              let name,
              (name as String).caseInsensitiveCompare(bridgeID) == .orderedSame,
              SecTrustSetAnchorCertificates(trust, roots as CFArray) == errSecSuccess,
              SecTrustSetAnchorCertificatesOnly(trust, true) == errSecSuccess,
              SecTrustSetPolicies(trust, SecPolicyCreateBasicX509()) == errSecSuccess,
              SecTrustEvaluateWithError(trust, nil)
        else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        completionHandler(.useCredential, URLCredential(trust: trust))
    }
}

