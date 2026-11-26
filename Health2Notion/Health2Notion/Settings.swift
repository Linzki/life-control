import Foundation
import Security

/// Notion-Token liegt im Keychain, die Datenbank-ID in UserDefaults.
enum Settings {
    private static let service = "com.example.health2notion"
    private static let tokenAccount = "notion-token"
    private static let dbKey = "notion-database-id"
    private static let lastSyncKey = "last-sync"

    static var token: String {
        get { keychainRead() ?? "" }
        set { keychainWrite(newValue) }
    }

    static var databaseID: String {
        get { UserDefaults.standard.string(forKey: dbKey) ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: dbKey) }
    }

    static var lastSync: Date? {
        get { UserDefaults.standard.object(forKey: lastSyncKey) as? Date }
        set { UserDefaults.standard.set(newValue, forKey: lastSyncKey) }
    }

    static var isConfigured: Bool { !token.isEmpty && !databaseID.isEmpty }

    // MARK: - Keychain

    private static func query() -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: service,
         kSecAttrAccount as String: tokenAccount]
    }

    private static func keychainRead() -> String? {
        var q = query()
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: AnyObject?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess,
              let data = out as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private static func keychainWrite(_ value: String) {
        SecItemDelete(query() as CFDictionary)
        guard !value.isEmpty else { return }
        var q = query()
        q[kSecValueData as String] = Data(value.utf8)
        q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(q as CFDictionary, nil)
    }
}
