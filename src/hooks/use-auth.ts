'use client';

import { useCallback, useEffect, useState } from 'react';
import { notifySessionExpired, subscribeToSessionExpired } from '@/lib/auth-events';
import { getCurrentUser, signInWithGoogle, signOut } from '@/services/auth-service';
import type { User } from '@/types/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const restore = () => { getCurrentUser().then((currentUser) => { if (!cancelled) setUser(currentUser); }).catch(() => { if (!cancelled) setUser(null); }).finally(() => { if (!cancelled) setIsReady(true); }); };
    const clearExpired = () => setUser(null);
    restore();
    const unsubscribeExpiry = subscribeToSessionExpired(clearExpired);
    return () => { cancelled = true; unsubscribeExpiry(); };
  }, []);

  useEffect(() => {
    if (!isReady || user) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to your OAuth web client ID.');
      return;
    }

    let cancelled = false;
    const renderButton = () => {
      const container = document.getElementById('google-sign-in-button');
      if (cancelled || !window.google || !container) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setIsBusy(true);
          setError('');
          try { setUser(await signInWithGoogle(credential)); }
          catch (reason) { setError(reason instanceof Error ? reason.message : 'Google sign-in failed.'); }
          finally { setIsBusy(false); }
        },
      });
      container.innerHTML = '';
      window.google.accounts.id.renderButton(container, {
        type: 'standard', theme: 'outline', size: 'large', shape: 'rectangular', text: 'signin_with', width: 320,
      });
    };

    if (window.google) renderButton();
    else {
      let script = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = 'true';
        document.head.appendChild(script);
      }
      script.addEventListener('load', renderButton);
      return () => { cancelled = true; script?.removeEventListener('load', renderButton); };
    }

    return () => { cancelled = true; };
  }, [isReady, user]);

  const logout = useCallback(async () => {
    setIsBusy(true);
    try { await signOut(); }
    catch { notifySessionExpired(); }
    finally { setIsBusy(false); }
  }, []);

  return { user, isReady, isBusy, error, logout };
}
