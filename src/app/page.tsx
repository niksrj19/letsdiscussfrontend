'use client';

import { LoginScreen } from '@/components/login-screen';
import { Workspace } from '@/components/workspace';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const auth = useAuth();

  if (!auth.isReady) {
    return <main className="login-shell"><div className="login-loading"><span className="mini-spinner"/> Restoring your secure session…</div></main>;
  }

  if (!auth.user) return <LoginScreen error={auth.error} isBusy={auth.isBusy}/>;
  return <Workspace user={auth.user} isAuthBusy={auth.isBusy} onLogout={auth.logout}/>;
}
