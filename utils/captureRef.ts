const REF_REGEX = /^[a-zA-Z0-9_]{1,50}$/;
const UTM_REGEX = /^[a-zA-Z0-9_-]{1,255}$/;

function isValidUtm(value: string | null): boolean {
  return !!value && UTM_REGEX.test(value);
}

export function captureRef(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref && REF_REGEX.test(ref)) {
    localStorage.setItem('ref', ref);
  }

  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');
  if (isValidUtm(utmSource)) localStorage.setItem('utm_source', utmSource!);
  if (isValidUtm(utmMedium)) localStorage.setItem('utm_medium', utmMedium!);
  if (isValidUtm(utmCampaign)) localStorage.setItem('utm_campaign', utmCampaign!);
}

export function getRef(): string {
  if (typeof window === 'undefined') return 'organic';
  const ref = localStorage.getItem('ref');
  return ref && REF_REGEX.test(ref) ? ref : 'organic';
}

export interface UtmParams {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

export function getUtm(): UtmParams {
  if (typeof window === 'undefined') return {};
  const utm_source = localStorage.getItem('utm_source');
  const utm_medium = localStorage.getItem('utm_medium');
  const utm_campaign = localStorage.getItem('utm_campaign');
  return {
    utm_source: isValidUtm(utm_source) ? utm_source : null,
    utm_medium: isValidUtm(utm_medium) ? utm_medium : null,
    utm_campaign: isValidUtm(utm_campaign) ? utm_campaign : null,
  };
}

export function clearRef(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ref');
    localStorage.removeItem('utm_source');
    localStorage.removeItem('utm_medium');
    localStorage.removeItem('utm_campaign');
  }
}
