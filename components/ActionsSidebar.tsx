'use client';

import { Copy, Eye, Trash2, FileCheck, Crown, CheckCircle, Link2 } from 'lucide-react';
import { Verification } from './VerificationsTable';

interface ActionsSidebarProps {
  selectedVerification: Verification | null;
  onCopyLink: (token: string) => void;
  onDelete: (id: string) => void;
}

export function ActionsSidebar({
  selectedVerification,
  onCopyLink,
  onDelete,
}: ActionsSidebarProps) {
  const isCompleted = selectedVerification?.status === 'completed';
  
  return (
    <div className="space-y-4">
      {/* Actions Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        {selectedVerification ? (
          <>
            <div className="pb-3 border-b border-gray-100 mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Selected</p>
              <p className="font-medium text-gray-900 mt-1">
                {selectedVerification.applicant_name}
              </p>
              <p className="text-sm text-gray-500">{selectedVerification.applicant_email}</p>
            </div>
            <div className="space-y-2">
              {/* Copy Verification Link */}
              {isCompleted ? (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed">
                  <CheckCircle className="w-4 h-4" />
                  User Verified
                </div>
              ) : (
                <button
                  onClick={() => onCopyLink(selectedVerification.verification_token)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  Copy Verification Link
                </button>
              )}
              
              {/* View Verification Report */}
              {isCompleted ? (
                <a
                  href={`/report-premium/${selectedVerification.verification_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Verification Report
                </a>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed text-sm">
                  <Eye className="w-4 h-4" />
                  Report available upon verification
                </div>
              )}
              
              <button
                onClick={() => onDelete(selectedVerification.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <FileCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">
              Create or select a verification to see actions
            </p>
          </div>
        )}
      </div>

      {/* Pro Features */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-amber-500" />
          <span className="font-medium text-gray-900">Pro Features</span>
        </div>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg opacity-60 cursor-not-allowed">
            <span>📧</span> Email to Applicant
          </button>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-500 rounded-lg opacity-60 cursor-not-allowed">
            <span>🔔</span> Send Reminder
          </button>
        </div>
        <button className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 border-2 border-emerald-500 text-emerald-600 font-medium rounded-lg hover:bg-emerald-50 transition-colors">
          <Crown className="w-4 h-4" />
          Unlock Pro Features
        </button>
      </div>
    </div>
  );
}

