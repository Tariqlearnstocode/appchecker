'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromPaymentFlow?: boolean; // If true, buttons route to checkout instead of home
}

export function PricingModal({ isOpen, onClose, fromPaymentFlow = false }: PricingModalProps) {
  const { user } = useAuth();

  const handleCheckout = async (priceType: 'per_verification' | 'starter' | 'pro') => {
    console.log('handleCheckout called with:', priceType);
    console.log('User from context:', user?.id);
    
    try {
      if (!user) {
        console.log('No user, redirecting to signin');
        window.location.href = '/signin?redirect=' + encodeURIComponent(window.location.pathname);
        return;
      }

      console.log('Calling checkout API...');
      // User is signed in, proceed with checkout
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      });
      
      console.log('Checkout response status:', response.status);
      const result = await response.json();
      console.log('Checkout result:', result);
      
      if (result.url) {
        console.log('Redirecting to:', result.url);
        window.location.href = result.url;
      } else {
        console.error('No URL in checkout response:', result);
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred. Please try again.');
    }
  };
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/enterprise/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        alert(result.error || 'Failed to submit inquiry');
      } else {
        alert('Thank you! We\'ve received your inquiry and will contact you shortly. Check your email for a confirmation and demo scheduling link.');
        setEmail('');
        onClose();
      }
    } catch (error) {
      alert('Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transparent Pricing</h2>
            <p className="text-sm text-gray-500 mt-1">
              No hidden fees. No surprises. Only pay for successful verifications.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Per Verification */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-1">Pay as you go</p>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">$14.99</span>
                  <span className="text-gray-600 text-sm ml-1">per verification</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">$14.99 per verification</div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>No monthly commitment</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Pay only for what you use</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  // Always check auth and route to checkout
                  await handleCheckout('per_verification');
                }}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Starter */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-1">Small teams</p>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">$59</span>
                  <span className="text-gray-600 text-sm ml-1">/month</span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>10 verifications included</span>
                </div>
                <div className="text-xs text-gray-500 ml-5">$5.90 per verification</div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Overage: $8.99 per additional</span>
                </div>
              </div>
              <button
                onClick={() => handleCheckout('starter')}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Pro - Most Popular */}
            <div className="border-2 border-emerald-500 rounded-xl p-6 relative bg-emerald-50/30 hover:border-emerald-600 transition-colors">
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-medium rounded">
                  ★ Most Popular
                </span>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-1">Growing teams</p>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">$199</span>
                  <span className="text-gray-600 text-sm ml-1">/month</span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>50 verifications included</span>
                </div>
                <div className="text-xs text-gray-500 ml-5">$3.98 per verification</div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>Overage: $4.99 per additional</span>
                </div>
              </div>
              <button
                onClick={() => handleCheckout('pro')}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Enterprise Section */}
          <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Features */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-medium rounded">
                    ✔ Best for teams
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Enterprise
                </h3>
                <p className="text-sm text-gray-600 mb-1 font-medium">
                  Custom plans for large organizations
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Volume pricing, team access, and compliance controls for high-throughput verification workflows.
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✔</span>
                    <span>Custom monthly limits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✔</span>
                    <span>Priority support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✔</span>
                    <span>Team access (multi-user)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✔</span>
                    <span>API access (optional)</span>
                  </div>
                </div>
              </div>

              {/* Right: Contact Form */}
              <div className="bg-white rounded-lg p-5 border border-gray-200">
                <label htmlFor="enterprise-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Work email
                </label>
                <form onSubmit={handleEnterpriseSubmit} className="space-y-3">
                  <input
                    id="enterprise-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Work email"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium rounded-lg transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Request pricing'}
                  </button>
                  <div className="text-center">
                    <a
                      href={process.env.NEXT_PUBLIC_CALENDLY_LINK || 'https://calendly.com/your-calendly-link'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      Schedule a demo
                    </a>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="mb-8 border-2 border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Feature Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pricing</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Per Verification</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Starter</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Pro</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Enterprise</th>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Verifications included per month</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-500">Pay as you go</td>
                    <td className="px-6 py-3 text-center text-sm font-medium text-gray-900">10</td>
                    <td className="px-6 py-3 text-center text-sm font-medium text-gray-900">50</td>
                    <td className="px-6 py-3 text-center text-sm font-medium text-gray-900">Custom</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Cost per report</td>
                    <td className="px-6 py-3 text-center text-sm font-medium text-gray-900">$14.99</td>
                    <td className="px-6 py-3 text-center text-sm font-medium text-gray-900">$5.90</td>
                    <td className="px-6 py-3 text-center text-sm font-medium text-gray-900">$3.98</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-500">Custom</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Cost per overage</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-400">—</td>
                    <td className="px-6 py-3 text-center text-sm font-medium text-gray-900">$8.99</td>
                    <td className="px-6 py-3 text-center text-sm font-medium text-gray-900">$4.99</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-500">Custom</td>
                  </tr>
                  </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Core Features */}
                  <tr className="bg-white">
                    <td colSpan={5} className="px-6 py-2 bg-gray-50">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Core Features</span>
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Transaction history</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-700">3 months</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-700">12 months</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-700">12 months</td>
                    <td className="px-6 py-3 text-center text-sm text-gray-700">12 months</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Bank-connected income verification</td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Applicant-authorized data access</td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Primary income source detection</td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Payroll vs P2P classification</td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Confidence scoring</td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
            
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Secure data handling (encrypted, auto-deleted)</td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">PDF export</td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                  
                  {/* Subscription Features */}
                  <tr className="bg-white">
                    <td colSpan={5} className="px-6 py-2 bg-gray-50">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subscription Features</span>
                    </td>
                  </tr>
                  
           
            
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Email verification link to applicant</td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Send invitation reminders</td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Completion notifications (email)</td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Multi-user team access</td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Verification archive (1 year)</td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                  <tr className="bg-white opacity-60">
                    <td className="px-6 py-3 text-sm text-gray-700 flex items-center gap-2">
                      Analytics dashboard
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Coming soon</span>
                    </td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                  </tr>
                  <tr className="bg-white opacity-60">
                    <td className="px-6 py-3 text-sm text-gray-700 flex items-center gap-2">
                      Co-applicant verification
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Coming soon</span>
                    </td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                  </tr>
                  
                  {/* Enterprise Features */}
                  <tr className="bg-white">
                    <td colSpan={5} className="px-6 py-2 bg-gray-50">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Enterprise Features</span>
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Custom reports</td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Dedicated account manager</td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">Custom branding (logo on verifications)</td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">API access</td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
            
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm text-gray-700">White-label solution</td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-gray-400">—</span></td>
                    <td className="px-6 py-3 text-center"><span className="text-emerald-500">✓</span></td>
                  </tr>
                 
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
