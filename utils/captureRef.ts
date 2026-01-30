const REF_REGEX = /^[a-zA-Z0-9_]{1,50}$/;

export function captureRef(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');

  if (ref && REF_REGEX.test(ref)) {
    localStorage.setItem('ref', ref);
  }
}

export function getRef(): string {
  if (typeof window === 'undefined') return 'organic';
  const ref = localStorage.getItem('ref');
  return ref && REF_REGEX.test(ref) ? ref : 'organic';
}

export function clearRef(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ref');
  }
}
