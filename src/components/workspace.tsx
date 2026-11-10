'use client';

import { useSources } from '@/hooks/use-sources';
import { SourceSidebar } from '@/components/source-sidebar';
import { ChatPanel } from '@/components/chat-panel';
import { WorkspaceHeader } from '@/components/workspace-header';
import type { User } from '@/types/api';

export function Workspace({ user, isAuthBusy, onLogout }: { user: User; isAuthBusy: boolean; onLogout: () => void }) {
  const sources = useSources(true);

  return <main className="shell">
    <SourceSidebar
      sources={sources.sources}
      isLoading={sources.isLoading}
      isIndexing={sources.isIndexing}
      deletingId={sources.deletingId}
      error={sources.error}
      apiOnline={sources.isLoading ? null : sources.apiOnline}
      onAdd={sources.add}
      onDelete={sources.remove}
    />
    <section className="main-panel">
      <WorkspaceHeader user={user} onLogout={onLogout} isBusy={isAuthBusy}/>
      <ChatPanel user={user}/>
    </section>
  </main>;
}
