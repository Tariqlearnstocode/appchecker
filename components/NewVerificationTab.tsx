'use client';

import { Plus, Loader2 } from 'lucide-react';

interface LandlordInfo {
  name: string;
  email: string;
}

interface FormData {
  name: string;
  email: string;
}

interface NewVerificationTabProps {
  landlordInfo: LandlordInfo;
  setLandlordInfo: (info: LandlordInfo) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
  creating: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function NewVerificationTab({
  landlordInfo,
  setLandlordInfo,
  formData,
  setFormData,
  creating,
  onSubmit,
}: NewVerificationTabProps) {
  return (
    <>
      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create Income Verification Request</h2>
          <p className="text-sm text-gray-600">
            Stop chasing PDF bank statements. Get verified income data directly from the source in minutes.
          </p>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-6">
            {/* From Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">From</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="from-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Your / Company Name *
                  </label>
                  <input
                    id="from-name"
                    type="text"
                    value={landlordInfo.name}
                    onChange={(e) => setLandlordInfo({ ...landlordInfo, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="from-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="from-email"
                    type="email"
                    value={landlordInfo.email}
                    onChange={(e) => setLandlordInfo({ ...landlordInfo, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="Enter email"
                  />
                </div>
              </div>
            </div>

            {/* Recipient Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Recipient</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="individual-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name of Individual *
                    </label>
                    <input
                      id="individual-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-colors text-gray-900 placeholder-gray-400"
                      placeholder="Enter name"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="individual-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      id="individual-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-colors text-gray-900 placeholder-gray-400"
                      placeholder="Enter email"
                      required
                    />
                  </div>
                </div>

                {/* Custom Reference */}
                <div>
                  <label htmlFor="custom-reference" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Custom Reference <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="custom-reference"
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="e.g., Unit 4B"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={creating || !formData.name || !formData.email}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Verification Link</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

    </>
  );
}

