export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12">
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Security & Privacy Policy</h1>
          <p className="text-gray-500 text-sm mb-8">Last updated: January 8, 2026</p>
          
          <hr className="border-gray-200 mb-8" />

          <p className="text-gray-700 leading-relaxed mb-8">
            Income Verifier is designed with security and privacy as core principles. This document outlines our security practices, data handling procedures, and compliance measures.
          </p>

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Data Protection</h2>
            
            <h3 className="font-medium text-gray-900 mb-2">1.1 Encryption</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              All data is protected using industry-standard encryption:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li><strong>At Rest:</strong> AES-256 encryption for all stored data</li>
              <li><strong>In Transit:</strong> TLS 1.3 for all connections</li>
              <li><strong>API Communication:</strong> mTLS (mutual TLS) for bank data provider connections</li>
            </ul>

            <h3 className="font-medium text-gray-900 mb-2">1.2 Data Minimization</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We limit data collection and storage to what is strictly necessary:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li><strong>Account Numbers:</strong> Only the last 4 digits are stored (masked)</li>
              <li><strong>Bank Credentials:</strong> Never stored — we use tokenized, read-only connections</li>
              <li><strong>Access Tokens:</strong> Deleted immediately after data fetch</li>
              <li><strong>Connection Persistence:</strong> Bank connections are disconnected immediately after use</li>
            </ul>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Bank Connectivity</h2>
            
            <h3 className="font-medium text-gray-900 mb-2">2.1 How It Works</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Bank account access is facilitated through Teller, a third-party financial data provider:
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li>Applicant authenticates directly with their bank via Teller Connect</li>
              <li>A temporary, read-only access token is generated</li>
              <li>We fetch up to 12 months of transaction data</li>
              <li>The bank connection is immediately deleted after data retrieval</li>
              <li>No ongoing access to the applicant's bank account is retained</li>
            </ol>

            <h3 className="font-medium text-gray-900 mb-2">2.2 Access Limitations</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our access to bank data is strictly limited:
            </p>
            <p className="text-gray-700 mb-2"><strong>What We Can Access:</strong></p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li>Transaction history (read-only)</li>
              <li>Account balances (read-only)</li>
              <li>Account names and last 4 digits</li>
            </ul>
            <p className="text-gray-700 mb-2"><strong>What We Cannot Do:</strong></p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Move money or initiate transactions</li>
              <li>See full account numbers</li>
              <li>Access bank login credentials</li>
              <li>Maintain persistent access to accounts</li>
            </ul>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Authentication & Authorization</h2>
            
            <h3 className="font-medium text-gray-900 mb-2">3.1 User Authentication</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li>Email/password authentication via Supabase Auth</li>
              <li>Secure session management with HTTP-only cookies</li>
              <li>Password requirements enforced at sign-up</li>
            </ul>

            <h3 className="font-medium text-gray-900 mb-2">3.2 Row Level Security (RLS)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              All database tables use Postgres Row Level Security. This ensures that even if there is a bug in our application code, the database itself prevents unauthorized access to data belonging to other users.
            </p>

            <h3 className="font-medium text-gray-900 mb-2">3.3 Access Control</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li><strong>Landlord:</strong> Can access only their own verifications and reports</li>
              <li><strong>Applicant:</strong> Can access only the verification form via unique token</li>
              <li><strong>Admin:</strong> Server-side operations only; no direct UI access to user data</li>
            </ul>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Retention</h2>
            
            <h3 className="font-medium text-gray-900 mb-2">4.1 Automatic Deletion</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li><strong>Verification Data:</strong> Automatically deleted 2 years after completion</li>
              <li><strong>Audit Logs:</strong> Retained for compliance purposes; deletions are logged</li>
              <li><strong>Session Data:</strong> Cleared on logout</li>
            </ul>

            <h3 className="font-medium text-gray-900 mb-2">4.2 Manual Deletion</h3>
            <p className="text-gray-700 leading-relaxed">
              Users may request deletion of all their data at any time via Settings → Privacy & Data → Delete All Data, or by contacting support.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. GDPR Compliance</h2>
            
            <h3 className="font-medium text-gray-900 mb-2">5.1 Data Subject Rights</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We support the following data subject rights under GDPR and similar regulations:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li><strong>Right to Access:</strong> Export all data via Settings → Privacy & Data</li>
              <li><strong>Right to Portability:</strong> JSON export includes all user data</li>
              <li><strong>Right to Erasure:</strong> One-click deletion of all data</li>
              <li><strong>Right to Rectification:</strong> Edit profile and verification defaults at any time</li>
            </ul>

            <h3 className="font-medium text-gray-900 mb-2">5.2 Data Export</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Exported data includes user profile information, verification metadata, and activity/audit logs. Raw financial transaction data is excluded from standard exports for security reasons. Users requiring transaction-level data for a specific verification should contact support.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Audit Logging</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All significant actions are logged for security and compliance purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li>Report views (user ID, verification ID, timestamp, IP address)</li>
              <li>Data exports (user ID, timestamp)</li>
              <li>Data deletions (user ID, what was deleted, timestamp)</li>
              <li>Verification creation (user ID, applicant info, timestamp)</li>
              <li>Login and logout events (user ID, timestamp, IP address)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Audit logs are immutable, retained for 7 years for compliance, and included in user data exports.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Infrastructure Security</h2>
            
            <h3 className="font-medium text-gray-900 mb-2">7.1 Hosting</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li><strong>Database:</strong> Supabase (AWS infrastructure)</li>
              <li><strong>Application:</strong> Vercel Edge Network</li>
              <li><strong>Region:</strong> Data stored in US-East</li>
            </ul>

            <h3 className="font-medium text-gray-900 mb-2">7.2 Network Security</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>All endpoints are HTTPS-only</li>
              <li>API rate limiting is enabled</li>
              <li>CORS is restricted to the application domain</li>
              <li>Content Security Policy (CSP) headers are configured</li>
            </ul>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Compliance & Certifications</h2>
            
            <h3 className="font-medium text-gray-900 mb-2">8.1 Standards We Follow</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li><strong>GDPR:</strong> General Data Protection Regulation (EU)</li>
              <li><strong>CCPA:</strong> California Consumer Privacy Act</li>
              <li><strong>SOC 2:</strong> Via Supabase infrastructure</li>
            </ul>

            <h3 className="font-medium text-gray-900 mb-2">8.2 Third-Party Security Certifications</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li><strong>Supabase:</strong> SOC 2 Type II</li>
              <li><strong>Teller:</strong> SOC 2 Type II, PCI DSS</li>
              <li><strong>Vercel:</strong> SOC 2 Type II</li>
            </ul>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 9 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Vulnerability Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you discover a security vulnerability, please report it responsibly:
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
              <li>Email us at security@[yourdomain].com</li>
              <li>Do not disclose publicly until we have had time to address the issue</li>
              <li>We aim to respond within 48 hours</li>
              <li>We do not pursue legal action against good-faith security researchers</li>
            </ol>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 10 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For security concerns or questions, please contact:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li><strong>Security Issues:</strong> security@[yourdomain].com</li>
              <li><strong>Privacy Requests:</strong> privacy@[yourdomain].com</li>
              <li><strong>General Support:</strong> support@[yourdomain].com</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
