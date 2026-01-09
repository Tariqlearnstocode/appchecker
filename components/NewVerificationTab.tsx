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
          <h2 className="text-xl font-semibold text-gray-900">New Verification Request</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create a verification link to send to the individual
          </p>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          {/* From / Request To Layout */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* From */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4">From *</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={landlordInfo.name}
                  onChange={(e) => setLandlordInfo({ ...landlordInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                  placeholder="Your / Company Name *"
                />
                <input
                  type="email"
                  value={landlordInfo.email}
                  onChange={(e) => setLandlordInfo({ ...landlordInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                  placeholder="E-Mail"
                />
              </div>
            </div>

            {/* Request To */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4">Request To *</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                  placeholder="Individual Name *"
                  required
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                  placeholder="E-Mail *"
                  required
                />
              </div>
            </div>
          </div>

          {/* Purpose & Settings */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4">Purpose</h3>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
                placeholder="Purpose (optional)"
              />
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4">Expires In</h3>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900">
                <option>7 days</option>
                <option>14 days</option>
                <option>30 days</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={creating || !formData.name || !formData.email}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create Verification
            </button>
          </div>
        </form>
      </div>

    </>
  );
}

