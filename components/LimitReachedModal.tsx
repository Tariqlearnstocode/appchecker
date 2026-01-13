'use client';

import { useState } from 'react';
import { X, ArrowUp, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsage: number;
  limit: number;
  plan: 'starter' | 'pro';
  onUpgrade?: () => void;
  onOneOffPurchase?: () => void;
}

export function LimitReachedModal({
  isOpen,
  onClose,
  currentUsage,
  limit,
  plan,
  onUpgrade,
  onOneOffPurchase,
}: LimitReachedModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<'upgrade' | 'purchase' | null>(null);

  if (!isOpen) return null;

  const nextPlan = plan === 'starter' ? 'pro' : 'enterprise';
  const nextPlanPrice = plan === 'starter' ? '$199/month' : 'Contact us';
  const nextPlanLimit = plan === 'starter' ? 50 : 'Unlimited';

  const handleUpgrade = async () => {
    if (nextPlan === 'enterprise') {
      // Redirect to enterprise contact
      window.location.href = '/?enterprise=true';
      return;
    }

    setLoading('upgrade');
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: nextPlan }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create checkout',
          variant: 'destructive',
        });
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start upgrade',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleOneOffPurchase = async () => {
    setLoading('purchase');
    try {
      // For one-off purchase, we'll create a checkout session
      // or trigger the verification creation flow which will handle payment
      if (onOneOffPurchase) {
        onOneOffPurchase();
      }
      // Close modal - user will retry verification creation which will trigger payment
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Verification Limit Reached
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              You've used all {limit} verifications included in your {plan} plan this month.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Usage Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Usage this month</span>
              <span className="text-sm text-gray-500">{currentUsage} / {limit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {/* Upgrade Option */}
            <button
              onClick={handleUpgrade}
              disabled={loading !== null}
              className="w-full flex items-center justify-between p-4 bg-emerald-50 border-2 border-emerald-500 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <ArrowUp className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    Upgrade to {nextPlan === 'pro' ? 'Pro' : 'Enterprise'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {nextPlan === 'pro' ? `${nextPlanLimit} verifications/month` : 'Unlimited verifications'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-emerald-600">{nextPlanPrice}</div>
                {loading === 'upgrade' && <Loader2 className="w-4 h-4 animate-spin text-emerald-600 mt-1" />}
              </div>
            </button>

            {/* One-Off Purchase Option */}
            <button
              onClick={handleOneOffPurchase}
              disabled={loading !== null}
              className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Buy one verification</div>
                  <div className="text-sm text-gray-600">Pay-as-you-go option</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">$14.99</div>
                {loading === 'purchase' && <Loader2 className="w-4 h-4 animate-spin text-gray-600 mt-1" />}
              </div>
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your verification limit will reset at the start of your next billing period.
          </p>
        </div>
      </div>
    </div>
  );
}
