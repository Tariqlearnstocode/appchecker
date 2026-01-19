'use client';

import { Copy, Eye, FileCheck, Crown, CheckCircle, Link2, Mail, Loader2 } from 'lucide-react';
import { Verification } from './VerificationsTable';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface ActionsSidebarProps {
  selectedVerification: Verification | null;
  onCopyLink: (token: string) => void;
  onDelete: (id: string) => void;
  onEmailSent?: () => void;
  onUpgradeClick?: () => void;
  startEditing?: boolean;
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function ActionsSidebar({
  selectedVerification,
  onCopyLink,
  onDelete,
  onEmailSent,
  onUpgradeClick,
  startEditing = false,
}: ActionsSidebarProps) {
  const isCompleted = selectedVerification?.status === 'completed';
  const isExpired = selectedVerification?.status === 'expired';
  const isActive = selectedVerification && !isCompleted && !isExpired;
  const [sendingEmail, setSendingEmail] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    individual_name: '',
    individual_email: '',
    requested_by_name: '',
    requested_by_email: '',
  });
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  
  // Sync edit form when selected verification changes
  useEffect(() => {
    if (selectedVerification && !editing) {
      setEditForm({
        individual_name: selectedVerification.individual_name,
        individual_email: selectedVerification.individual_email,
        requested_by_name: selectedVerification.requested_by_name || '',
        requested_by_email: selectedVerification.requested_by_email || '',
      });
    }
  }, [selectedVerification, editing]);

  // Start editing when startEditing prop is true
  useEffect(() => {
    if (startEditing && selectedVerification && isActive) {
      setEditing(true);
      setEditForm({
        individual_name: selectedVerification.individual_name,
        individual_email: selectedVerification.individual_email,
        requested_by_name: selectedVerification.requested_by_name || '',
        requested_by_email: selectedVerification.requested_by_email || '',
      });
    }
  }, [startEditing, selectedVerification, isActive]);
  
  async function handleSendEmail() {
    if (!selectedVerification) return;
    
    setSendingEmail(true);
    try {
      const response = await fetch('/api/verifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_id: selectedVerification.id }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send email',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email sent!',
          description: `Verification link sent to ${selectedVerification.individual_email}`,
        });
        onEmailSent?.();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleUpdateVerification() {
    if (!selectedVerification) return;
    
    if (!editForm.individual_name.trim() || !editForm.individual_email.trim()) {
      toast({
        title: 'Error',
        description: 'Applicant name and email are required',
        variant: 'destructive',
      });
      return;
    }
    
    setUpdating(true);
    try {
      const response = await fetch('/api/verifications/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          verification_id: selectedVerification.id,
          individual_name: editForm.individual_name,
          individual_email: editForm.individual_email,
          requested_by_name: editForm.requested_by_name || null,
          requested_by_email: editForm.requested_by_email || null,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update verification',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Verification updated!',
          description: 'Verification details have been updated successfully',
        });
        setEditing(false);
        onEmailSent?.(); // Refresh the verification data
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update verification',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  }
  
  const getStatusBadge = () => {
    if (!selectedVerification) return null;
    
    const status = selectedVerification.status;
    if (status === 'completed') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">Completed</span>
        </div>
      );
    } else if (status === 'expired') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">Expired</span>
        </div>
      );
    } else if (status === 'pending') {
      const lastSent = selectedVerification.last_email_sent_at;
      const timeAgo = lastSent ? formatTimeAgo(lastSent) : null;
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">Pending</span>
          {timeAgo && <span className="text-sm text-gray-600">Sent {timeAgo}</span>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Selected User Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        {selectedVerification ? (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Selected</p>
                {isActive && !editing && (
                  <button
                    onClick={() => {
                      setEditing(true);
                      setEditForm({
                        individual_name: selectedVerification.individual_name,
                        individual_email: selectedVerification.individual_email,
                        requested_by_name: selectedVerification.requested_by_name || '',
                        requested_by_email: selectedVerification.requested_by_email || '',
                      });
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
                    title="Edit verification details"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {!editing ? (
                <>
                  <p className="font-semibold text-gray-900 text-base">
                    {selectedVerification.individual_name.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{selectedVerification.individual_email}</p>
                </>
              ) : (
                <div className="mt-2 space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Applicant Name *
                    </label>
                    <input
                      type="text"
                      value={editForm.individual_name}
                      onChange={(e) => setEditForm({ ...editForm, individual_name: e.target.value })}
                      placeholder="Applicant name"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      disabled={updating}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Applicant Email *
                    </label>
                    <input
                      type="email"
                      value={editForm.individual_email}
                      onChange={(e) => setEditForm({ ...editForm, individual_email: e.target.value })}
                      placeholder="applicant@example.com"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      disabled={updating}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={editForm.requested_by_name}
                      onChange={(e) => setEditForm({ ...editForm, requested_by_name: e.target.value })}
                      placeholder="Company name (optional)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      disabled={updating}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Company Email
                    </label>
                    <input
                      type="email"
                      value={editForm.requested_by_email}
                      onChange={(e) => setEditForm({ ...editForm, requested_by_email: e.target.value })}
                      placeholder="company@example.com (optional)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      disabled={updating}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleUpdateVerification}
                      disabled={updating || !editForm.individual_name.trim() || !editForm.individual_email.trim()}
                      className="flex-1 px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium rounded transition-colors"
                    >
                      {updating ? 'Updating...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditForm({
                          individual_name: '',
                          individual_email: '',
                          requested_by_name: '',
                          requested_by_email: '',
                        });
                      }}
                      disabled={updating}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-3 space-y-2">
                {getStatusBadge()}
                {!isCompleted && selectedVerification.last_email_sent_at && (
                  <p className="text-xs text-gray-500">
                    Last email sent at: {formatDateTime(selectedVerification.last_email_sent_at)}
                  </p>
                )}
                {isCompleted && selectedVerification.completed_at && (
                  <p className="text-xs text-gray-500">
                    Completed at: {formatDateTime(selectedVerification.completed_at)}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {/* Send Verification Link via Email - Only for active (pending/in_progress) */}
              {isActive && (
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium rounded-lg transition-colors"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      {selectedVerification.last_email_sent_at ? 'Resend Verification Link' : 'Send Verification Link'}
                    </>
                  )}
                </button>
              )}
              
              {/* Copy Verification Link - Only for active verifications */}
              {isActive && (
                <button
                  onClick={() => onCopyLink(selectedVerification.verification_token)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  Copy Verification Link
                </button>
              )}
              
              {/* Expired message */}
              {isExpired && (
                <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-sm text-gray-600">
                    This verification link has expired
                  </p>
                </div>
              )}
              
              {/* View Report - For completed or expired (if report exists) */}
              {(isCompleted || (isExpired && selectedVerification.completed_at)) && (
                <a
                  href={`/report/${selectedVerification.verification_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Report
                </a>
              )}
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
    </div>
  );
}

