'use client';

import { FormEvent, useState } from 'react';
import { Icon } from '@/components/icon';
import type { Source } from '@/types/api';

type Props = {
  sources: Source[];
  isLoading: boolean;
  isIndexing: boolean;
  deletingId: string | null;
  error: string;
  apiOnline: boolean | null;
  onAdd: (url: string) => Promise<unknown>;
  onDelete: (source: Source) => Promise<unknown>;
};

export function SourceSidebar({ sources, isLoading, isIndexing, deletingId, error, apiOnline, onAdd, onDelete }: Props) {
  const [url, setUrl] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!url.trim() || sources.length >= 4) return;
    try { await onAdd(url.trim()); setUrl(''); } catch { /* The hook exposes the request error. */ }
  }

  return <aside className="sidebar">
    <a className="brand" href="#"><span className="brand-mark"><Icon name="chart" size={20}/></span><span>market<span className="brand-light">lens</span><small>RESEARCH WORKSPACE</small></span></a>
    <div className="side-label">YOUR WORKSPACE</div>
    <div className="workspace-item active"><span className="workspace-icon"><Icon name="chart" size={17}/></span><span>Market research</span><span className="active-dot"/></div>
    <div className="side-divider"/>
    <div className="source-heading"><div><span className="side-label">KNOWLEDGE SOURCES</span><p>Ground your answers in trusted research.</p></div><span className="count-pill">{sources.length}/4</span></div>
    <form className="add-source" onSubmit={submit}>
      <label htmlFor="source-url">Add a market URL</label>
      <div className="input-wrap"><Icon name="link" size={16}/><input id="source-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste an article or report URL" type="url" disabled={isIndexing || sources.length >= 4}/></div>
      <button className="add-button" disabled={isIndexing || sources.length >= 4 || !url.trim()}><Icon name="plus" size={16}/>{isIndexing ? 'Indexing source…' : 'Add source'}</button>
    </form>
    {error && <div className="error-note">{error}</div>}
    <div className="source-list-title">INDEXED SOURCES <span>{sources.length}</span></div>
    <div className="source-list">
      {isLoading && <div className="source-empty"><span className="mini-spinner"/> Checking your library…</div>}
      {!isLoading && sources.length === 0 && <div className="source-empty"><span className="empty-link"><Icon name="link" size={17}/></span><span>No sources yet.<br/>Add a URL to get started.</span></div>}
      {sources.map((source, index) => <SourceCard key={source.id} source={source} index={index} deleting={deletingId === source.id} disabled={deletingId !== null} onDelete={() => onDelete(source)}/>) }
    </div>
    <div className="sidebar-bottom"><span className={`api-indicator ${apiOnline ? 'online' : apiOnline === false ? 'offline' : ''}`}><i/>{apiOnline ? 'API connected' : apiOnline === false ? 'API unavailable' : 'Connecting…'}</span><span className="backend-label">LOCAL RESEARCH API</span></div>
  </aside>;
}

function SourceCard({ source, index, deleting, disabled, onDelete }: { source: Source; index: number; deleting: boolean; disabled: boolean; onDelete: () => void }) {
  let hostname = source.url;
  try { hostname = new URL(source.url).hostname.replace(/^www\./, ''); } catch { /* Display the original URL if malformed. */ }

  return <article className="source-card">
    <div className="source-card-top"><span className="source-number">0{index + 1}</span><div className="source-actions"><span className="indexed"><i/> Indexed</span><button className="delete-source" type="button" aria-label={`Delete ${source.title || source.url}`} title="Delete source and its indexed passages" disabled={disabled} onClick={onDelete}>{deleting ? <span className="mini-spinner"/> : <Icon name="trash" size={14}/>}</button></div></div>
    <a className="source-title" href={source.url} target="_blank" rel="noreferrer">{source.title || source.url}</a>
    <div className="source-domain">{hostname}</div>
    <div className="source-meta"><span>{source.chunks} passages</span><span>·</span><span>{new Date(source.indexedAt).toLocaleDateString()}</span></div>
  </article>;
}
