import { apiRequest } from '@/lib/api-client';
import { notifySessionExpired } from '@/lib/auth-events';
import type { User } from '@/types/api';

export async function signInWithGoogle(idToken: string): Promise<User> {
  const response = await apiRequest<{ user: User }>('/auth/google', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({ idToken }),
  });
  return response.user;
}

export async function getCurrentUser(): Promise<User | null> {
  const response = await apiRequest<{ user: User | null }>('/auth/session', { authenticated: false });
  return response.user;
}

export async function signOut(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    notifySessionExpired();
  }
}
