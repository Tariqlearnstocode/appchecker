export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12">
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Security</h1>
          
          <hr className="border-gray-200 mb-8" />

          <p className="text-gray-700 leading-relaxed mb-8">
            IncomeChecker is designed with security and privacy as core principles.
          </p>

          <p className="text-gray-700 leading-relaxed mb-8">
            We use industry-standard safeguards to protect user data and ensure information is accessed only with explicit user consent.
          </p>

          {/* Key Principles */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Principles</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>User-consented access:</strong> Financial data is accessed only after explicit authorization by the individual.</li>
              <li><strong>Read-only connections:</strong> We do not support money movement, transfers, or account changes.</li>
              <li><strong>No credential storage:</strong> Bank login credentials are never stored or visible to IncomeChecker.</li>
              <li><strong>Minimal data use:</strong> Data is used solely to generate an income verification report.</li>
              <li><strong>View-only reports:</strong> Raw transaction data cannot be downloaded or exported.</li>
              <li><strong>Restricted access:</strong> Access to systems and data is limited by role and purpose, and is monitored.</li>
            </ul>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Data Handling */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Handling</h2>
            <p className="text-gray-700 leading-relaxed">
              Data is protected using secure infrastructure and modern security practices. Access is restricted based on role and purpose, and data is retained only as long as necessary to operate the service and meet legal obligations.
            </p>
          </section>

          <hr className="border-gray-200 mb-8" />

          {/* Responsible Disclosure */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsible Disclosure</h2>
            <p className="text-gray-700 leading-relaxed">
              If you believe you've identified a security vulnerability, please contact us at <a href="mailto:security@incomechecker.com" className="text-blue-600 hover:text-blue-800 underline">security@incomechecker.com</a>.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              We investigate all good-faith reports and do not pursue legal action against responsible security researchers.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
