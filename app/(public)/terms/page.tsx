import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of Use for IncomeChecker.com. Review the terms and conditions for using our income verification service.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12">
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Use</h1>
          <p className="text-gray-500 text-sm mb-8">Last updated: January 2026</p>
          
          <hr className="border-gray-200 mb-8" />

          <p className="text-gray-700 leading-relaxed mb-8">
            These Terms of Use ("Terms") govern your access to and use of the IncomeChecker website and services (the "Service"), operated by <strong>Income Checker LLC</strong>, a Michigan limited liability company ("IncomeChecker," "we," "our," or "us").
          </p>

          <p className="text-gray-700 leading-relaxed mb-8">
            By accessing or using IncomeChecker, you agree to be bound by these Terms. If you do not agree, do not use the Service.
          </p>

          <hr className="border-gray-200 mb-8" />

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Description of the Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              IncomeChecker provides <strong>income verification reports</strong> based on financial account data that an individual voluntarily authorizes for access. Reports summarize income-related information such as historical deposits and income patterns.
            </p>
            <p className="text-gray-700 leading-relaxed">
              IncomeChecker provides <strong>informational reports only</strong>. We do not make decisions, recommendations, approvals, denials, or eligibility determinations of any kind.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You must be at least 18 years old to use the Service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using IncomeChecker, you represent that you have the legal capacity to enter into these Terms and to use the Service in compliance with applicable laws.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li>Use the Service only for lawful purposes</li>
              <li>Obtain proper authorization before requesting or sharing a verification</li>
              <li>Use reports solely for their intended informational purpose</li>
              <li>Not misuse, resell, scrape, or attempt to extract underlying financial data</li>
              <li>Not attempt to reverse engineer or bypass service safeguards</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You are solely responsible for how you use any information obtained through the Service.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Consent and Authorization</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Income verification reports are generated <strong>only after explicit authorization</strong> from the individual whose financial data is accessed.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You agree not to request, access, or use financial information without proper consent.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. No Financial, Legal, or Professional Advice</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              IncomeChecker does not provide financial, legal, credit, underwriting, or professional advice.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Reports are provided "as is" for informational purposes only. Any decisions made using the information are made at your own discretion and responsibility.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Fees and Payment</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Certain features of the Service require payment.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
              <li>Fees are disclosed prior to purchase</li>
              <li>Charges apply only to completed verifications</li>
              <li>Subscription plans renew automatically unless canceled</li>
              <li>Prices may change with notice</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              All payments are non-refundable except as required by law.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data Accuracy and Limitations</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              IncomeChecker relies on third-party data sources and user-authorized information. We do not guarantee that reports are complete, accurate, or representative of an individual's full financial situation.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Historical income data may not reflect future income.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Data Access and Restrictions</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Reports are <strong>view-only</strong>. Raw financial transaction data cannot be downloaded or exported.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You agree not to copy, store, distribute, or attempt to reconstruct underlying financial data beyond what is displayed.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 9 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All content, software, and materials provided by IncomeChecker are owned by or licensed to IncomeChecker and are protected by intellectual property laws.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You may not copy, modify, distribute, or create derivative works without prior written consent.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 10 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Service Availability</h2>
            <p className="text-gray-700 leading-relaxed">
              We may modify, suspend, or discontinue any part of the Service at any time. We do not guarantee uninterrupted or error-free operation.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 11 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may suspend or terminate access to the Service if you violate these Terms or misuse the Service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You may stop using the Service at any time.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 12 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Disclaimer of Warranties</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE."
            </p>
            <p className="text-gray-700 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 13 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To the maximum extent permitted by law, IncomeChecker shall not be liable for any indirect, incidental, consequential, or special damages arising from your use of the Service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our total liability shall not exceed the amount paid by you to IncomeChecker in the twelve (12) months preceding the claim.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 14 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless <strong>Income Checker LLC</strong> from any claims, damages, losses, or liabilities arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 15 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Governing Law and Venue</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms are governed by the laws of the <strong>State of Michigan</strong>, without regard to conflict of law principles.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Any disputes arising out of or relating to these Terms or the Service shall be brought exclusively in the state or federal courts located in <strong>Michigan</strong>, and you consent to their jurisdiction.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 16 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">16. Changes to These Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms from time to time. Updated Terms will be posted on this page with a revised "Last updated" date.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Section 17 */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">17. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For questions regarding these Terms, contact us at:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li><strong>Email:</strong> <a href="mailto:info@incomechecker.com" className="text-blue-600 hover:text-blue-800 underline">info@incomechecker.com</a></li>
              <li><strong>Company:</strong> Income Checker LLC</li>
              <li><strong>Website:</strong> <a href="https://incomechecker.com" className="text-blue-600 hover:text-blue-800 underline">https://incomechecker.com</a></li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
