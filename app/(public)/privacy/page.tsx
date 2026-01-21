import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for IncomeChecker.com. Learn how we collect, use, and protect your information when using our income verification service.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12">
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm mb-8">Last updated: January 2026</p>
          
          <hr className="border-gray-200 mb-8" />

          <p className="text-gray-700 leading-relaxed mb-8">
            IncomeChecker ("IncomeChecker," "we," "our," or "us") values your privacy. This Privacy Policy explains how we collect, use, disclose, and protect information when you use our website and services (the "Service").
          </p>

          <p className="text-gray-700 leading-relaxed mb-8">
            By using IncomeChecker, you agree to the practices described in this Privacy Policy.
          </p>

          <hr className="border-gray-200 mb-8" />

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
            
            <h3 className="font-medium text-gray-900 mb-2">1.1 Information You Provide</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may collect information you provide directly, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li>Name</li>
              <li>Email address</li>
              <li>Account or verification details you submit</li>
              <li>Communications with us (support inquiries, emails)</li>
            </ul>

            <h3 className="font-medium text-gray-900 mb-2">1.2 Financial Information (User-Consented)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When an individual chooses to connect a financial account, we access financial data <strong>only with explicit user consent</strong>. This may include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li>Account names and types</li>
              <li>Transaction history</li>
              <li>Account balances</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We do <strong>not</strong> collect or store bank login credentials.
            </p>

            <h3 className="font-medium text-gray-900 mb-2 mt-6">1.3 Automatically Collected Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may collect limited technical information such as:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>IP address</li>
              <li>Device and browser type</li>
              <li>Usage activity related to the Service</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              This data is used for security, reliability, and service improvement.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use information solely to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li>Generate income verification reports</li>
              <li>Provide and operate the Service</li>
              <li>Maintain security and prevent misuse</li>
              <li>Respond to support requests</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We do <strong>not</strong> use personal or financial information for advertising or profiling.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How Income Verification Works</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              IncomeChecker generates <strong>informational income verification reports</strong> based on user-authorized financial data. Reports summarize income patterns and historical deposits.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              IncomeChecker:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>Does <strong>not</strong> make decisions, recommendations, approvals, or denials</li>
              <li>Does <strong>not</strong> provide credit scores or eligibility assessments</li>
              <li>Provides factual summaries only</li>
            </ul>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do <strong>not</strong> sell personal or financial data.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may share information only:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li>With service providers who help operate the Service under confidentiality obligations</li>
              <li>When required by law, legal process, or regulatory request</li>
              <li>To protect the rights, safety, or security of IncomeChecker or others</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Financial data is shared only as authorized by the individual.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain information only as long as necessary to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li>Provide the Service</li>
              <li>Maintain records required for legal or compliance purposes</li>
              <li>Resolve disputes or enforce agreements</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Data is deleted or anonymized when no longer required.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use administrative, technical, and organizational safeguards to protect information against unauthorized access, loss, or misuse.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Despite our efforts, no system can be guaranteed to be completely secure.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on your location, you may have rights including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li>Accessing your personal information</li>
              <li>Requesting correction or deletion</li>
              <li>Objecting to or restricting certain processing</li>
              <li>Requesting data portability</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Requests can be made by contacting us at <a href="mailto:privacy@incomechecker.com" className="text-blue-600 hover:text-blue-800 underline">privacy@incomechecker.com</a>.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. California Privacy Rights (CCPA)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              California residents may have additional rights under the California Consumer Privacy Act, including the right to know what personal information is collected and the right to request deletion.
            </p>
            <p className="text-gray-700 leading-relaxed">
              IncomeChecker does <strong>not</strong> sell personal information.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 9 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. International Users</h2>
            <p className="text-gray-700 leading-relaxed">
              IncomeChecker is operated from the United States. If you access the Service from outside the U.S., your information may be processed in the United States in accordance with this Privacy Policy.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 10 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              IncomeChecker is not intended for use by children under 18. We do not knowingly collect information from children.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 11 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised "Last updated" date.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 12 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For privacy questions or requests, contact us at:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li><strong>Email:</strong> <a href="mailto:info@incomechecker.com" className="text-blue-600 hover:text-blue-800 underline">info@incomechecker.com</a></li>
              <li><strong>Website:</strong> <a href="https://incomechecker.com" className="text-blue-600 hover:text-blue-800 underline">https://incomechecker.com</a></li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
