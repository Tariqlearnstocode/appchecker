'use client';

import { Plus, Loader2, Eye, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

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
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={creating || !formData.name || !formData.email}
                className="flex-1 w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 group disabled:shadow-none"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    <span>Create Verification Link — $14.99</span>
                  </>
                )}
              </button>

              {/* Preview Report */}
              <Link
                href="/report/example"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 w-full flex items-center gap-3 bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 p-3 rounded-xl transition-all group"
              >
                {/* Document Preview Card */}
                <div className="relative w-16 h-20 bg-white border border-gray-300 rounded-md shadow-md flex-shrink-0 overflow-hidden">
                  {/* Document content lines */}
                  <div className="absolute inset-0 p-2.5 flex flex-col justify-start gap-1.5">
                    <div className="h-0.5 bg-gray-300 rounded-full w-full" />
                    <div className="h-0.5 bg-gray-300 rounded-full w-full" />
                    <div className="h-0.5 bg-gray-300 rounded-full w-4/5" />
                    <div className="h-0.5 bg-gray-300 rounded-full w-full" />
                    <div className="h-0.5 bg-gray-300 rounded-full w-3/4" />
                    <div className="h-0.5 bg-gray-300 rounded-full w-5/6" />
                    <div className="h-0.5 bg-gray-300 rounded-full w-2/3" />
                    <div className="h-0.5 bg-gray-300 rounded-full w-full" />
                  </div>
                  
                  {/* Green "Preview Report" button overlay */}
                  <div className="absolute bottom-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-lg z-10">
                    Preview Report
                  </div>
                </div>

                <div className="text-left min-w-0 flex-1">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Output</span>
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    Preview Report
                    <ArrowUpRight className="w-3 h-3 text-gray-400 group-hover:text-emerald-500 flex-shrink-0 transition-colors" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </form>
      </div>

    </>
  );
}

