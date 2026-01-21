// Google Analytics event tracking utility
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Track a Google Analytics event
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

export const analytics = {
  // CTA Performance
  ctaClicked: (params: { cta_name: string; location: string }) =>
    trackEvent('cta_clicked', params),

  // Form tracking
  formStarted: () => trackEvent('form_started', { form_type: 'verification' }),

  // Modal tracking
  modalOpened: (params: { modal_type: 'pricing' | 'auth' | 'limit_reached' }) =>
    trackEvent('modal_opened', params),

  // Content engagement
  sampleReportViewed: () => trackEvent('sample_report_viewed'),
};
