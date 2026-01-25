'use client';

import { BankSelector } from '@/components/ui/BankSelector';

export default function SupportedBanksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Supported Banks & Financial Institutions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We support connections to over 7,000 U.S. banks and credit unions through our secure banking partner, Plaid.
          </p>
        </div>

        {/* Bank Selector Component */}
        <div className="max-w-4xl mx-auto">
          <BankSelector
            searchPlaceholder="Search for your bank..."
          />
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            All names are trademarks™ or registered trademarks® of their respective holders. <br />Their usage does not imply any affiliation with or endorsement by their holders.
          </p>
        </div>
      </div>
    </div>
  );
}
