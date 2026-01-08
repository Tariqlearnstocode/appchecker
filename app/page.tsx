'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/Toasts/use-toast';
import Link from 'next/link';
import { Plus, FileCheck, Settings, Crown } from 'lucide-react';
import { Verification } from '@/components/VerificationsTable';
import { NewVerificationTab } from '@/components/NewVerificationTab';
import { VerificationsListTab } from '@/components/VerificationsListTab';
import { ActionsSidebar } from '@/components/ActionsSidebar';

type ActiveTab = 'new' | 'all' | 'pending' | 'completed' | 'expired';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('landlord_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('landlord_session_id', sessionId);
  }
  return sessionId;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('new');
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [landlordInfo, setLandlordInfo] = useState({ name: '', email: '' });
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      // Check auth status
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Load defaults
      if (user) {
        // Load from database for logged-in users
        const { data } = await supabase
          .from('user_preferences')
          .select('company_name, email')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setLandlordInfo({ name: data.company_name || '', email: data.email || '' });
        }
      } else {
        // Load from localStorage for anonymous users
        const savedDefaults = localStorage.getItem('verification_defaults');
        if (savedDefaults) {
          const parsed = JSON.parse(savedDefaults);
          setLandlordInfo({ name: parsed.companyName || '', email: parsed.email || '' });
        }
      }
      
      fetchVerifications(user);
    }
    init();
  }, []);

  async function fetchVerifications(currentUser?: any) {
    let query = supabase.from('income_verifications').select('*');
    
    if (currentUser) {
      // Logged-in user: fetch by user_id
      query = query.eq('user_id', currentUser.id);
    } else {
      // Anonymous user: fetch by session_id
      const sessionId = getSessionId();
      query = query.eq('session_id', sessionId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data) {
      setVerifications(data);
    }
    setLoading(false);
  }

  async function createVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setCreating(true);

    const insertData: any = {
      applicant_name: formData.name,
      applicant_email: formData.email,
      landlord_name: landlordInfo.name || null,
      landlord_email: landlordInfo.email || null,
    };

    if (user) {
      // Logged-in user
      insertData.user_id = user.id;
    } else {
      // Anonymous user
      insertData.session_id = getSessionId();
    }

    const { data, error } = await supabase
      .from('income_verifications')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to create verification', variant: 'destructive' });
    } else if (data) {
      setVerifications([data, ...verifications]);
      setFormData({ name: '', email: '' });
      setSelectedVerification(data);
      toast({ title: 'Created!', description: 'Verification request created. Copy the link to send!' });
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
      setVerifications(verifications.filter((v) => v.id !== id));
      if (selectedVerification?.id === id) setSelectedVerification(null);
      toast({ title: 'Deleted', description: 'Verification removed' });
    }
  }

  // Stats
  const stats = {
    all: verifications.length,
    pending: verifications.filter((v) => v.status === 'pending').length,
    completed: verifications.filter((v) => v.status === 'completed').length,
    expired: verifications.filter((v) => v.status === 'expired').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Income Verifier</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200">
                <Crown className="w-4 h-4 text-amber-500" />
                Upgrade to PRO
              </button>
              <button className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">
                Get Started
              </button>
              <Link href="/settings" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Bar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
              activeTab === 'new'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-dashed border-gray-300 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Verification</span>
          </button>

          {(['all', 'pending', 'completed', 'expired'] as const).map((tab) => {
            const labels = {
              all: 'All Verifications',
              pending: 'Pending',
              completed: 'Completed',
              expired: 'Expired',
            };
            const colors = {
              all: 'emerald',
              pending: 'amber',
              completed: 'emerald',
              expired: 'gray',
            };
            const isActive = activeTab === tab;
            const color = colors[tab];

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg border min-w-[120px] text-left transition-all ${
                  isActive
                    ? `border-${color}-500 ring-2 ring-${color}-100 bg-white`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs ${
                      isActive ? `text-${color}-600 font-medium` : tab === 'pending' ? 'text-amber-500' : 'text-gray-500'
                    }`}
                  >
                    {labels[tab]}
                  </span>
                  <span className="text-xs text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">
                    +0%
                  </span>
                </div>
                <div className="text-lg font-semibold text-gray-900">{stats[tab]}</div>
                <div className="text-xs text-gray-400">{stats[tab]} verifications</div>
              </button>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-8">
            {activeTab === 'new' ? (
              <NewVerificationTab
                verifications={verifications}
                selectedVerification={selectedVerification}
                onSelect={setSelectedVerification}
                landlordInfo={landlordInfo}
                setLandlordInfo={setLandlordInfo}
                formData={formData}
                setFormData={setFormData}
                creating={creating}
                onSubmit={createVerification}
              />
            ) : (
              <VerificationsListTab
                verifications={verifications}
                selectedVerification={selectedVerification}
                onSelect={setSelectedVerification}
                loading={loading}
                filter={activeTab}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-4">
            <ActionsSidebar
              selectedVerification={selectedVerification}
              onCopyLink={copyLink}
              onDelete={(id) => {
                deleteVerification(id);
                setSelectedVerification(null);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
