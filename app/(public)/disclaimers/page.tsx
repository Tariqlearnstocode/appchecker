import { Metadata } from 'next';
import { getURL } from '@/utils/helpers';

const siteUrl = getURL();
const ogImage = `${siteUrl}/opengraph-image.png`;

export const metadata: Metadata = {
  title: 'Disclaimers & Limitations - IncomeChecker.com',
  description: 'Important disclaimers and limitations for IncomeChecker.com income verification reports. Understand the scope, accuracy, and limitations of our verification service.',
  openGraph: {
    title: 'Disclaimers & Limitations - IncomeChecker.com',
    description: 'Important disclaimers and limitations for IncomeChecker.com income verification reports. Understand the scope, accuracy, and limitations of our verification service.',
    url: `${siteUrl}/disclaimers`,
    siteName: 'IncomeChecker.com',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'IncomeChecker.com',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Disclaimers & Limitations - IncomeChecker.com',
    description: 'Important disclaimers and limitations for IncomeChecker.com income verification reports. Understand the scope, accuracy, and limitations of our verification service.',
    images: [ogImage],
  },
};

export default function DisclaimersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12">
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Disclaimers & Limitations</h1>
          <p className="text-gray-500 text-sm mb-8">Last updated: January 8, 2026</p>
          
          <hr className="border-gray-200 mb-8" />

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Purpose of This Report</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              This report is provided for informational purposes only. It presents income-related data derived from bank account information that the applicant voluntarily authorized for access through a third-party financial data provider.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The report is intended to assist the requesting party in reviewing income information. It does not evaluate suitability, eligibility, or qualification for housing or any other purpose.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. No Rental Decision, Recommendation, or Advice</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not make rental decisions, recommendations, approvals, denials, or eligibility determinations.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              This report does not constitute:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Tenant screening</li>
              <li>Credit evaluation</li>
              <li>Underwriting</li>
              <li>Risk assessment</li>
              <li>Housing advice</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              All decisions made using this report are solely the responsibility of the requesting party (e.g., landlord or property owner).
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Not a Consumer Reporting Agency</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We are not a consumer reporting agency as defined under the Fair Credit Reporting Act (FCRA) or similar federal or state laws.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We do not provide consumer reports, credit reports, background checks, eviction reports, or tenant screening services. This report should not be relied upon as a substitute for such services.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Source of Data & Applicant Authorization</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All information in this report is based on financial account data that the applicant explicitly authorized for access.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We do not collect data without the applicant's consent and do not access accounts, institutions, or information that the applicant did not choose to connect.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Limitations & Income Estimates</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Income figures shown in this report are estimates based on detected deposits and historical transaction patterns from connected financial accounts.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Limitations include, but are not limited to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Cash income not deposited into a connected account</li>
              <li>Income deposited into accounts not linked by the applicant</li>
              <li>Irregular, one-time, or non-payroll deposits</li>
              <li>Incomplete or delayed transaction data from financial institutions</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We do not verify employment status, job title, employer legitimacy, future income, or income stability.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Accuracy & No Warranties</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The report is provided "as is" and "as available."
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We make no representations or warranties, express or implied, regarding the accuracy, completeness, reliability, or timeliness of the information contained in this report.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Financial institutions ultimately control the availability and accuracy of transaction data, and discrepancies may occur.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To the maximum extent permitted by law, we are not liable for any losses, damages, claims, or decisions arising from or related to the use of this report.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              This includes, without limitation:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Housing decisions</li>
              <li>Financial decisions</li>
              <li>Business decisions</li>
              <li>Reliance on estimated income figures</li>
            </ul>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Role Clarification</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We are not:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>A landlord</li>
              <li>A property manager</li>
              <li>A real estate broker</li>
              <li>An employer</li>
              <li>A government agency</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Our role is limited to presenting factual, applicant-authorized financial data in a summarized format.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 9 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Responsibility of the Requesting Party</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The requesting party is solely responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Interpreting the information in this report</li>
              <li>Ensuring compliance with all applicable laws and regulations</li>
              <li>Making any housing or business decisions</li>
            </ul>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 10 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Questions or Corrections</h2>
            <p className="text-gray-700 leading-relaxed">
              If the applicant believes information in this report is incomplete or inaccurate, they should contact the requesting party directly. We do not adjudicate disputes or alter decisions made by third parties.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

