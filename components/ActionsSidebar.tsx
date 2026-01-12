'use client';

import { Copy, Eye, Trash2, FileCheck, Crown, CheckCircle, Link2, Mail, Loader2, Folder, Bell, Clock, Users } from 'lucide-react';
import { Verification } from './VerificationsTable';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface ActionsSidebarProps {
  selectedVerification: Verification | null;
  onCopyLink: (token: string) => void;
  onDelete: (id: string) => void;
  onEmailSent?: () => void;
  onUpgradeClick?: () => void;
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

export function ActionsSidebar({
  selectedVerification,
  onCopyLink,
  onDelete,
  onEmailSent,
  onUpgradeClick,
}: ActionsSidebarProps) {
  const isCompleted = selectedVerification?.status === 'completed';
  const isExpired = selectedVerification?.status === 'expired';
  const isActive = selectedVerification && !isCompleted && !isExpired;
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const { toast } = useToast();
  
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

  async function handleSendReminder() {
    if (!selectedVerification) return;
    
    setSendingReminder(true);
    try {
      const response = await fetch('/api/verifications/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_id: selectedVerification.id }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send reminder',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reminder sent!',
          description: `Reminder email sent to ${selectedVerification.individual_email}`,
        });
        onEmailSent?.();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reminder',
        variant: 'destructive',
      });
    } finally {
      setSendingReminder(false);
    }
  }

  async function handleUpdateEmail() {
    if (!selectedVerification || !newEmail) return;
    
    setUpdatingEmail(true);
    try {
      const response = await fetch('/api/verifications/update-email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          verification_id: selectedVerification.id,
          individual_email: newEmail,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update email',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email updated!',
          description: `Applicant email updated to ${newEmail}`,
        });
        setEditingEmail(false);
        setNewEmail('');
        onEmailSent?.(); // Refresh the verification data
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update email',
        variant: 'destructive',
      });
    } finally {
      setUpdatingEmail(false);
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
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Selected</p>
              <p className="font-semibold text-gray-900 text-base">
                {selectedVerification.individual_name.toUpperCase()}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-600">{selectedVerification.individual_email}</p>
                {isActive && (
                  <button
                    onClick={() => {
                      setEditingEmail(true);
                      setNewEmail(selectedVerification.individual_email);
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
                    title="Edit email"
                  >
                    Edit
                  </button>
                )}
              </div>
              {editingEmail && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="New email address"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={updatingEmail}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleUpdateEmail}
                      disabled={updatingEmail || !newEmail}
                      className="flex-1 px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium rounded transition-colors"
                    >
                      {updatingEmail ? 'Updating...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingEmail(false);
                        setNewEmail('');
                      }}
                      disabled={updatingEmail}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-3">
                {getStatusBadge()}
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
                      Send Verification Link
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

      {/* Additional Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Folder className="w-4 h-4 text-amber-500" />
          <span className="font-medium text-gray-900">Additional Actions</span>
        </div>
        <div className="space-y-2">
          <button
            onClick={handleSendReminder}
            disabled={!selectedVerification || !isActive || sendingReminder}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingReminder ? (
              <>
                <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                <span className="text-sm text-gray-700">Sending...</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Email reminder to applicant</span>
              </>
            )}
          </button>
          
          <button
            disabled
            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors opacity-60 cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Enable Auto-Reminders</span>
            </div>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">Pro</span>
          </button>
          
          <button
            disabled
            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors opacity-60 cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Team access</span>
            </div>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">Pro</span>
          </button>
          
          {/* Delete */}
          {selectedVerification && (
            <button
              onClick={() => onDelete(selectedVerification.id)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-red-50 text-red-600 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete verification</span>
            </button>
          )}
        </div>
        <button
          onClick={() => {
            if (onUpgradeClick) {
              onUpgradeClick();
            } else {
              window.location.href = '/settings?tab=subscription';
            }
          }}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}

