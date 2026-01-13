'use client';

import { Copy, Eye, Trash2, Loader2, Link2 } from 'lucide-react';

export type VerificationStatus = 'pending' | 'in_progress' | 'completed' | 'expired' | 'failed';

export interface Verification {
  id: string;
  individual_name: string;
  individual_email: string;
  verification_token: string;
  status: VerificationStatus;
  created_at: string;
  expires_at: string;
  completed_at: string | null;
  // Requesting party info
  requested_by_name: string | null;
  requested_by_email: string | null;
  purpose: string | null;
  // Email tracking
  last_email_sent_at?: string | null;
  last_reminder_sent_at?: string | null;
  reminder_count?: number | null;
}

export const statusConfig: Record<VerificationStatus, { color: string; bgColor: string; label: string }> = {
  pending: { color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Pending' },
  in_progress: { color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'In Progress' },
  completed: { color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: 'Completed' },
  expired: { color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Expired' },
  failed: { color: 'text-red-600', bgColor: 'bg-red-50', label: 'Failed' },
};

interface VerificationsTableProps {
  verifications: Verification[];
  selectedVerification: Verification | null;
  onSelect: (verification: Verification) => void;
  onCopyLink?: (token: string) => void;
  onViewReport?: (token: string) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
  title?: string;
  showPagination?: boolean;
  maxRows?: number;
}

export function VerificationsTable({
  verifications,
  selectedVerification,
  onSelect,
  onCopyLink,
  onViewReport,
  onDelete,
  loading = false,
  title,
  showPagination = true,
  maxRows,
}: VerificationsTableProps) {
  const displayVerifications = maxRows ? verifications.slice(0, maxRows) : verifications;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{title}</h3>
          {showPagination && (
            <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-700">
              <option>Date - Newest</option>
              <option>Date - Oldest</option>
              <option>Name A-Z</option>
            </select>
          )}
        </div>
      )}

      <table className="w-full">
        <thead>
          <tr className="bg-emerald-500 text-white text-left text-sm">
            <th className="px-4 py-3 font-medium w-14">No.</th>
            <th className="px-4 py-3 font-medium">Individual</th>
            <th className="px-4 py-3 font-medium w-32">Link Created</th>
            <th className="px-4 py-3 font-medium w-32">Link Completed</th>
            <th className="px-4 py-3 font-medium w-24">Status</th>
            <th className="px-4 py-3 font-medium w-32 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading...
              </td>
            </tr>
          ) : displayVerifications.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                No verifications found.
              </td>
            </tr>
          ) : (
            displayVerifications.map((v, i) => {
              const status = statusConfig[v.status];
              const isSelected = selectedVerification?.id === v.id;
              const isCompleted = v.status === 'completed';
              return (
                <tr
                  key={v.id}
                  onClick={() => onSelect(v)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {String(i + 1).padStart(3, '0')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {v.individual_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{v.individual_name}</p>
                        <p className="text-sm text-gray-500">{v.individual_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div>
                      <div>{new Date(v.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">{new Date(v.created_at).toLocaleTimeString()}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {v.completed_at ? (
                      <div>
                        <div>{new Date(v.completed_at).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">{new Date(v.completed_at).toLocaleTimeString()}</div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {/* Copy Link */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyLink?.(v.verification_token);
                        }}
                        disabled={isCompleted}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isCompleted
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-emerald-600'
                        }`}
                        title={isCompleted ? 'User verified' : 'Copy verification link'}
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      {/* View Report */}
                      <a
                        href={isCompleted ? `/report/${v.verification_token}` : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isCompleted) e.preventDefault();
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isCompleted
                            ? 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={isCompleted ? 'View verification report' : 'Report available upon verification'}
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(v.id);
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
                        title="Delete verification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {showPagination && displayVerifications.length > 0 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <select className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 bg-white">
            <option>25</option>
            <option>50</option>
            <option>100</option>
          </select>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              {displayVerifications.length > 0
                ? `1-${displayVerifications.length}`
                : '0-0'}{' '}
              of {verifications.length}
            </span>
            <div className="flex gap-1">
              <button className="p-1 text-gray-400" disabled>
                |&lt;
              </button>
              <button className="p-1 text-gray-400" disabled>
                &lt;
              </button>
              <button className="p-1 text-gray-400" disabled>
                &gt;
              </button>
              <button className="p-1 text-gray-400" disabled>
                &gt;|
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

