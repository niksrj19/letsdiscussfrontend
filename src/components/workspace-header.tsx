'use client';

import type { User } from '@/types/api';

export function WorkspaceHeader({ user, onLogout, isBusy }: { user: User; onLogout: () => void; isBusy: boolean }) {
  return <header className="topbar">
    <div className="breadcrumb">Workspace <span>/</span> <b>Market research</b></div>
    <div className="topbar-right">
      <span className="private-badge"><span/>Private workspace</span>
      {user.picture ? <img className="avatar user-picture" src={user.picture} alt={user.name || 'Account'} title={user.email}/> : <div className="avatar" title={user.email}>{user.name?.[0] || 'M'}</div>}
      <button className="logout-button" onClick={onLogout} disabled={isBusy}>Sign out</button>
    </div>
  </header>;
}
