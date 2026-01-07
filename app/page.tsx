'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { 
  Copy, Plus, ExternalLink, Trash2, Clock, CheckCircle, AlertCircle, 
  Loader2, FileCheck, Users, Download, Settings, Crown, ChevronDown
} from 'lucide-react';

type VerificationStatus = 'pending' | 'in_progress' | 'completed' | 'expired' | 'failed';
type TabType = 'verifications' | 'applicants';

interface Verification {
  id: string;
  applicant_name: string;
  applicant_email: string;
  verification_token: string;
  status: VerificationStatus;
  created_at: string;
  expires_at: string;
  completed_at: string | null;
}

interface Applicant {
  name: string;
  email: string;
  verifications_count: number;
  last_verification: string | null;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('landlord_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('landlord_session_id', sessionId);
  }
  return sessionId;
}

const statusConfig: Record<VerificationStatus, { color: string; bgColor: string; label: string }> = {
  pending: { color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Pending' },
  in_progress: { color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'In Progress' },
  completed: { color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: 'Completed' },
  expired: { color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Expired' },
  failed: { color: 'text-red-600', bgColor: 'bg-red-50', label: 'Failed' },
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('verifications');
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchVerifications();
  }, []);

  async function fetchVerifications() {
    const sessionId = getSessionId();
    const { data, error } = await supabase
      .from('income_verifications')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVerifications(data);
      // Build applicants list from verifications
      const applicantMap = new Map<string, Applicant>();
      data.forEach(v => {
        const key = v.applicant_email;
        if (applicantMap.has(key)) {
          const existing = applicantMap.get(key)!;
          existing.verifications_count++;
          if (!existing.last_verification || v.created_at > existing.last_verification) {
            existing.last_verification = v.created_at;
          }
        } else {
          applicantMap.set(key, {
            name: v.applicant_name,
            email: v.applicant_email,
            verifications_count: 1,
            last_verification: v.created_at,
          });
        }
      });
      setApplicants(Array.from(applicantMap.values()));
    }
    setLoading(false);
  }

  async function createVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setCreating(true);
    const sessionId = getSessionId();

    const { data, error } = await supabase
      .from('income_verifications')
      .insert({
        session_id: sessionId,
        applicant_name: formData.name,
        applicant_email: formData.email,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to create verification', variant: 'destructive' });
    } else if (data) {
      setVerifications([data, ...verifications]);
      setSelectedVerification(data);
      setFormData({ name: '', email: '' });
      toast({ title: 'Created!', description: 'Verification request created' });
    }
    setCreating(false);
  }

  function copyLink(token: string) {
    const link = `${window.location.origin}/verify/${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Copied!', description: 'Link copied to clipboard' });
  }

  async function deleteVerification(id: string) {
    const { error } = await supabase.from('income_verifications').delete().eq('id', id);
    if (!error) {
      setVerifications(verifications.filter(v => v.id !== id));
      if (selectedVerification?.id === id) setSelectedVerification(null);
      toast({ title: 'Deleted', description: 'Verification removed' });
    }
  }

  // Stats
  const stats = {
    all: verifications.length,
    pending: verifications.filter(v => v.status === 'pending').length,
    completed: verifications.filter(v => v.status === 'completed').length,
    expired: verifications.filter(v => v.status === 'expired').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Tabs */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-gray-900">Income Verifier</span>
              </div>
              
              <nav className="flex gap-1">
                <button
                  onClick={() => setActiveTab('verifications')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'verifications'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Verifications
                </button>
                <button
                  onClick={() => setActiveTab('applicants')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'applicants'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Applicants
                </button>
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200">
                <Crown className="w-4 h-4 text-amber-500" />
                Upgrade to PRO
              </button>
              <button className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
                Get Started
              </button>
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {activeTab === 'verifications' ? (
        <VerificationsTab
          verifications={verifications}
          stats={stats}
          loading={loading}
          creating={creating}
          formData={formData}
          setFormData={setFormData}
          selectedVerification={selectedVerification}
          setSelectedVerification={setSelectedVerification}
          createVerification={createVerification}
          copyLink={copyLink}
          deleteVerification={deleteVerification}
        />
      ) : (
        <ApplicantsTab
          applicants={applicants}
          loading={loading}
          setActiveTab={setActiveTab}
          setFormData={setFormData}
        />
      )}
    </div>
  );
}

// Verifications Tab Component
function VerificationsTab({
  verifications, stats, loading, creating, formData, setFormData,
  selectedVerification, setSelectedVerification, createVerification, copyLink, deleteVerification
}: any) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Stats Bar */}
      <div className="flex items-center gap-4 mb-6">
        <button className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-emerald-300 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Verification</span>
        </button>
        
        <div className="flex gap-2">
          {[
            { label: 'All Verifications', value: stats.all, change: '+0%' },
            { label: 'Pending', value: stats.pending, change: '+0%' },
            { label: 'Completed', value: stats.completed, change: '+0%' },
            { label: 'Expired', value: stats.expired, change: '+0%' },
          ].map((stat, i) => (
            <div key={i} className="px-4 py-2 bg-white border border-gray-200 rounded-lg min-w-[120px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{stat.label}</span>
                <span className="text-xs text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">{stat.change}</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.value} verifications</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Form Section */}
        <div className="col-span-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Form Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <input
                    type="text"
                    className="text-2xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                    defaultValue="Verification Request"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={createVerification} className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Applicant Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Applicant Details *</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Verification Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Verification Info</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Property / Unit</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="123 Main St, Apt 4B (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Expires In</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900">
                      <option>7 days</option>
                      <option>14 days</option>
                      <option>30 days</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data to Collect */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-medium text-gray-900 mb-3">Data to Collect</h3>
                <div className="flex flex-wrap gap-3">
                  {['Income History', 'Bank Balances', 'Transaction History', 'Employment'].map((item) => (
                    <label key={item} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-emerald-500 focus:ring-emerald-500" />
                      <span className="text-sm text-emerald-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={creating || !formData.name || !formData.email}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Verification
                </button>
              </div>
            </form>
          </div>

          {/* Recent Verifications List */}
          {verifications.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">Recent Verifications</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {verifications.slice(0, 5).map((v: Verification) => {
                  const status = statusConfig[v.status];
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVerification(v)}
                      className={`px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedVerification?.id === v.id ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium">
                          {v.applicant_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{v.applicant_name}</p>
                          <p className="text-sm text-gray-500">{v.applicant_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(v.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-4">
          {/* Actions Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            {selectedVerification ? (
              <>
                <div className="pb-3 border-b border-gray-100">
                  <p className="text-sm text-gray-500">Selected</p>
                  <p className="font-medium text-gray-900">{selectedVerification.applicant_name}</p>
                </div>
                <button
                  onClick={() => copyLink(selectedVerification.verification_token)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy Verification Link
                </button>
                {selectedVerification.status === 'completed' && (
                  <a
                    href={`/report/${selectedVerification.verification_token}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    View Report
                  </a>
                )}
                <button
                  onClick={() => deleteVerification(selectedVerification.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FileCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Select a verification to see actions</p>
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
      </div>
    </div>
  );
}

// Applicants Tab Component
function ApplicantsTab({ applicants, loading, setActiveTab, setFormData }: any) {
  const [search, setSearch] = useState('');
  
  const filteredApplicants = applicants.filter((a: Applicant) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  function startVerification(applicant: Applicant) {
    setFormData({ name: applicant.name, email: applicant.email });
    setActiveTab('verifications');
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicants"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-400"
          />
        </div>
        <button
          onClick={() => setActiveTab('verifications')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Applicant
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg mb-6">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        <p className="text-sm text-amber-700">
          Applicants are stored temporarily in your browser when not logged in.{' '}
          <a href="/signin" className="underline font-medium">Sign up for free to store permanently.</a>
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-emerald-500 text-white text-left">
              <th className="px-6 py-3 font-medium">
                <div className="flex items-center gap-1">
                  Applicant Name
                  <ChevronDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Verifications</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading...
                </td>
              </tr>
            ) : filteredApplicants.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No applicants found
                </td>
              </tr>
            ) : (
              filteredApplicants.map((applicant: Applicant, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-medium text-sm">
                        {applicant.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{applicant.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{applicant.email}</td>
                  <td className="px-6 py-4 text-gray-600">{applicant.verifications_count}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => startVerification(applicant)}
                      className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                    >
                      New Verification
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
