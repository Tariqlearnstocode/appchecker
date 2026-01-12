'use client';

import { PricingModal } from '@/components/ui/Pricing';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileCheck } from 'lucide-react';

export default function PricingPage() {
  const [showModal, setShowModal] = useState(true);

  // Auto-open modal on page load
  useEffect(() => {
    setShowModal(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Income Verifier</span>
            </Link>
            <Link
              href="/"
              className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Content - Show pricing modal */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Transparent Pricing</h1>
          <p className="text-lg text-gray-600 mb-6">
            No hidden fees. No surprises. Only pay for successful verifications.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
          >
            View Pricing Details
          </button>
        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
