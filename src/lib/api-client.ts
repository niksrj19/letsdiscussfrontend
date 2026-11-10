import { notifySessionExpired } from './auth-events';

type RequestOptions = RequestInit & { authenticated?: boolean };

let refreshInFlight: Promise<boolean> | null = null;

function refreshCookieSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
  }).then((response) => response.ok).catch(() => false).finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { authenticated = true, ...requestOptions } = options;
  const send = () => fetch(`/api${path}`, {
    ...requestOptions,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...requestOptions.headers },
  });
  let response = await send();
  if (response.status === 401 && authenticated) {
    const refreshed = await refreshCookieSession();
    if (refreshed) response = await send();
    if (!refreshed || response.status === 401) notifySessionExpired();
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message;
    throw new Error(message || `Request failed (${response.status})`);
  }
  return payload as T;
}
