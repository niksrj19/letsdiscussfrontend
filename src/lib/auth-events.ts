export function notifySessionExpired(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('marketlens:session-expired'));
}

export function subscribeToSessionExpired(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('marketlens:session-expired', callback);
  return () => window.removeEventListener('marketlens:session-expired', callback);
}

